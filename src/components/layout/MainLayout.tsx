import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="terminal-container">
      <div className="terminal-scanlines" />
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="space-y-12">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
