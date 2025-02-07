// src/components/synth/SynthEngine.ts
import * as Tone from 'tone';
import { Note, SynthSettings } from '@/types/synth';
import { MIDI_NOTES } from '@/constants/midi';

const VOICE_LIMIT = 16;
const PARAMETER_SMOOTHING_MS = 50;
const PORTAMENTO_TIME = 0.05;

interface Voice {
  // Depending on modulation mode, a voice can be a simple synth or one of the specialized FM/AM synths.
  synth: Tone.Synth | Tone.FMSynth | Tone.AMSynth;
  note: Note | null;
  startTime: number;
  isActive: boolean;
}

interface AudioNodes {
  filter: Tone.Filter;
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  distortion: Tone.Distortion;
  mainBus: Tone.Volume;
  limiter: Tone.Limiter;
  lfo: Tone.LFO;
  lfoMultiplier: Tone.Gain;
}

export class SynthEngine {
  private voices: Voice[];
  private nodes: AudioNodes;
  private settings: SynthSettings;

  constructor(initialSettings: SynthSettings) {
    this.settings = initialSettings;
    this.voices = [];
    
    // ─────────────────────────────────────────────
    // Signal Chain: Main Bus & Limiter
    // ─────────────────────────────────────────────
    const mainBus = new Tone.Volume(initialSettings.volume);
    const limiter = new Tone.Limiter(-0.1).toDestination();
    mainBus.connect(limiter);
    
    // ─────────────────────────────────────────────
    // Signal Chain: Filter, Reverb, Delay, Distortion
    // ─────────────────────────────────────────────
    const filter = new Tone.Filter({
      frequency: initialSettings.filter.frequency,
      type: initialSettings.filter.type as BiquadFilterType,
      Q: initialSettings.filter.Q,
      rolloff: -24
    }).connect(mainBus);

    const reverb = new Tone.Reverb({
      decay: 2,
      preDelay: 0.01,
      wet: initialSettings.effects.reverb.enabled ? initialSettings.effects.reverb.wet : 0
    }).connect(filter);

    const delay = new Tone.FeedbackDelay({
      delayTime: 0.25,
      feedback: 0.3,
      wet: initialSettings.effects.delay.enabled ? initialSettings.effects.delay.wet : 0
    }).connect(reverb);

    const distortion = new Tone.Distortion({
      distortion: 0.8,
      wet: initialSettings.effects.distortion.enabled ? initialSettings.effects.distortion.wet : 0,
      oversample: '4x'
    }).connect(delay);

    // ─────────────────────────────────────────────
    // LFO Modulation Chain with Multiplier for Smooth Depth Control
    // ─────────────────────────────────────────────
    // Use fixed LFO output range:
    // For pitch modulation, use bipolar (-1 to 1); otherwise, unipolar (0 to 1).
    let lfoMin = 0, lfoMax = 1;
    if (initialSettings.lfo.target === 'pitch') {
      lfoMin = -1;
      lfoMax = 1;
    }
    const lfo = new Tone.LFO({
      frequency: initialSettings.lfo.frequency,
      min: lfoMin,
      max: lfoMax,
      type: initialSettings.lfo.type as Tone.ToneOscillatorType
    }).start();

    // Create a gain (multiplier) node to scale the LFO’s output smoothly.
    const lfoMultiplier = new Tone.Gain(initialSettings.lfo.depth);

    // Route the LFO through the multiplier (do not connect directly to targets).
    lfo.connect(lfoMultiplier);

    this.nodes = { filter, reverb, delay, distortion, mainBus, limiter, lfo, lfoMultiplier };

    // ─────────────────────────────────────────────
    // Voice Pool Creation: Support Subtractive, FM, and AM Modes
    // ─────────────────────────────────────────────
    for (let i = 0; i < VOICE_LIMIT; i++) {
      let synth: Tone.Synth | Tone.FMSynth | Tone.AMSynth;
      // Check if modulation is enabled in the oscillator settings.
      if (initialSettings.oscillator.modulation && initialSettings.oscillator.modulation.type === 'FM') {
        // For FM synthesis, use Tone.FMSynth.
        synth = new Tone.FMSynth({
          harmonicity: initialSettings.oscillator.modulation.amount,
          modulationIndex: initialSettings.oscillator.modulation.amount,
          oscillator: {
            type: initialSettings.oscillator.type as Tone.ToneOscillatorType,
            portamento: PORTAMENTO_TIME
          },
          envelope: initialSettings.envelope,
        }).connect(distortion);
      } else if (initialSettings.oscillator.modulation && initialSettings.oscillator.modulation.type === 'AM') {
        // For AM synthesis, use Tone.AMSynth.
        synth = new Tone.AMSynth({
          oscillator: {
            type: initialSettings.oscillator.type as Tone.ToneOscillatorType,
            portamento: PORTAMENTO_TIME
          },
          envelope: initialSettings.envelope,
          harmonicity: initialSettings.oscillator.modulation.amount,
        }).connect(distortion);
      } else {
        // Default: use a standard subtractive synth.
        synth = new Tone.Synth({
          oscillator: {
            type: initialSettings.oscillator.type as Tone.ToneOscillatorType,
            portamento: PORTAMENTO_TIME
          },
          envelope: initialSettings.envelope,
        }).connect(distortion);
      }

      this.voices.push({
        synth,
        note: null,
        startTime: 0,
        isActive: false
      });
    }

    // ─────────────────────────────────────────────
    // Initial LFO Routing
    // ─────────────────────────────────────────────
    this.updateLFORouting(initialSettings.lfo);
  }

