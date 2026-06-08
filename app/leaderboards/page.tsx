"use client";

import { useQuery } from "@tanstack/react-query";
import { allLeaderboardsQuery } from "@/lib/backend";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginButton } from "@/components/login-button";
import { CreateLeaderboard } from "@/components/create-leaderboard";
import Link from "next/link";
import { Trophy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function LeaderboardsPage() {
  const leaderboards = useQuery(allLeaderboardsQuery);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-muted pb-8">
        <div className="space-y-8">
          <div className="pt-6 px-6 max-w-[500px] mx-auto relative">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                Leaderboards
              </h1>
              <p className="text-muted-foreground">
                Pick a leaderboard or create a new one
              </p>
            </div>
            <div className="absolute top-6 right-6">
              <LoginButton />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 pb-16">
        <div className="max-w-[500px] mx-auto p-6 space-y-6">
          {leaderboards.isLoading && (
            <p className="text-center text-muted-foreground py-8">
              Loading leaderboards...
            </p>
          )}

          {leaderboards.isError && (
            <p className="text-center text-muted-foreground py-8">
              Error loading leaderboards. Please try again.
            </p>
          )}

          {leaderboards.data && (
            <div className="space-y-2">
              {leaderboards.data.map((lb) => (
                <Link
                  key={lb.id}
                  href={`/leaderboard/${lb.slug}`}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">{lb.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        /{lb.slug}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!showCreate ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowCreate(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Leaderboard
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Create New Leaderboard
              </h2>
              <CreateLeaderboard />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <footer className="fixed bottom-1 left-0 right-0 py-2 text-center bg-background/80 backdrop-blur-sm z-40">
        <p className="text-sm text-muted-foreground">
          Made with love by{" "}
          <a
            href="https://charlielidbury.com"
            className="underline hover:text-primary"
          >
            Charlie
          </a>{" "}
          &{" "}
          <a
            href="https://www.anthropic.com/claude"
            className="underline hover:text-primary"
          >
            Claude
          </a>
        </p>
      </footer>

      <ThemeToggle />
    </div>
  );
}
