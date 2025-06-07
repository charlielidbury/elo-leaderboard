import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabaseDataService, type GameResult } from "@/lib/supabase-service";

interface GamesProps {
  refreshTrigger?: number;
}

export default function Games({ refreshTrigger }: GamesProps) {
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);

  const fetchGameHistory = async () => {
    try {
      const { data: games, error } =
        await supabaseDataService.getGamesWithPlayers();
      if (error) throw error;
      setGameHistory(games || []);
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
        const player1Change =
          game.player1_rating_after - game.player1_rating_before;
        const player2Change =
          game.player2_rating_after - game.player2_rating_before;

        return (
          <div
            key={game.id}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="font-semibold">{game.player1?.name}</div>
                <div
                  className={`text-sm flex items-center gap-1 ${
                    player1Change > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {player1Change > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {player1Change > 0 ? "+" : ""}
                  {Math.round(player1Change)}
                </div>
              </div>
              <div className="text-muted-foreground">vs</div>
              <div className="text-center">
                <div className="font-semibold">{game.player2?.name}</div>
                <div
                  className={`text-sm flex items-center gap-1 ${
                    player2Change > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {player2Change > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {player2Change > 0 ? "+" : ""}
                  {Math.round(player2Change)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline">Winner: {game.winner?.name}</Badge>
              <div className="text-sm text-muted-foreground mt-1">
                {game.created_at &&
                  new Date(game.created_at).toLocaleDateString()}{" "}
                {game.created_at &&
                  new Date(game.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
