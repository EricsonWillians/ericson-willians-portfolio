// src/components/sections/SynthSection.tsx
import React, { memo, useCallback, useState } from "react";
import { SynthKeyboard } from "@/components/synth/SynthKeyboard";
import { SynthControls } from "@/components/synth/SynthControls";
import { useSynth } from "@/providers/SynthProvider";

export function SynthSection() {
  const { currentSettings, updateSettings, ready, error } = useSynth();
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggleView = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const getAudioStatus = () => {
    if (error) {
      return { text: "Audio Error - Refresh Page", color: "bg-red-500", showStartButton: true };
    }
    if (ready) {
      return { text: "Audio Active", color: "bg-green-500", showStartButton: false };
    }
    return { text: "Click to Start Audio", color: "bg-red-500", showStartButton: true };
  };

  const status = getAudioStatus();

  const EffectDisplay = memo(
    ({
      label,
      value,
      enabled,
    }: {
      label: string;
      value: number;
      enabled: boolean;
    }) => (
      <div className="flex justify-between items-center py-1 border-b border-terminal-green/20 last:border-0">
        <span className="text-sm text-terminal-green">{label}:</span>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              enabled ? "bg-terminal-green" : "bg-terminal-green/20"
            }`}
          />
          <span className="text-sm text-terminal-green">
            {enabled ? `${(value * 100).toFixed(0)}%` : "Off"}
          </span>
        </div>
      </div>
    )
  );
  
  EffectDisplay.displayName = "EffectDisplay";

  return (
    <section className="terminal-section p-6" aria-label="Synthesizer Interface">
      <header className="mb-6 bg-black/30 p-4 rounded border border-terminal-green">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-terminal-green/60">&gt;</span>
            <h2 className="text-2xl font-bold text-terminal-green">Synthesizer</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${status.color}`} aria-label={status.text} />
              <span className="text-sm text-terminal-green/60">{status.text}</span>
            </div>
          </div>
          <button onClick={handleToggleView} className="terminal-button text-sm" aria-label={isMinimized ? "Show Controls" : "Hide Controls"}>
            {isMinimized ? "Show Controls" : "Hide Controls"}
          </button>
        </div>
      </header>

      <div className={`grid gap-6 transition-all duration-300 ${isMinimized ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
        {!isMinimized && (
          <div className="space-y-6">
            <div className="bg-black p-6 rounded border border-terminal-green">
              <h3 className="text-lg font-bold text-terminal-green mb-4">Synth Controls</h3>
              <SynthControls settings={currentSettings} onUpdateSettings={updateSettings} />
            </div>

            <div className="bg-black p-6 rounded border border-terminal-green">
              <h3 className="text-lg font-bold text-terminal-green mb-4">Effect Status</h3>
              <div className="space-y-2">
                <EffectDisplay
                  label="Reverb"
                  value={currentSettings.effects.reverb.wet}
                  enabled={currentSettings.effects.reverb.enabled}
                />
                <EffectDisplay
                  label="Delay"
                  value={currentSettings.effects.delay.wet}
                  enabled={currentSettings.effects.delay.enabled}
                />
                <EffectDisplay
                  label="Distortion"
                  value={currentSettings.effects.distortion.wet}
                  enabled={currentSettings.effects.distortion.enabled}
                />
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Section */}
        <div className={isMinimized ? "col-span-1" : "lg:col-span-1"}>
          <div className="bg-black p-6 rounded border border-terminal-green">
            <SynthKeyboard />
          </div>
        </div>
      </div>

      {/* Footer Information */}
      <footer className="mt-6 border-t border-terminal-green/20 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-sm text-terminal-green/80">
            <h3 className="font-medium mb-2">Keyboard Controls</h3>
            <pre className="bg-black/30 p-3 rounded text-xs">
              {`White Keys: A S D F G H J K L ;
Black Keys: W E   T Y U   O P
Special:   ESC (Panic)`}
            </pre>
          </div>
          <div className="text-sm text-terminal-green/80">
            <h3 className="font-medium mb-2">Quick Tips</h3>
            <ul className="space-y-1 text-xs">
              <li>• Click or press keys to play notes</li>
              <li>• Use ESC key or Panic button to stop all sounds</li>
              <li>• Adjust effects in real-time while playing</li>
              <li>• Hide controls to focus on the keyboard</li>
            </ul>
          </div>
        </div>
      </footer>
    </section>
  );
}

export default memo(SynthSection);
