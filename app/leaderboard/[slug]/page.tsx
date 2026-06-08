"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { leaderboardBySlugQuery } from "@/lib/backend";
import { LeaderboardContext } from "@/hooks/use-leaderboard";
import { Button } from "@/components/ui/button";
import { Trophy, History, Plus, Clock } from "lucide-react";
import Players from "@/components/main/leaderboard";
import Games from "@/components/main/history";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginButton } from "@/components/login-button";
import RegisterGame from "@/components/main/add-game";
import { useTab } from "@/hooks/use-tab";
import Link from "next/link";
import { Suspense } from "react";

function LeaderboardPageContent() {
  const params = useParams();
  const slug = params.slug as string;
  const leaderboardQuery = useQuery(leaderboardBySlugQuery(slug));
  const { currentTab, setTab } = useTab();

  if (leaderboardQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (leaderboardQuery.isError || !leaderboardQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Leaderboard not found</h1>
          <p className="text-muted-foreground">
            The leaderboard &quot;{slug}&quot; does not exist.
          </p>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const leaderboard = leaderboardQuery.data;

  return (
    <LeaderboardContext.Provider
      value={{ leaderboard, leaderboardId: leaderboard.id }}
    >
      <div className="min-h-screen flex flex-col">
        {/* Header and Navigation - Muted Background */}
        <div className="bg-muted pb-8">
          <div className="space-y-8">
            <div className="pt-6 px-6 max-w-[500px] mx-auto relative">
              {/* Header with Login Button */}
              <div className="text-center space-y-2">
                <Link
                  href="/leaderboards"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  All Leaderboards
                </Link>
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                  {leaderboard.name}
                </h1>
                <p className="text-muted-foreground">
                  Track rankings with the{" "}
                  <Link
                    href="/explanation"
                    className="underline hover:text-foreground transition-colors"
                  >
                    ELO rating system
                  </Link>
                </p>
              </div>
              <div className="absolute top-6 right-6">
                <LoginButton />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-center gap-1.5 max-w-[500px] mx-auto">
              <Button
                variant={currentTab === "history" ? "default" : "outline"}
                size="sm"
                onClick={() => setTab("history")}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
              <Button
                variant={currentTab === "leaderboard" ? "default" : "outline"}
                size="sm"
                onClick={() => setTab("leaderboard")}
                className="gap-2"
              >
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Button>
              <Button
                variant={currentTab === "addgame" ? "default" : "outline"}
                size="sm"
                onClick={() => setTab("addgame")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Game
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area - Default Background */}
        <div className="flex-1 pb-16">
          <div className="max-w-[500px] mx-auto p-6">
            {currentTab === "history" && <Games />}
            {currentTab === "leaderboard" && <Players />}
            {currentTab === "addgame" && <RegisterGame />}
          </div>
        </div>

        {/* Fixed Footer */}
        <footer className="fixed bottom-1 left-0 right-0 py-2 text-center bg-background/80 backdrop-blur-sm z-40">
          <p className="text-sm text-muted-foreground">
            Made, with love, by{" "}
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
            .
          </p>
        </footer>

        {/* Floating Clock Button */}
        <div className="fixed bottom-20 right-6 z-50">
          <Link href="/clock">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
              aria-label="Chess Clock"
            >
              <Clock className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Floating Theme Toggle */}
        <ThemeToggle />
      </div>
    </LeaderboardContext.Provider>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LeaderboardPageContent />
    </Suspense>
  );
}
