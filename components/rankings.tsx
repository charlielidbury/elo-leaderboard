import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase, type Player } from "@/lib/supabase";

interface RankingsProps {
  refreshTrigger?: number;
}

export default function Rankings({ refreshTrigger }: RankingsProps) {
  const [players, setPlayers] = useState<Player[]>([]);

  const fetchPlayers = async () => {
    try {
      const { data: players, error } = await supabase
        .from("players")
        .select("*")
        .order("rating_check", { ascending: false });

      if (error) throw error;
      setPlayers(players || []);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({ title: "Error fetching players", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [refreshTrigger]);

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
        .sort((a, b) => (b.rating_check || 0) - (a.rating_check || 0))
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
                  Player since{" "}
                  {player.created_at &&
                    new Date(player.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {Math.round(player.rating_check || 0)}
              </div>
              <div className="text-sm text-muted-foreground">ELO Rating</div>
            </div>
          </div>
        ))}
    </div>
  );
}
