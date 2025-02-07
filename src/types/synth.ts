// src/types/synth.ts

import { ToneOscillatorType } from 'tone';

export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type Note = `${NoteName}${Octave}`;

export type OscillatorType = ToneOscillatorType;

export interface SynthSettings {
  oscillator: {
    type: OscillatorType;
    detune: number;
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  filter: {
    frequency: number;
    type: BiquadFilterType;
    Q: number;
  };
  lfo: {
    frequency: number;
    depth: number;
    type: OscillatorType;
    target: 'filter' | 'pitch' | 'volume';
  };
  effects: {
    reverb: { enabled: boolean; wet: number };
    delay: { enabled: boolean; wet: number };
    distortion: { enabled: boolean; wet: number };
  };
  volume: number;
}

export interface MIDINote {
  note: Note;
  frequency: number;
  midiNumber: number;
}
