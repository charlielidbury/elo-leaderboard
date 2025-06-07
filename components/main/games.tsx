import { useQuery } from "@tanstack/react-query";
import { gamesQuery } from "@/lib/backend";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { type GameResult } from "@/lib/supabase";

export default function Games() {
  const [clickedGameId, setClickedGameId] = useState<string | null>(null);

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

  const handleGameClick = (gameId: string) => {
    setClickedGameId(clickedGameId === gameId ? null : gameId);
  };

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
        const isClicked = clickedGameId === game.id;

        return (
          <div
            key={game.id}
            className="flex items-center justify-between p-6 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleGameClick(game.id)}
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
            <div className="flex-shrink-0 mx-8 text-center">
              <div className="text-3xl font-bold">
                {player1IsWinner ? "1" : "0"} - {player2IsWinner ? "1" : "0"}
              </div>
              {isClicked && (
                <div className="text-xs text-muted-foreground/60 mt-2">
                  {game.created_at &&
                    new Date(game.created_at).toLocaleDateString()}
                </div>
              )}
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
