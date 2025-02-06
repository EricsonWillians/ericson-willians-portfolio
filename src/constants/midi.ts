import { Note, MIDINote } from '@/types/synth';

export const MIDI_NOTES: Record<Note, MIDINote> = {
  'C4': { note: 'C4', frequency: 261.63, midiNumber: 60 },
  'C#4': { note: 'C#4', frequency: 277.18, midiNumber: 61 },
  'D4': { note: 'D4', frequency: 293.66, midiNumber: 62 },
  'D#4': { note: 'D#4', frequency: 311.13, midiNumber: 63 },
  'E4': { note: 'E4', frequency: 329.63, midiNumber: 64 },
  'F4': { note: 'F4', frequency: 349.23, midiNumber: 65 },
  'F#4': { note: 'F#4', frequency: 369.99, midiNumber: 66 },
  'G4': { note: 'G4', frequency: 392.00, midiNumber: 67 },
  'G#4': { note: 'G#4', frequency: 415.30, midiNumber: 68 },
  'A4': { note: 'A4', frequency: 440.00, midiNumber: 69 },
  'A#4': { note: 'A#4', frequency: 466.16, midiNumber: 70 },
  'B4': { note: 'B4', frequency: 493.88, midiNumber: 71 }
} as const;

export const KEYBOARD_MAP: Record<string, Note> = {
  KeyA: 'C4',
  KeyW: 'C#4',
  KeyS: 'D4',
  KeyE: 'D#4',
  KeyD: 'E4',
  KeyF: 'F4',
  KeyT: 'F#4',
  KeyG: 'G4',
  KeyY: 'G#4',
  KeyH: 'A4',
  KeyU: 'A#4',
  KeyJ: 'B4',
  KeyK: 'C5',
  KeyO: 'C#5',
  KeyL: 'D5',
  KeyP: 'D#5',
  Semicolon: 'E5'
};