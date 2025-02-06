// src/types/synth.ts
export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type Note = `${NoteName}${Octave}`;

export interface MIDINote {
  note: Note;
  frequency: number;
  midiNumber: number;
}