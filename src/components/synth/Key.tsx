// src/components/synth/Key.tsx

import React from "react";
import { Note } from "@/types/synth";
import { cn } from "@/lib/utils";

interface KeyProps {
  note: Note;
  isPressed: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isSharp?: boolean;
}

export const Key: React.FC<KeyProps> = ({
  note,
  isPressed,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
  isSharp
}) => {
  return (
    <div
      className={cn(
        "terminal-key",
        isSharp ? "terminal-key-black" : "terminal-key-white",
        isPressed && "terminal-key-pressed"
      )}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="text-xs">{note}</span>
    </div>
  );
};