  // ─────────────────────────────────────────────
  // Note On / Off
  // ─────────────────────────────────────────────
  public noteOn(note: Note, velocity = 1): void {
    if (!MIDI_NOTES[note]) return;

    const voice = this.allocateVoice();
    if (!voice) return;

    const now = Tone.now();
    if (voice.isActive) {
      voice.synth.triggerRelease(now);
    }
    voice.note = note;
    voice.startTime = now;
    voice.isActive = true;

    // Update oscillator and envelope settings immediately
    voice.synth.set({
      oscillator: {
        type: this.settings.oscillator.type as Tone.ToneOscillatorType,
        detune: this.settings.oscillator.detune
      },
      envelope: this.settings.envelope
    });

    // For FM/AM synths, update modulation amount if applicable
    if (this.settings.oscillator.modulation && 'harmonicity' in voice.synth) {
      (voice.synth as Tone.FMSynth | Tone.AMSynth).harmonicity.value = this.settings.oscillator.modulation.amount;
    }

    voice.synth.triggerAttack(note, now, velocity);
  }

  public noteOff(note: Note): void {
    const now = Tone.now();
    const activeVoices = this.voices.filter(v => v.note === note && v.isActive);
    activeVoices.forEach(voice => {
      voice.synth.triggerRelease(now);
      voice.isActive = false;
      voice.note = null;
    });
  }

  // ─────────────────────────────────────────────
  // Update Methods for Parameters
  // ─────────────────────────────────────────────
  public updateOscillator(settings: typeof this.settings.oscillator): void {
    this.settings.oscillator = settings;
    const now = Tone.now();
    this.voices.forEach(voice => {
      if (!voice.synth.oscillator) return;
      voice.synth.oscillator.type = settings.type as Tone.ToneOscillatorType;
      voice.synth.oscillator.detune.cancelScheduledValues(now);
      voice.synth.oscillator.detune.linearRampToValueAtTime(
        settings.detune,
        now + PARAMETER_SMOOTHING_MS / 1000
      );
      if (settings.modulation && 'harmonicity' in voice.synth) {
        (voice.synth as Tone.FMSynth | Tone.AMSynth).harmonicity.value = settings.modulation.amount;
      }
    });
  }

  public updateFilter(settings: typeof this.settings.filter): void {
    this.settings.filter = settings;
    const now = Tone.now();
    const { filter } = this.nodes;
    filter.frequency.cancelScheduledValues(now);
    filter.frequency.linearRampToValueAtTime(
      settings.frequency,
      now + PARAMETER_SMOOTHING_MS / 1000
    );
    filter.Q.cancelScheduledValues(now);
    filter.Q.linearRampToValueAtTime(
      settings.Q,
      now + PARAMETER_SMOOTHING_MS / 1000
    );
    filter.type = settings.type as BiquadFilterType;
  }

