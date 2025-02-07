import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SynthSection } from "@/components/sections/SynthSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SynthProvider } from "./providers/SynthProvider";

function App() {
  return (
    <ThemeProvider>
      <MainLayout>
        <SynthProvider>
          <SynthSection />
        </SynthProvider>
        <ProjectsSection />
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;
