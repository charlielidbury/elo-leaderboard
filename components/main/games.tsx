import { useQuery } from "@tanstack/react-query";
import { gamesQuery } from "@/lib/backend";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { type Game } from "@/lib/database";

function GameDisplay({ game }: { game: Game }) {
  const [isClicked, setIsClicked] = useState(false);

  const player1IsWinner = game.winner?.id === game.player1?.id;
  const player2IsWinner = game.winner?.id === game.player2?.id;

  return (
    <div
      key={game.id}
      className="flex items-center justify-between p-6 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => setIsClicked(!isClicked)}
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
            {game.created_at && new Date(game.created_at).toLocaleDateString()}
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
}

export default function Games() {
  const games = useQuery(gamesQuery);

  if (games.isLoading) {
    return (
      <p className="text-center text-muted-foreground py-8">Loading games...</p>
    );
  }

  if (games.isError) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Error loading games. Please try again.
      </p>
    );
  }

  if (games.data?.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No games recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {games.data?.slice(0, 10).map((game) => (
        <GameDisplay key={game.id} game={game} />
      ))}
    </div>
  );
}
