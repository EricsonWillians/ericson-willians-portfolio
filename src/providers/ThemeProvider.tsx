import React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <div className="selection:bg-green-500 selection:text-black">
      {children}
    </div>
  );
}