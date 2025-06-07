"use client";

import { Badge } from "@/components/ui/badge";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Trash2,
  Trophy,
  History,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  mockDataService,
  type Player,
  type GameResult,
} from "@/lib/mock-data-service";
import Rankings from "@/components/rankings";
import Games from "@/components/games";

export default function EloLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<"rankings" | "games">(
    "rankings"
  );

  useEffect(() => {
    fetchPlayers();
    fetchGameHistory();
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data: players, error } = await mockDataService.getPlayers();
      if (error) throw error;
      setPlayers(players || []);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({ title: "Error fetching players", variant: "destructive" });
    }
  };

  const fetchGameHistory = async () => {
    try {
      const { data: games, error } =
        await mockDataService.getGamesWithPlayers();
      if (error) throw error;
      setGameHistory(games || []);
    } catch (error) {
      console.error("Error fetching game history:", error);
      toast({ title: "Error fetching games", variant: "destructive" });
    }
  };

  const resetData = async () => {
    setLoading(true);
    try {
      await mockDataService.resetToSampleData();
      await fetchPlayers();
      await fetchGameHistory();
      toast({ title: "Data reset to sample data" });
    } catch (error) {
      toast({ title: "Error resetting data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    setLoading(true);
    try {
      await mockDataService.clearAllData();
      await fetchPlayers();
      await fetchGameHistory();
      toast({ title: "All data cleared" });
    } catch (error) {
      toast({ title: "Error clearing data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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

      {currentView === "rankings" ? (
        <Rankings players={players} />
      ) : (
        <Games gameHistory={gameHistory} />
      )}
    </div>
  );
}
