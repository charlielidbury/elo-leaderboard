import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { type GameResult } from "@/lib/supabase";
import { useEffect } from "react";
import { gamesQuery } from "@/lib/backend";

export default function Games() {
  const {
    data: gameHistory = [],
    isLoading,
    isError,
    error,
  } = useQuery<GameResult[], Error>({
    queryKey: gamesQuery.queryKey,
    queryFn: gamesQuery.queryFn,
  });

  // Handle errors with useEffect since onError was removed in v5
  useEffect(() => {
    if (isError && error) {
      console.error("Error fetching game history:", error);
      toast({ title: "Error fetching games", variant: "destructive" });
    }
  }, [isError, error]);

  if (isLoading) {
    return (
      <p className="text-center text-muted-foreground py-8">Loading games...</p>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Error loading games. Please try again.
      </p>
    );
  }

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
