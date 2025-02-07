// src/hooks/useSynth.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { Note, SynthSettings } from '@/types/synth';
import { SynthEngine } from '@/components/synth/SynthEngine';

// Professional default settings
const initialSettings: SynthSettings = {
  oscillator: {
    type: 'sawtooth',
    detune: 0,
  },
  envelope: {
    attack: 0.05,
    decay: 0.3,
    sustain: 0.4,
    release: 0.5,
  },
  filter: {
    frequency: 2000,
    type: 'lowpass',
    Q: 1,
  },
  lfo: {
    frequency: 5,
    depth: 0,
    type: 'sine',
    target: 'filter',
  },
  effects: {
    reverb: {
      enabled: false,
      wet: 0,
      decay: 2,
      preDelay: 0.01
    },
    delay: {
      enabled: false,
      wet: 0,
      time: 0.25,
      feedback: 0.3
    },
    distortion: {
      enabled: false,
      wet: 0,
      amount: 0.8
    }
  },
  volume: -6,
};

interface AudioState {
  initialized: boolean;
  starting: boolean;
  error: string | null;
}

export function useSynth() {
  // Core state management
  const [settings, setSettings] = useState<SynthSettings>(initialSettings);
  const [audioState, setAudioState] = useState<AudioState>({
    initialized: false,
    starting: false,
    error: null
  });

  // Refs for audio engine and state tracking
  const engineRef = useRef<SynthEngine | null>(null);
  const settingsRef = useRef(settings);
  const activeNotesRef = useRef<Set<Note>>(new Set());

  // Keep settings ref in sync
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Audio initialization
  const initializeAudio = useCallback(async () => {
    if (engineRef.current || audioState.initialized || audioState.starting) {
      return;
    }

    try {
      setAudioState(prev => ({ ...prev, starting: true, error: null }));

      // Start audio context
      await Tone.start();
      
      // Verify audio context is running
      if (Tone.context.state !== 'running') {
        throw new Error('Failed to start audio context');
      }

      // Initialize engine
      console.log('Initializing synthesizer engine...');
      engineRef.current = new SynthEngine(settingsRef.current);
      
      // Verify engine connection with test tone
      const testOsc = new Tone.Oscillator().toDestination();
      await testOsc.start().stop('+0.1');
      testOsc.dispose();

      // Update state
      setAudioState({
        initialized: true,
        starting: false,
        error: null
      });

      console.log('Synthesizer initialized successfully', {
        sampleRate: Tone.context.sampleRate,
        state: Tone.context.state
      });
    } catch (error) {
      console.error('Audio initialization failed:', error);
      
      // Cleanup on error
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }

      setAudioState({
        initialized: false,
        starting: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }, [audioState.initialized, audioState.starting]);

  // Note handling
  const handleNoteStart = useCallback((note: Note) => {
    if (!engineRef.current || !audioState.initialized) {
      console.warn('Attempted to play note before initialization');
      return;
    }

    try {
      engineRef.current.noteOn(note);
      activeNotesRef.current.add(note);
    } catch (error) {
      console.error('Error starting note:', error);
    }
  }, [audioState.initialized]);

  const handleNoteEnd = useCallback((note: Note) => {
    if (!engineRef.current || !audioState.initialized) return;

    try {
      engineRef.current.noteOff(note);
      activeNotesRef.current.delete(note);
    } catch (error) {
      console.error('Error ending note:', error);
    }
  }, [audioState.initialized]);

  // Settings management
  const updateSettings = useCallback((newSettings: Partial<SynthSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      if (engineRef.current && audioState.initialized) {
        try {
          // Update engine parameters
          if (newSettings.oscillator) {
            engineRef.current.updateOscillator(updated.oscillator);
          }
          if (newSettings.filter) {
            engineRef.current.updateFilter(updated.filter);
          }
          if (newSettings.effects) {
            engineRef.current.updateEffects(updated.effects);
          }
          if (newSettings.lfo) {
            engineRef.current.updateLFO(updated.lfo);
          }
          if ('volume' in newSettings) {
            engineRef.current.updateVolume(updated.volume);
          }
        } catch (error) {
          console.error('Error updating settings:', error);
        }
      }

      return updated;
    });
  }, [audioState.initialized]);

  // Panic function
  const panic = useCallback(() => {
    if (!engineRef.current || !audioState.initialized) return;

    try {
      // Stop all active notes
      activeNotesRef.current.forEach(note => {
        engineRef.current?.noteOff(note);
      });
      activeNotesRef.current.clear();

      // Reset engine state
      engineRef.current.panic();
    } catch (error) {
      console.error('Error during panic:', error);
    }
  }, [audioState.initialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        try {
          // Ensure all notes are released
          activeNotesRef.current.forEach(note => {
            engineRef.current?.noteOff(note);
          });
          engineRef.current.dispose();
          engineRef.current = null;
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }

      setAudioState({
        initialized: false,
        starting: false,
        error: null
      });
    };
  }, []);

  // Handle window blur/visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && engineRef.current) {
        panic();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', panic);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', panic);
    };
  }, [panic]);

  return {
    ready: audioState.initialized,
    starting: audioState.starting,
    error: audioState.error,
    initializeAudio,
    handleNoteStart,
    handleNoteEnd,
    currentSettings: settings,
    updateSettings,
    panic
  };
}

export default useSynth;