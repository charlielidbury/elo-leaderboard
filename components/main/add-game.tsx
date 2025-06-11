import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { playersQuery, registerGameMutation } from "@/lib/backend";
import { toast } from "@/hooks/use-toast";
import { type Player } from "@/lib/database";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/hooks/use-player";
import { useTab } from "@/hooks/use-tab";

export default function RegisterGame() {
  const { player } = usePlayer();

  if (player === undefined) {
    return;
  }

  // Show loading state while fetching current user
  if (player === null) {
    return (
      <div className="flex items-center justify-center p-12 rounded-lg border-2 border-dashed border-muted-foreground/30">
        <p className="text-muted-foreground text-lg">
          Please sign in to register a game
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <OpponentSelectStage currentUser={player} />
    </div>
  );
}

function OpponentSelectStage({ currentUser }: { currentUser: Player }) {
  const players = useQuery(playersQuery);
  const [opponent, setOpponent] = useState<Player | null>(null);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-center">
        <div>
          <Select
            value=""
            onValueChange={(playerId) => {
              const selectedPlayer = players.data?.find(
                (p) => p.id === playerId
              );
              setOpponent(selectedPlayer || null);
            }}
          >
            <SelectTrigger className="text-2xl font-semibold h-16 px-8">
              <SelectValue placeholder="Opponent" />
            </SelectTrigger>
            <SelectContent>
              {players.data?.map((player) => (
                <SelectItem
                  key={player.id}
                  value={player.id}
                  disabled={player.id === currentUser.id}
                >
                  {player.name} ({Math.round(player.rating)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {opponent && (
        <ResultStage currentUser={currentUser} opponent={opponent} />
      )}
    </div>
  );
}

function ResultStage({
  currentUser,
  opponent,
}: {
  currentUser: Player;
  opponent: Player;
}) {
  const [winner, setWinner] = useState<Player | null | undefined>(undefined);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-center">
        <div className="flex">
          <Button
            onClick={() => setWinner(currentUser)}
            className="h-16 text-2xl font-semibold px-8 rounded-r-none border-r-0"
            variant={winner === currentUser ? "default" : "outline"}
          >
            Win
          </Button>

          <Button
            onClick={() => setWinner(opponent)}
            className="h-16 text-2xl font-semibold px-8 rounded-l-none"
            variant={winner === opponent ? "default" : "outline"}
          >
            Loss
          </Button>

          <Button
            onClick={() => setWinner(null)}
            className="h-16 text-2xl font-semibold px-8 rounded-none border-r-0"
            variant={winner === null ? "default" : "outline"}
          >
            Draw
          </Button>
        </div>
      </div>

      <SubmitStage
        currentUser={currentUser}
        opponent={opponent}
        winner={winner}
      />
    </div>
  );
}

function SubmitStage({
  currentUser,
  opponent,
  winner,
}: {
  currentUser: Player;
  opponent: Player;
  winner: Player | null | undefined;
}) {
  const players = useQuery(playersQuery);
  const queryClient = useQueryClient();
  const { setTab } = useTab();

  const registerGameMut = useMutation({
    ...registerGameMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast({
        title: "Game added successfully!",
        description: "The game has been recorded and ratings updated.",
      });
      // Switch to history tab to show the newly added game
      setTab("history");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitGame = () => {
    if (currentUser.id === opponent.id) {
      toast({
        title: "You cannot play against yourself",
        variant: "destructive",
      });
      return;
    }

    if (winner === undefined) {
      toast({
        title: "Please select a result",
        variant: "destructive",
      });
      return;
    }

    if (!players.data) {
      toast({
        title: "Players data not loaded",
        variant: "destructive",
      });
      return;
    }

    registerGameMut.mutate({
      charlie: currentUser,
      rushil: opponent,
      winner,
    });
  };

  return (
    <div className="flex justify-center">
      <Button
        onClick={handleSubmitGame}
        disabled={winner === undefined || registerGameMut.isPending}
        className="h-16 text-2xl font-bold px-8"
        variant="default"
      >
        {registerGameMut.isPending ? "Submitting..." : "Submit Game"}
      </Button>
    </div>
  );
}
