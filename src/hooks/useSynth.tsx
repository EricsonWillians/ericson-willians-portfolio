import { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Note } from '@/types/synth';
import { MIDI_NOTES } from '@/constants/midi';

interface UseSynthReturn {
  synth: Tone.Synth | null;
  handleNoteStart: (note: Note) => void;
  handleNoteEnd: (note: Note) => void;
}

export const useSynth = (): UseSynthReturn => {
  const [synth, setSynth] = useState<Tone.Synth | null>(null);

  useEffect(() => {
    const newSynth = new Tone.Synth({
      oscillator: {
        type: "square8"
      },
      envelope: {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.4,
        release: 0.8,
      },
    }).toDestination();
    
    setSynth(newSynth);

    return () => {
      newSynth.dispose();
    };
  }, []);

  const handleNoteStart = useCallback((note: Note) => {
    if (synth) {
      synth.triggerAttack(MIDI_NOTES[note].frequency);
    }
  }, [synth]);

  const handleNoteEnd = useCallback((note: Note) => {
    if (synth) {
      synth.triggerRelease();
    }
  }, [synth]);

  return { synth, handleNoteStart, handleNoteEnd };
};