import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SynthSection } from "@/components/sections/SynthSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ThemeProvider } from "@/providers/ThemeProvider";

function App() {
  return (
    <ThemeProvider>
      <MainLayout>
        <SynthSection />
        <ProjectsSection />
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;