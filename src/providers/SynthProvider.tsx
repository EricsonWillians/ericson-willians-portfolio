// src/providers/SynthProvider.tsx
import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect,
    ReactNode,
  } from 'react';
  import * as Tone from 'tone';
  import { Note, SynthSettings } from '@/types/synth';
  import { SynthEngine } from '@/components/synth/SynthEngine';
  
  const initialSettings: SynthSettings = {
    oscillator: { type: 'sawtooth', detune: 0 },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.5 },
    filter: { frequency: 2000, type: 'lowpass', Q: 1 },
    lfo: { frequency: 5, depth: 0, type: 'sine', target: 'filter' },
    effects: {
      reverb: { enabled: false, wet: 0, decay: 2, preDelay: 0.01 },
      delay: { enabled: false, wet: 0, time: 0.25, feedback: 0.3 },
      distortion: { enabled: false, wet: 0, amount: 0.8 },
    },
    volume: -6,
  };
  
  interface SynthContextProps {
    currentSettings: SynthSettings;
    updateSettings: (newSettings: Partial<SynthSettings>) => void;
    panic: () => void;
    ready: boolean;
    starting: boolean;
    error: string | null;
    initializeAudio: () => Promise<void>;
    handleNoteStart: (note: Note) => void;
    handleNoteEnd: (note: Note) => void;
  }
  
  const SynthContext = createContext<SynthContextProps | undefined>(undefined);
  
  export function SynthProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SynthSettings>(initialSettings);
    const [audioState, setAudioState] = useState<{
      initialized: boolean;
      starting: boolean;
      error: string | null;
    }>({ initialized: false, starting: false, error: null });
  
    const engineRef = useRef<SynthEngine | null>(null);
    const activeNotesRef = useRef<Set<Note>>(new Set());
  
    const initializeAudio = useCallback(async () => {
      if (engineRef.current || audioState.initialized || audioState.starting) {
        return;
      }
      try {
        setAudioState((prev) => ({ ...prev, starting: true, error: null }));
        await Tone.start();
        if (Tone.context.state !== 'running') {
          throw new Error('Failed to start audio context');
        }
        engineRef.current = new SynthEngine(settings);
        // (Optional) play a short test tone
        const testOsc = new Tone.Oscillator().toDestination();
        await testOsc.start().stop('+0.1');
        testOsc.dispose();
        setAudioState({ initialized: true, starting: false, error: null });
      } catch (error) {
        if (engineRef.current) {
          engineRef.current.dispose();
          engineRef.current = null;
        }
        setAudioState({
          initialized: false,
          starting: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }, [audioState.initialized, audioState.starting, settings]);
  
    const handleNoteStart = useCallback((note: Note) => {
      if (!engineRef.current || !audioState.initialized) {
        console.warn('Attempted to play note before audio is ready');
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
  
    const updateSettings = useCallback((newSettings: Partial<SynthSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        if (engineRef.current && audioState.initialized) {
          try {
            if (newSettings.oscillator) engineRef.current.updateOscillator(updated.oscillator);
            if (newSettings.filter) engineRef.current.updateFilter(updated.filter);
            if (newSettings.effects) engineRef.current.updateEffects(updated.effects);
            if (newSettings.lfo) engineRef.current.updateLFO(updated.lfo);
            if ('volume' in newSettings) engineRef.current.updateVolume(updated.volume);
          } catch (error) {
            console.error('Error updating settings:', error);
          }
        }
        return updated;
      });
    }, [audioState.initialized]);
  
    const panic = useCallback(() => {
      if (!engineRef.current || !audioState.initialized) return;
      try {
        activeNotesRef.current.forEach((note) => engineRef.current!.noteOff(note));
        activeNotesRef.current.clear();
        engineRef.current!.panic();
      } catch (error) {
        console.error('Error during panic:', error);
      }
    }, [audioState.initialized]);
  
    const value: SynthContextProps = {
      currentSettings: settings,
      updateSettings,
      panic,
      ready: audioState.initialized,
      starting: audioState.starting,
      error: audioState.error,
      initializeAudio,
      handleNoteStart,
      handleNoteEnd,
    };
  
    // Optional: Cleanup on unmount
    useEffect(() => {
      return () => {
        if (engineRef.current) {
          activeNotesRef.current.forEach((note) => engineRef.current!.noteOff(note));
          engineRef.current.dispose();
          engineRef.current = null;
        }
      };
    }, []);
  
    return <SynthContext.Provider value={value}>{children}</SynthContext.Provider>;
  }
  
  export function useSynth() {
    const context = useContext(SynthContext);
    if (!context) {
      throw new Error("useSynth must be used within a SynthProvider");
    }
    return context;
  }
  