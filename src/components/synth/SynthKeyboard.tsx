import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  useMemo,
} from 'react';
import * as Tone from 'tone';
import { Note } from '@/types/synth';
import { MIDI_NOTES, KEYBOARD_MAP } from '@/constants/midi';
import { Key } from '@/components/synth/Key';
import { useSynth } from '@/providers/SynthProvider';

// Define a fixed base keyboard order with 17 keys that correspond to your computer-key mapping.
const BASE_KEYBOARD_ORDER: Note[] = [
  'C4', 'C#4', 'D4', 'D#4', 'E4',
  'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
  'C5', 'C#5', 'D5', 'D#5', 'E5',
];

// Keyboard layout configuration constants
const KEYBOARD_LAYOUT = {
  BLACK_KEY: {
    PLACEMENT: {
      WITH_CONTROLS: 1.12,    // Original placement with controls showing
      WITHOUT_CONTROLS: 1.35  // Adjusted placement when controls are hidden
    },
    WIDTH: {
      WITH_CONTROLS: 0.4,     // Default width with controls showing
      WITHOUT_CONTROLS: 1.2   // Wider when controls are hidden
    },
    HEIGHT_RATIO: 0.65
  }
};

/**
 * Shifts a note's octave by a given offset.
 * For example, shiftNoteOctave("C4", -1) returns "C3".
 */
