import React from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TerminalSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  placeholder?: string;
  className?: string;
}

export function TerminalSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select option...",
  className,
}: TerminalSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={cn(
          "flex items-center justify-between w-[200px] rounded px-3 py-2 text-sm",
          "border border-terminal-green/40 bg-terminal-black/80",
          "hover:border-terminal-green/60 hover:bg-terminal-black focus:border-terminal-green",
          "data-[placeholder]:text-terminal-green/50",
          "outline-none",
          "animate-terminal-glow transition-colors duration-200",
          className
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={cn(
            "relative z-50 min-w-[200px] overflow-hidden",
            "border border-terminal-green/40 bg-terminal-black/95",
            "backdrop-blur-md rounded-md shadow-lg",
            "animate-in fade-in-80 duration-100"
          )}
        >
          <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-terminal-black/80 cursor-default">
            <ChevronUp className="h-4 w-4" />
          </Select.ScrollUpButton>

          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex items-center h-9 px-8 rounded-sm text-sm",
                  "cursor-default select-none outline-none",
                  "hover:bg-terminal-green/20 focus:bg-terminal-green/20",
                  "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
                  "transition-colors duration-150"
                )}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>

          <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-terminal-black/80 cursor-default">
            <ChevronDown className="h-4 w-4" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}