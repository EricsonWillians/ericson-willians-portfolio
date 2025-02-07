// src/synth/SynthEngine.ts
import * as Tone from 'tone';
import { Note, SynthSettings } from '@/types/synth';
import { MIDI_NOTES } from '@/constants/midi';

// Audio engine constants
const VOICE_LIMIT = 8;
const PARAMETER_SMOOTHING_MS = 50;
const PORTAMENTO_TIME = 0.05;

interface Voice {
  synth: Tone.Synth;
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
  lfo: Tone.LFO;
}

export class SynthEngine {
  private voices: Voice[];
  private nodes: AudioNodes;
  private settings: SynthSettings;

  constructor(initialSettings: SynthSettings) {
    this.settings = initialSettings;
    this.voices = [];
    
    // Create and configure audio processing chain
    const mainBus = new Tone.Volume(initialSettings.volume).toDestination();
    
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

    const lfo = new Tone.LFO({
      frequency: initialSettings.lfo.frequency,
      min: 0,
      max: 1,
      type: initialSettings.lfo.type as Tone.ToneOscillatorType
    }).start();

    this.nodes = {
      filter,
      reverb,
      delay,
      distortion,
      mainBus,
      lfo
    };

    // Initialize voice pool
    for (let i = 0; i < VOICE_LIMIT; i++) {
      const synth = new Tone.Synth({
        oscillator: {
          type: initialSettings.oscillator.type as Tone.ToneOscillatorType,
          portamento: PORTAMENTO_TIME
        },
        envelope: initialSettings.envelope
      }).connect(distortion);

      this.voices.push({
        synth,
        note: null,
        startTime: 0,
        isActive: false
      });
    }

    // Initial LFO routing
    this.updateLFORouting(initialSettings.lfo);
  }

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

    voice.synth.set({
      oscillator: {
        type: this.settings.oscillator.type as Tone.ToneOscillatorType,
        detune: this.settings.oscillator.detune
      },
      envelope: this.settings.envelope
    });

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

    // Update reverb
    reverb.wet.cancelScheduledValues(now);
    reverb.wet.linearRampToValueAtTime(
      settings.reverb.enabled ? settings.reverb.wet : 0,
      now + PARAMETER_SMOOTHING_MS / 1000
    );

    // Update delay
    delay.wet.cancelScheduledValues(now);
    delay.wet.linearRampToValueAtTime(
      settings.delay.enabled ? settings.delay.wet : 0,
      now + PARAMETER_SMOOTHING_MS / 1000
    );

    // Update distortion
    distortion.wet.cancelScheduledValues(now);
    distortion.wet.linearRampToValueAtTime(
      settings.distortion.enabled ? settings.distortion.wet : 0,
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
    this.updateLFORouting(settings);
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

  private allocateVoice(): Voice | null {
    const now = Tone.now();
    
    // First, try to find an inactive voice
    let voice = this.voices.find(v => !v.isActive);
    
    // If no inactive voice, steal the oldest one
    if (!voice) {
      voice = this.voices.reduce((oldest, current) => {
        if (!oldest || current.startTime < oldest.startTime) {
          return current;
        }
        return oldest;
      });
    }

    return voice;
  }

  private updateLFORouting(lfoSettings: typeof this.settings.lfo): void {
    const { lfo, filter, mainBus } = this.nodes;
    
    lfo.disconnect();

    if (lfoSettings.depth > 0) {
      switch (lfoSettings.target) {
        case 'filter':
          lfo.connect(filter.frequency);
          break;
        case 'pitch':
          this.voices.forEach(voice => {
            lfo.connect(voice.synth.oscillator.frequency);
          });
          break;
        case 'volume':
          lfo.connect(mainBus.volume);
          break;
      }
    }
  }
}