function shiftNoteOctave(note: Note, offset: number): Note {
  const regex = /^([A-G]#?)(\d)$/;
  const match = note.match(regex);
  if (!match) return note;
  const [, noteName, octaveStr] = match;
  const newOctave = parseInt(octaveStr, 10) + offset;
  return `${noteName}${newOctave}` as Note;
}

const MemoizedKey = memo(Key);

interface SynthKeyboardProps {
  octaveOffset: number;
  shouldAdjustKeyboardLayout: boolean;
}

export function SynthKeyboard({ 
  octaveOffset, 
  shouldAdjustKeyboardLayout 
}: SynthKeyboardProps) {
  const { handleNoteStart, handleNoteEnd, panic, ready, initializeAudio } = useSynth();
  
  // Track which notes are pressed (via mouse or keyboard)
  const [pressedKeys, setPressedKeys] = useState<Set<Note>>(new Set());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const mouseNotesRef = useRef<Set<Note>>(new Set());

  // ─────────────────────────────────────────────
  // 1. Layout Calculations
  // ─────────────────────────────────────────────
  
  // Calculate layout values based on current mode
  const layoutConfig = useMemo(() => ({
    blackKeyWidth: shouldAdjustKeyboardLayout 
      ? KEYBOARD_LAYOUT.BLACK_KEY.WIDTH.WITHOUT_CONTROLS
      : KEYBOARD_LAYOUT.BLACK_KEY.WIDTH.WITH_CONTROLS,
    blackKeyPlacement: shouldAdjustKeyboardLayout
      ? KEYBOARD_LAYOUT.BLACK_KEY.PLACEMENT.WITHOUT_CONTROLS
      : KEYBOARD_LAYOUT.BLACK_KEY.PLACEMENT.WITH_CONTROLS
  }), [shouldAdjustKeyboardLayout]);

  // Compute displayed keys
  const displayedKeys = useMemo(() => 
    BASE_KEYBOARD_ORDER.map(note => shiftNoteOctave(note, octaveOffset)),
    [octaveOffset]
  );

  // Separate white and black keys
  const { whiteNotes, blackNotes } = useMemo(() => ({
    whiteNotes: displayedKeys.filter(n => !n.includes('#')),
    blackNotes: displayedKeys.filter(n => n.includes('#'))
  }), [displayedKeys]);

  // Calculate white key width
  const whiteKeyWidth = useMemo(() => 
    100 / whiteNotes.length,
    [whiteNotes.length]
  );

  // Compute white key positions
  const computedWhiteKeys = useMemo(() => 
    whiteNotes.map((note, index) => ({
      note,
      left: index * whiteKeyWidth,
      width: whiteKeyWidth,
    })), 
    [whiteNotes, whiteKeyWidth]
  );

  // Compute black key positions
  const computedBlackKeys = useMemo(() => {
    const whiteKeyPositions = new Map(
      computedWhiteKeys.map(key => [key.note, key.left])
    );

    return blackNotes
      .map(note => {
        const baseNote = note.replace('#', '') as Note;
        const baseIndex = whiteNotes.indexOf(baseNote);
        const nextNote = whiteNotes[baseIndex + 1];
        
        if (!nextNote) return null;

        const basePosition = whiteKeyPositions.get(baseNote);
        const nextPosition = whiteKeyPositions.get(nextNote);
        const gap = nextPosition - basePosition;
        
        return {
          note,
          left: basePosition + (gap * layoutConfig.blackKeyPlacement),
          width: whiteKeyWidth * layoutConfig.blackKeyWidth,
        };
      })
      .filter(Boolean);
  }, [
    blackNotes, 
    whiteNotes, 
    computedWhiteKeys, 
    layoutConfig.blackKeyPlacement,
    layoutConfig.blackKeyWidth,
    whiteKeyWidth
  ]);

  // ─────────────────────────────────────────────
  // 2. Note Event Handlers
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // 3. Mouse Event Handlers
  // ─────────────────────────────────────────────
  const handleMouseDown = useCallback(async (note: Note) => {
    if (!ready) {
      try {
        await initializeAudio();
      } catch (error) {
        console.error('Audio initialization failed:', error);
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
    mouseNotesRef.current.forEach(n => handleNoteOff(n));
    mouseNotesRef.current.clear();
  }, [ready, isMouseDown, handleNoteOff]);

  // ─────────────────────────────────────────────
  // 4. Visibility & Window Event Handlers
  // ─────────────────────────────────────────────
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && ready) {
      panic();
      setPressedKeys(new Set());
      mouseNotesRef.current.clear();
      setIsMouseDown(false);
    }
  }, [ready, panic]);

  // ─────────────────────────────────────────────
  // 5. Keyboard Event Handlers
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!ready) return;
      const baseNote = KEYBOARD_MAP[e.code as keyof typeof KEYBOARD_MAP];
      if (baseNote && !e.repeat) {
        e.preventDefault();
        const shiftedNote = shiftNoteOctave(baseNote, octaveOffset);
        handleNoteOn(shiftedNote);
      } else if (e.key === 'Escape') {
        panic();
        setPressedKeys(new Set());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!ready) return;
      const baseNote = KEYBOARD_MAP[e.code as keyof typeof KEYBOARD_MAP];
      if (baseNote) {
        const shiftedNote = shiftNoteOctave(baseNote, octaveOffset);
        handleNoteOff(shiftedNote);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [
    ready,
    handleNoteOn,
    handleNoteOff,
    handleGlobalMouseUp,
    handleVisibilityChange,
    octaveOffset,
    panic,
  ]);

  // Reset active notes when octave changes
  useEffect(() => {
    pressedKeys.forEach(note => handleNoteOff(note));
    setPressedKeys(new Set());
    mouseNotesRef.current.clear();
  }, [octaveOffset, handleNoteOff]);

  // ─────────────────────────────────────────────
  // 6. Render
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {!ready && (
        <div className="flex justify-center mb-4">
          <button
            onClick={async () => {
              try {
                await initializeAudio();
              } catch (e) {
                console.error('Initialization error:', e);
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
        className="relative border border-green-500 rounded bg-black keyboard-container"
        style={{ maxWidth: '1000px', margin: '0 auto' }}
      >
        {/* White Keys */}
        <div className="flex relative" style={{ height: '200px' }}>
          {computedWhiteKeys.map(({ note, left, width }) => (
            <div key={note} style={{ width: `${width}%`, position: 'relative' }}>
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
  
        {/* Black Keys Container */}
        <div 
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{ 
            height: `${200 * KEYBOARD_LAYOUT.BLACK_KEY.HEIGHT_RATIO}px`
          }}
        >
          {/* Individual Black Keys */}
          {computedBlackKeys.map(({ note, left, width }) => (
            <div
              key={note}
              className="absolute pointer-events-auto"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                height: '100%',
                transform: 'translateX(-50%)',
              }}
            >
              <MemoizedKey
                note={note}
                isPressed={pressedKeys.has(note)}
                isSharp={true}
                onMouseDown={() => handleMouseDown(note)}
                onMouseUp={() => handleNoteOff(note)}
                onMouseEnter={() => handleMouseEnter(note)}
                onMouseLeave={() => handleMouseLeave(note)}
                aria-pressed={pressedKeys.has(note)}
                aria-label={`${note} key`}
              />
            </div>
          ))}
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