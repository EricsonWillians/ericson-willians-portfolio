import React from "react";
import { SynthKeyboard } from "@/components/synth/SynthKeyboard";

export function SynthSection() {
  return (
    <section className="terminal-section">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[#00ff00]/60">&gt;</span>
        <h2 className="text-xl font-bold">Synthesizer Demo</h2>
        <span className="text-sm text-[#00ff00]/60">[experimental]</span>
      </div>
      <div className="terminal-keyboard">
        <SynthKeyboard />
      </div>
      <div className="mt-6 text-sm text-[#00ff00]/80">
        <p className="mb-2">Keyboard Controls:</p>
        <pre className="bg-black/30 p-4 rounded">
          {`White Keys: A S D F G H J K L ;
Black Keys: W E   T Y U   O P`}
        </pre>
      </div>
    </section>
  );
}