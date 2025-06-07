import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { playersQuery } from "@/lib/backend";

interface PlayerDisplayProps {
  player: {
    id: string;
    name: string;
    rating_check?: number;
  };
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
        <div className="text-2xl font-bold">
          {Math.round(player.rating_check || 0)}
        </div>
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
      {players.data
        ?.sort((a, b) => (b.rating_check || 0) - (a.rating_check || 0))
        .map((player, index) => (
          <PlayerDisplay key={player.id} player={player} index={index} />
        ))}
    </div>
  );
}
