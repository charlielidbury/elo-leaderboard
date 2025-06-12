"use client";

import { Button } from "@/components/ui/button";
import { Trophy, History, Plus } from "lucide-react";
import Players from "@/components/main/leaderboard";
import Games from "@/components/main/history";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginButton } from "@/components/login-button";
import RegisterGame from "@/components/main/add-game";
import { useTab } from "@/hooks/use-tab";
import Link from "next/link";
import { Suspense } from "react";

function EloLeaderboardContent() {
  const { currentTab, setTab } = useTab();

  return (
    <div className="min-h-screen">
      {/* Header and Navigation - Muted Background */}
      <div className="bg-muted pb-8">
        <div className="space-y-8">
          <div className="pt-6 px-6 max-w-[500px] mx-auto relative">
            {/* Header with Login Button */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                Symbolica Chess
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
      <div className="min-h-[calc(100vh-200px)]">
        <div className="max-w-[500px] mx-auto p-6">
          {currentTab === "history" && <Games />}
          {currentTab === "leaderboard" && <Players />}
          {currentTab === "addgame" && <RegisterGame />}
        </div>
      </div>

      {/* Floating Theme Toggle */}
      <ThemeToggle />
    </div>
  );
}

export default function EloLeaderboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <EloLeaderboardContent />
    </Suspense>
  );
}
