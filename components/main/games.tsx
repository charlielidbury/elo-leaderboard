import { useQuery } from "@tanstack/react-query";
import { gamesQuery } from "@/lib/backend";
import { useState } from "react";
import { type Game } from "@/lib/database";
import RegisterGame from "@/components/register-game";

function GameDisplay({ game }: { game: Game }) {
  const [isClicked, setIsClicked] = useState(false);

  const charlieIsWinner = game.winner?.id === game.charlie.id;
  const rushilIsWinner = game.winner?.id === game.rushil.id;

  return (
    <div
      key={game.id}
      className="flex items-center justify-between p-6 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => setIsClicked(!isClicked)}
    >
      {/* Left Player */}
      <div className="flex-1 text-left">
        <div className="text-2xl font-bold">{game.charlie.name}</div>
      </div>

      {/* Score in the middle */}
      <div className="flex-shrink-0 mx-8 text-center">
        <div className="text-2xl">
          {charlieIsWinner ? "1" : "0"} - {rushilIsWinner ? "1" : "0"}
        </div>
        {isClicked && (
          <div className="text-xs text-muted-foreground/60 mt-2">
            {game.created_at && new Date(game.created_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Right Player */}
      <div className="flex-1 text-right">
        <div className="text-2xl font-bold">{game.rushil.name}</div>
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

  return (
    <div className="space-y-4">
      <RegisterGame />

      {games.data?.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No games recorded yet.
        </p>
      ) : (
        games.data
          ?.slice(0, 10)
          .map((game) => <GameDisplay key={game.id} game={game} />)
      )}
    </div>
  );
}
