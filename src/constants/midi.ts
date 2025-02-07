// src/constants/midi.ts
import { Note, MIDINote } from '@/types/synth';

// Define the 12 note names.
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Create a mapping for all MIDI notes from 0 to 127.
const midiNotes: Record<Note, MIDINote> = {} as Record<Note, MIDINote>;

for (let midi = 0; midi < 128; midi++) {
  // Standard MIDI octave calculation: MIDI note 60 (A4) corresponds to octave 4.
  const octave = Math.floor(midi / 12) - 1;
  // Determine the note name (e.g., "C", "C#", etc.) from the remainder.
  const noteName = noteNames[midi % 12];
  // Form the full note string (e.g., "C4").
  const note = `${noteName}${octave}` as Note;
  // Calculate the frequency using the formula: frequency = 440 * 2^((midi - 69)/12)
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  // Save the computed MIDINote in the mapping (rounding frequency to 2 decimals).
  midiNotes[note] = {
    note,
    frequency: parseFloat(frequency.toFixed(2)),
    midiNumber: midi,
  };
}

// Export the complete mapping as a constant.
export const MIDI_NOTES = midiNotes;

// Define your computer keyboard mapping for the synthesizer interface.
// These values represent the base (default) octave; your keyboard logic can shift these names.
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
} as const;
