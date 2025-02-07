// src/components/synth/SynthKeyboard.tsx
import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import * as Tone from 'tone';
import { Note } from '@/types/synth';
import { MIDI_NOTES, KEYBOARD_MAP } from '@/constants/midi';
import { Key } from '@/components/synth/Key';
import { useSynth } from '@/providers/SynthProvider';

const START_OCTAVE = 4;
const NUM_OCTAVES = 2;
const whiteNoteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const blackNotesMapping: Record<string, number> = {
  'C#': 1,
  'D#': 2,
  'F#': 4,
  'G#': 5,
  'A#': 6,
};

const MemoizedKey = memo(Key);

export function SynthKeyboard() {
  const { handleNoteStart, handleNoteEnd, panic, ready, initializeAudio } = useSynth();
  const [pressedKeys, setPressedKeys] = useState<Set<Note>>(new Set());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const mouseNotesRef = useRef<Set<Note>>(new Set());

  const handleNoteOn = useCallback((note: Note) => {
    if (!ready || !MIDI_NOTES[note]) return;
    handleNoteStart(note);
    setPressedKeys(prev => new Set([...prev, note]));
  }, [ready, handleNoteStart]);

  const handleNoteOff = useCallback((note: Note) => {
    if (!ready || !MIDI_NOTES[note]) return;
    handleNoteEnd(note);
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });
  }, [ready, handleNoteEnd]);

  const handleMouseDown = useCallback(async (note: Note) => {
    if (!ready) {
      try {
        await initializeAudio();
      } catch (error) {
        console.error("Audio initialization failed:", error);
        return;
      }
    }
    setIsMouseDown(true);
    mouseNotesRef.current.add(note);
    handleNoteOn(note);
  }, [ready, initializeAudio, handleNoteOn]);

  const handleMouseUp = useCallback((note: Note) => {
    if (!ready) return;
    setIsMouseDown(false);
    mouseNotesRef.current.delete(note);
    handleNoteOff(note);
  }, [ready, handleNoteOff]);

  const handleMouseEnter = useCallback((note: Note) => {
    if (!ready || !isMouseDown) return;
    if (!mouseNotesRef.current.has(note)) {
      mouseNotesRef.current.add(note);
      handleNoteOn(note);
    }
  }, [ready, isMouseDown, handleNoteOn]);

  const handleMouseLeave = useCallback((note: Note) => {
    if (!ready) return;
    if (mouseNotesRef.current.has(note)) {
      mouseNotesRef.current.delete(note);
      handleNoteOff(note);
    }
  }, [ready, handleNoteOff]);

  const handleGlobalMouseUp = useCallback(() => {
    if (!ready || !isMouseDown) return;
    setIsMouseDown(false);
    mouseNotesRef.current.forEach((note) => handleNoteOff(note));
    mouseNotesRef.current.clear();
  }, [ready, isMouseDown, handleNoteOff]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && ready) {
      panic();
      setPressedKeys(new Set());
      mouseNotesRef.current.clear();
      setIsMouseDown(false);
    }
  }, [ready, panic]);

  useEffect(() => {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!ready) return;
      const note = KEYBOARD_MAP[e.code as keyof typeof KEYBOARD_MAP];
      if (note && !e.repeat) {
        e.preventDefault();
        handleNoteOn(note);
      } else if (e.key === 'Escape') {
        panic();
        setPressedKeys(new Set());
      }
    });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if (!ready) return;
      const note = KEYBOARD_MAP[e.code as keyof typeof KEYBOARD_MAP];
      if (note) {
        handleNoteOff(note);
      }
    });
    window.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    return () => {
      window.removeEventListener('keydown', handleNoteOn);
      window.removeEventListener('keyup', handleNoteOff);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [ready, handleNoteOn, handleNoteOff, handleGlobalMouseUp, handleVisibilityChange]);

  // --- Compute Keyboard Layout ---
  // We consider each octave as having 7 white-key units.
  // White keys are given equal width, and black keys are positioned relative to these units.
  const { whiteKeys, blackKeys, totalWhiteUnits } = useMemo(() => {
    const whiteKeys: { note: Note; index: number }[] = [];
    const blackKeys: { note: Note; position: number }[] = [];
    let whiteIndex = 0; // Global white key count across octaves
    for (let octave = START_OCTAVE; octave < START_OCTAVE + NUM_OCTAVES; octave++) {
      // Add white keys: C, D, E, F, G, A, B
      for (let i = 0; i < whiteNoteNames.length; i++) {
        const note = `${whiteNoteNames[i]}${octave}` as Note;
        if (MIDI_NOTES[note]) {
          whiteKeys.push({ note, index: whiteIndex });
          whiteIndex++;
        }
      }
      // Base white key unit for this octave
      const base = (octave - START_OCTAVE) * 7;
      // Add black keys using our mapping
      for (const [blackNote, offset] of Object.entries(blackNotesMapping)) {
        const note = `${blackNote}${octave}` as Note;
        if (MIDI_NOTES[note]) {
          // The center of the black key (in white key units)
          const position = base + offset;
          blackKeys.push({ note, position });
        }
      }
    }
    return { whiteKeys, blackKeys, totalWhiteUnits: whiteIndex };
  }, []);

  const whiteKeyWidthPercent = 100 / totalWhiteUnits;
  const blackKeyWidthPercent = whiteKeyWidthPercent * 0.1; // Adjust black key width as needed

  return (
    <div className="space-y-6">
      {!ready && (
        <div className="flex justify-center mb-4">
          <button
            onClick={async () => {
              try {
                await initializeAudio();
              } catch (e) {
                console.error("Initialization error:", e);
              }
            }}
            className="terminal-button px-6 py-3 text-lg bg-terminal-green hover:bg-terminal-green/90 text-black transition-colors"
          >
            Start Audio Engine
          </button>
        </div>
      )}

      {/* Keyboard Container */}
      <div
        className="relative border border-green-500 rounded bg-black"
        style={{ maxWidth: '1000px', margin: '0 auto' }}
      >
        {/* White Keys */}
        <div className="flex" style={{ height: '200px' }}>
          {whiteKeys.map(({ note, index }) => (
            <div
              key={note}
              style={{ width: `${whiteKeyWidthPercent}%`, position: 'relative' }}
            >
              <MemoizedKey
                note={note}
                isPressed={pressedKeys.has(note)}
                isSharp={false}
                onMouseDown={() => handleMouseDown(note)}
                onMouseUp={() => handleMouseUp(note)}
                onMouseEnter={() => handleMouseEnter(note)}
                onMouseLeave={() => handleMouseLeave(note)}
                aria-pressed={pressedKeys.has(note)}
                aria-label={`${note} key`}
              />
            </div>
          ))}
        </div>

        {/* Black Keys (absolutely positioned over white keys) */}
        <div className="absolute" style={{ top: 0, left: 0, height: '120px', width: '100%' }}>
          {blackKeys.map(({ note, position }) => {
            // Compute left offset in percent based on white key units
            const leftPercent = (position / totalWhiteUnits) * 100;
            return (
              <div
                key={note}
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  width: `${blackKeyWidthPercent}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <MemoizedKey
                  note={note}
                  isPressed={pressedKeys.has(note)}
                  isSharp={true}
                  onMouseDown={() => handleMouseDown(note)}
                  onMouseUp={() => handleMouseUp(note)}
                  onMouseEnter={() => handleMouseEnter(note)}
                  onMouseLeave={() => handleMouseLeave(note)}
                  aria-pressed={pressedKeys.has(note)}
                  aria-label={`${note} key`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls and Information */}
      <div className="mt-4 p-4 border border-green-500 rounded bg-black">
        <div className="flex justify-between items-start">
          <div className="text-terminal-green font-mono text-sm">
            <p className="font-medium mb-2">Keyboard Controls:</p>
            <pre className="bg-black/30 p-2 rounded text-xs">
              {`White Keys: A S D F G H J K L ;
Black Keys: W E   T Y U   O P`}
            </pre>
          </div>
          <button
            onClick={panic}
            className="terminal-button bg-red-900/20 hover:bg-red-900/40 px-4 py-2"
            aria-label="Panic button - stop all sounds"
          >
            Panic
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(SynthKeyboard);
