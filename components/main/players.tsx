import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { playersQuery, gamesQuery } from "@/lib/backend";
import { calculatePlayerRatings, type PlayerWithRating } from "@/lib/elo";
import { useMemo } from "react";

interface PlayerDisplayProps {
  player: PlayerWithRating;
  index: number;
}

function PlayerDisplay({ player, index }: PlayerDisplayProps) {
  return (
    <div
      key={player.id}
      className="flex items-center justify-between p-4 rounded-lg border"
    >
      <div className="flex items-center gap-4">
        <Badge variant={index === 0 ? "default" : "secondary"}>
          #{index + 1}
        </Badge>
        <div>
          <h3 className="font-semibold">{player.name}</h3>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">{Math.round(player.rating)}</div>
      </div>
    </div>
  );
}

export default function Players() {
  const players = useQuery(playersQuery);
  const games = useQuery(gamesQuery);

  const playersWithRatings = useMemo(() => {
    if (!players.data || !games.data) return [];
    return calculatePlayerRatings(players.data, games.data);
  }, [players.data, games.data]);

  if (players.isLoading || games.isLoading) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Loading players...
      </p>
    );
  }

  if (players.isError || games.isError) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Error loading players. Please try again.
      </p>
    );
  }

  if (playersWithRatings.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No players yet. Add some players to get started!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {playersWithRatings
        .sort((a, b) => b.rating - a.rating)
        .map((player, index) => (
          <PlayerDisplay key={player.id} player={player} index={index} />
        ))}
    </div>
  );
}
