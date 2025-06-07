import { Badge } from "@/components/ui/badge";
import { type Player } from "@/lib/mock-data-service";

interface RankingsProps {
  players: Player[];
}

export default function Rankings({ players }: RankingsProps) {
  if (players.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No players yet. Add some players to get started!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {players
        .sort((a, b) => b.rating - a.rating)
        .map((player, index) => (
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
                <p className="text-sm text-muted-foreground">
                  {player.wins}W - {player.losses}L ({player.games_played}{" "}
                  games)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {Math.round(player.rating)}
              </div>
              <div className="text-sm text-muted-foreground">ELO Rating</div>
            </div>
          </div>
        ))}
    </div>
  );
}
