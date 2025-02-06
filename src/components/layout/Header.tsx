import React from "react";

export function Header() {
  return (
    <header className="terminal-header">
      <div className="flex items-center gap-2">
        <span className="text-[#00ff00]/60">$</span>
        <h1 className="text-3xl font-bold">Ericson Willians Portfolio</h1>
      </div>
      <p className="mt-2 text-[#00ff00]/80">
        A retro-inspired showcase of my projects & audio explorations
      </p>
    </header>
  );
}
