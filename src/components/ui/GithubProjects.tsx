// src/types/github.ts
export interface GitHubRepo {
  id: number;
  name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  topics: string[];
  created_at: string;
  updated_at: string;
  homepage: string | null;
}

// src/components/ui/GithubProjects.tsx
import React, { useState, useEffect } from "react";
import { Star, GitFork, ExternalLink, Code, Calendar, Search } from "lucide-react";
import { GitHubRepo } from "@/types/github";
import { TerminalSelect } from "./TerminalSelect";

export function GitHubProjects() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"stars" | "updated" | "created">("stars");
  const [currentPage, setCurrentPage] = useState(1);
  const reposPerPage = 5;

  const sortOptions = [
    { value: "stars", label: "Most Stars" },
    { value: "updated", label: "Recently Updated" },
    { value: "created", label: "Recently Created" },
  ];

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://api.github.com/users/ericsonwillians/repos?per_page=100&sort=updated"
        );
        if (!response.ok) throw new Error("Failed to fetch repositories");
        const data = await response.json();
        setRepos(data);
        setFilteredRepos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  useEffect(() => {
    const filtered = repos
      .filter(
        (repo) =>
          repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (repo.description?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          )
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "stars":
            return b.stargazers_count - a.stargazers_count;
          case "updated":
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          case "created":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return 0;
        }
      });

    setFilteredRepos(filtered);
    setCurrentPage(1);
  }, [searchTerm, sortBy, repos]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const indexOfLastRepo = currentPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepos = filteredRepos.slice(indexOfFirstRepo, indexOfLastRepo);
  const totalPages = Math.ceil(filteredRepos.length / reposPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return (
      <div className="terminal-section animate-pulse">
        <div className="h-6 bg-terminal-green/20 rounded w-1/4 mb-4"></div>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="mb-4 h-32 bg-terminal-green/10 rounded animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="terminal-section text-destructive">
        <p>Error loading repositories: {error}</p>
      </div>
    );
  }

  return (
    <div className="terminal-section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-terminal-green/50" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="terminal-input pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-terminal-green/60 text-sm">Sort by:</span>
          <TerminalSelect
            value={sortBy}
            onValueChange={(value) => setSortBy(value as "stars" | "updated" | "created")}
            options={sortOptions}
            placeholder="Select sorting..."
          />
        </div>
        </div>
      </div>

      <div className="space-y-4">
        {currentRepos.map((repo) => (
          <div
            key={repo.id}
            className="border border-terminal-green/20 rounded-md p-4 hover:border-terminal-green/40 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold hover:text-terminal-green text-glow-hover flex items-center gap-2"
              >
                {repo.name}
                <ExternalLink className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {repo.stargazers_count}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="w-4 h-4" />
                  {repo.forks_count}
                </span>
              </div>
            </div>

            {repo.description && (
              <p className="text-terminal-green/80 mb-3">{repo.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {repo.topics.map((topic) => (
                <span
                  key={topic}
                  className="text-xs px-2 py-1 rounded-full border border-terminal-green/30 text-terminal-green/70"
                >
                  {topic}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-terminal-green/60">
              {repo.language && (
                <span className="flex items-center gap-1">
                  <Code className="w-4 h-4" />
                  {repo.language}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Updated: {formatDate(repo.updated_at)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="terminal-button disabled:opacity-50"
          >
            Previous
          </button>
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`terminal-button ${
                currentPage === number ? "bg-terminal-green-dark" : ""
              }`}
            >
              {number}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="terminal-button disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}