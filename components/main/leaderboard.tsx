import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { playersQuery } from "@/lib/backend";
import { useState, useEffect } from "react";
import { type Player } from "@/lib/database";

// Animation constants
const ANIMATION_DELAY_MS = 50;
const ANIMATION_DURATION_MS = 200;

interface PlayerDisplayProps {
  player: Player;
  index: number;
}

function PlayerDisplay({ player, index }: PlayerDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * ANIMATION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      key={player.id}
      className={`flex items-center justify-between p-4 rounded-lg border bg-muted transition-all ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDuration: `${ANIMATION_DURATION_MS}ms` }}
    >
      <div className="flex items-center gap-4">
        <Badge variant={index === 0 ? "default" : "secondary"}>
          #{index + 1}
        </Badge>
        <div>
          <h3 className="text-xl font-semibold">{player.name}</h3>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xl font-bold">{Math.round(player.rating)}</div>
      </div>
    </div>
  );
}

export default function Players() {
  const players = useQuery(playersQuery);

  if (players.isLoading) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Loading players...
      </p>
    );
  }

  if (players.isError) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Error loading players. Please try again.
      </p>
    );
  }

  if (players.data?.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No players yet. Add some players to get started!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {players.data &&
        players.data.map((player, index) => (
          <PlayerDisplay key={player.id} player={player} index={index} />
        ))}
    </div>
  );
}
