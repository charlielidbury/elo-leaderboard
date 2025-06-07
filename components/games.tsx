import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase, type GameResult } from "@/lib/supabase";

interface GamesProps {
  refreshTrigger?: number;
}

export default function Games({ refreshTrigger }: GamesProps) {
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);

  const fetchGameHistory = async () => {
    try {
      const { data: games, error } = await supabase
        .from("games")
        .select(
          `
          *,
          player1:players!games_player1_id_fkey(*),
          player2:players!games_player2_id_fkey(*),
          winner_player:players!games_winner_id_fkey(*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected format
      const gamesWithPlayers =
        games?.map((game) => ({
          ...game,
          player1: Array.isArray(game.player1) ? game.player1[0] : game.player1,
          player2: Array.isArray(game.player2) ? game.player2[0] : game.player2,
          winner: Array.isArray(game.winner_player)
            ? game.winner_player[0]
            : game.winner_player,
        })) || [];

      setGameHistory(gamesWithPlayers as GameResult[]);
    } catch (error) {
      console.error("Error fetching game history:", error);
      toast({ title: "Error fetching games", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchGameHistory();
  }, [refreshTrigger]);

  if (gameHistory.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No games recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {gameHistory.slice(0, 10).map((game) => {
        const player1IsWinner = game.winner?.id === game.player1?.id;
        const player2IsWinner = game.winner?.id === game.player2?.id;

        return (
          <div
            key={game.id}
            className="flex items-center justify-between p-6 rounded-lg border"
          >
            {/* Left Player */}
            <div className="flex-1 text-left">
              <div
                className={`text-2xl font-bold ${
                  player1IsWinner ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                {game.player1?.name}
              </div>
            </div>

            {/* Score in the middle */}
            <div className="flex-shrink-0 mx-8">
              <div className="text-3xl font-bold text-center">
                {player1IsWinner ? "1" : "0"} - {player2IsWinner ? "1" : "0"}
              </div>
            </div>

            {/* Right Player */}
            <div className="flex-1 text-right">
              <div
                className={`text-2xl font-bold ${
                  player2IsWinner ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                {game.player2?.name}
              </div>
              <div className="text-xs text-muted-foreground/60 mt-1">
                {game.created_at &&
                  new Date(game.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