  public updateEffects(settings: typeof this.settings.effects): void {
    this.settings.effects = settings;
    const now = Tone.now();
    const { reverb, delay, distortion } = this.nodes;
    const scaleWet = (wet: number) => Math.min(wet * 1.5, 1);
    reverb.wet.cancelScheduledValues(now);
    reverb.wet.linearRampToValueAtTime(
      settings.reverb.enabled ? scaleWet(settings.reverb.wet) : 0,
      now + PARAMETER_SMOOTHING_MS / 1000
    );
    delay.wet.cancelScheduledValues(now);
    delay.wet.linearRampToValueAtTime(
      settings.delay.enabled ? scaleWet(settings.delay.wet) : 0,
      now + PARAMETER_SMOOTHING_MS / 1000
    );
    distortion.wet.cancelScheduledValues(now);
    distortion.wet.linearRampToValueAtTime(
      settings.distortion.enabled ? scaleWet(settings.distortion.wet) : 0,
      now + PARAMETER_SMOOTHING_MS / 1000
    );
  }

  public updateLFO(settings: typeof this.settings.lfo): void {
    this.settings.lfo = settings;
    const { lfo } = this.nodes;
    const now = Tone.now();
    lfo.frequency.cancelScheduledValues(now);
    lfo.frequency.linearRampToValueAtTime(
      settings.frequency,
      now + PARAMETER_SMOOTHING_MS / 1000
    );
    lfo.type = settings.type as Tone.ToneOscillatorType;
    // Use our dedicated multiplier routing for smooth modulation.
    this.updateLFORouting(settings);
  }

  public updateEnvelope(settings: typeof this.settings.envelope): void {
    this.settings.envelope = settings;
    const now = Tone.now();
    this.voices.forEach(voice => {
      voice.synth.envelope.attack = settings.attack;
      voice.synth.envelope.decay = settings.decay;
      voice.synth.envelope.sustain = settings.sustain;
      voice.synth.envelope.release = settings.release;
    });
  }

  public updateVolume(volume: number): void {
    this.settings.volume = volume;
    this.nodes.mainBus.volume.value = volume;
  }

  public panic(): void {
    const now = Tone.now();
    this.voices.forEach(voice => {
      voice.synth.triggerRelease(now);
      voice.isActive = false;
      voice.note = null;
    });
  }

  public dispose(): void {
    this.voices.forEach(voice => voice.synth.dispose());
    Object.values(this.nodes).forEach(node => node.dispose());
  }

  // ─────────────────────────────────────────────
  // Voice Allocation
  // ─────────────────────────────────────────────
  private allocateVoice(): Voice | null {
    const now = Tone.now();
    let voice = this.voices.find(v => !v.isActive);
    if (!voice) {
      // If all voices are active, steal the oldest one.
      voice = this.voices.reduce((oldest, current) =>
        current.startTime < oldest.startTime ? current : oldest
      );
    }
    return voice;
  }

  // ─────────────────────────────────────────────
  // LFO Routing with Multiplier for Smooth Depth Control
  // ─────────────────────────────────────────────
  private updateLFORouting(lfoSettings: typeof this.settings.lfo): void {
    const { lfo, filter, mainBus, lfoMultiplier } = this.nodes;
    // Disconnect previous LFO routing
    lfo.disconnect();
    lfoMultiplier.disconnect();

    // Fixed range: for pitch modulation use -1 to 1; else 0 to 1.
    if (lfoSettings.target === 'pitch') {
      lfo.min = -1;
      lfo.max = 1;
    } else {
      lfo.min = 0;
      lfo.max = 1;
    }

    // Update the multiplier's gain to the desired depth.
    lfoMultiplier.gain.value = lfoSettings.depth;

    // Route the modulated (scaled) signal to the appropriate target.
    if (lfoSettings.depth > 0) {
      switch (lfoSettings.target) {
        case 'filter':
          lfoMultiplier.connect(filter.frequency);
          break;
        case 'pitch':
          this.voices.forEach(voice => {
            lfoMultiplier.connect(voice.synth.oscillator.frequency);
          });
          break;
        case 'volume':
          lfoMultiplier.connect(mainBus.volume);
          break;
      }
    }
  }
}
