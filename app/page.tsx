"use client";

import { Button } from "@/components/ui/button";
import { Trophy, History, Plus } from "lucide-react";
import Players from "@/components/main/players";
import Games from "@/components/main/games";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginButton } from "@/components/login-button";
import RegisterGame from "@/components/register-game";
import { useTab } from "@/hooks/use-tab";

export default function EloLeaderboard() {
  const { currentTab, setTab } = useTab();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header with Login Button */}
      <div className="flex justify-between items-start">
        <div className="text-center space-y-2 flex-1">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            ELO Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Track competitive rankings with ELO rating system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LoginButton />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center gap-4">
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

      {/* Content based on current view */}
      {currentTab === "history" && <Games />}
      {currentTab === "leaderboard" && <Players />}
      {currentTab === "addgame" && <RegisterGame />}

      {/* Floating Theme Toggle */}
      <ThemeToggle />
    </div>
  );
}
