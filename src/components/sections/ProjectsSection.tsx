import React from "react";
import { GitHubProjects } from "@/components/ui/GithubProjects";

export function ProjectsSection() {
  return (
    <section className="space-y-4">
      <div className="flex items-center space-x-2">
        <h2 className="text-xl font-semibold">GitHub Projects</h2>
        <span className="text-xs text-green-400/60">[live feed]</span>
      </div>
      <div className="relative">
        <GitHubProjects />
      </div>
    </section>
  );
}