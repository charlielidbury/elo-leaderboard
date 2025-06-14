import { useQuery } from "@tanstack/react-query";
import { gamesQuery } from "@/lib/backend";
import { useState, useEffect } from "react";
import { type Game } from "@/lib/database";

// Animation constants
const ANIMATION_DELAY_MS = 35;
const ANIMATION_DURATION_MS = 150;

function GameDisplay({ game, index }: { game: Game; index: number }) {
  const [isClicked, setIsClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * ANIMATION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      key={game.id}
      className={`rounded-lg border cursor-pointer bg-muted transition-all ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDuration: `${ANIMATION_DURATION_MS}ms` }}
      onClick={() => setIsClicked(!isClicked)}
    >
      {/* Main row content */}
      <div className="flex items-center justify-between p-4">
        {/* Left Player */}
        <div className="flex-1 text-left">
          <div className="text-xl font-semibold">{game.charlie.name}</div>
        </div>

        {/* Score in the middle */}
        <div className="flex-shrink-0 mx-8 text-center">
          <div className="text-xl font-bold">
            {game.winner === game.charlie
              ? "1 - 0"
              : game.winner === null
              ? "½ - ½"
              : "0 - 1"}
          </div>
        </div>

        {/* Right Player */}
        <div className="flex-1 text-right">
          <div className="text-xl font-semibold">{game.rushil.name}</div>
        </div>
      </div>

      {/* Expanded content */}
      {isClicked && (
        <div className="px-4 pb-4 pt-0 text-center">
          <div className="text-xs text-muted-foreground/60">
            {game.created_at && new Date(game.created_at).toLocaleDateString()}
          </div>
        </div>
      )}
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
    <div className="space-y-2">
      {games.data?.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No games recorded yet.
        </p>
      ) : (
        games.data
          ?.slice(0, 10)
          .map((game, index) => (
            <GameDisplay key={game.id} game={game} index={index} />
          ))
      )}
    </div>
  );
}
