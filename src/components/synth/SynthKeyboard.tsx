import React, { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types/synth';
import { MIDI_NOTES, KEYBOARD_MAP } from '@/constants/midi';
import { Key } from '@/components/synth/Key';
import { useSynth } from '@/hooks/useSynth';

export function SynthKeyboard() {
  const { handleNoteStart, handleNoteEnd } = useSynth();
  const [pressedKeys, setPressedKeys] = useState<Set<Note>>(new Set());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const note = KEYBOARD_MAP[e.code as keyof typeof KEYBOARD_MAP];
    if (note && !e.repeat) {
      handleNoteStart(note);
      setPressedKeys(prev => new Set([...prev, note]));
    }
  }, [handleNoteStart]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const note = KEYBOARD_MAP[e.code as keyof typeof KEYBOARD_MAP];
    if (note) {
      handleNoteEnd(note);
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });
    }
  }, [handleNoteEnd]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="p-8 border border-green-500 rounded bg-black">
      <div className="flex relative mb-8">
        {Object.entries(MIDI_NOTES).map(([note, data]) => (
          <Key
            key={note}
            note={note as Note}
            isPressed={pressedKeys.has(note as Note)}
            onMouseDown={() => {
              handleNoteStart(note as Note);
              setPressedKeys(prev => new Set([...prev, note as Note]));
            }}
            onMouseUp={() => {
              handleNoteEnd(note as Note);
              setPressedKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(note as Note);
                return newSet;
              });
            }}
            isSharp={note.includes('#')}
          />
        ))}
      </div>
      <div className="text-green-500 font-mono text-sm">
        <p>Keyboard Controls:</p>
        <pre className="mt-2">
          {`White Keys: A S D F G H J
Black Keys: W E   T Y U`}
        </pre>
      </div>
    </div>
  );
}