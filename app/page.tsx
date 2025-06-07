"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, History } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Rankings from "@/components/main/rankings";
import Games from "@/components/main/games";
import { ThemeToggle } from "@/components/theme-toggle";

export default function EloLeaderboard() {
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<"rankings" | "games">(
    "rankings"
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          ELO Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Track competitive rankings with ELO rating system
        </p>
      </div>

      {/* Main Content with Toggle */}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentView === "rankings" ? (
            <>
              <Trophy className="h-5 w-5" />
              Current Rankings
            </>
          ) : (
            <>
              <History className="h-5 w-5" />
              Recent Games
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === "rankings" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentView("rankings")}
          >
            <Trophy className="h-4 w-4 mr-1" />
            Rankings
          </Button>
          <Button
            variant={currentView === "games" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentView("games")}
          >
            <History className="h-4 w-4 mr-1" />
            Games
          </Button>
        </div>
      </div>

      {currentView === "rankings" ? <Rankings /> : <Games />}

      {/* Floating Theme Toggle */}
      <ThemeToggle />
    </div>
  );
}
