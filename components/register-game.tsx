import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { playersQuery, registerGameMutation } from "@/lib/backend";
import { toast } from "@/hooks/use-toast";
import { type Player } from "@/lib/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PlayerSelectorProps {
  value: string;
  onValueChange: (player: Player | null) => void;
  disabledPlayerId?: string;
  placeholder: string;
  className?: string;
}

function PlayerSelector({
  value,
  onValueChange,
  disabledPlayerId,
  placeholder,
  className = "",
}: PlayerSelectorProps) {
  const players = useQuery(playersQuery);

  return (
    <Select
      value={value}
      onValueChange={(playerId) => {
        const selectedPlayer = players.data?.find((p) => p.id === playerId);
        onValueChange(selectedPlayer || null);
      }}
    >
      <SelectTrigger className={`text-2xl h-16 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {players.data?.map((player) => (
          <SelectItem
            key={player.id}
            value={player.id}
            disabled={player.id === disabledPlayerId}
          >
            {player.name} ({player.rating})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function RegisterGame() {
  const [isOpen, setIsOpen] = useState(false);
  const [playerA, setPlayerA] = useState<Player | null>(null);
  const [playerB, setPlayerB] = useState<Player | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  const players = useQuery(playersQuery);
  const queryClient = useQueryClient();

  const registerGameMut = useMutation({
    ...registerGameMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setIsOpen(false);
      setPlayerA(null);
      setPlayerB(null);
      setWinner(null);
      toast({
        title: "Game added successfully!",
        description: "The game has been recorded and ratings updated.",
      });
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
    if (!playerA || !playerB) {
      toast({
        title: "Please select both players",
        variant: "destructive",
      });
      return;
    }

    if (playerA.id === playerB.id) {
      toast({
        title: "Please select different players",
        variant: "destructive",
      });
      return;
    }

    if (winner === null) {
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
      playerA,
      playerB,
      winner,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center justify-center p-6 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:bg-muted/50 transition-colors hover:border-muted-foreground/50">
          <Plus className="w-8 h-8 text-muted-foreground/60" />
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-none w-screen h-screen m-0 rounded-none flex flex-col">
        <DialogHeader className="py-8 px-8">
          <DialogTitle className="text-4xl font-bold text-center">
            Register Game
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col px-8 pb-8 space-y-12 max-w-6xl mx-auto w-full">
          {/* Players Section */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">Players</h2>
            <div className="flex items-center gap-8">
              {/* Player A */}
              <div className="flex-1 space-y-4">
                <PlayerSelector
                  value={playerA?.id || ""}
                  onValueChange={setPlayerA}
                  disabledPlayerId={playerB?.id}
                  placeholder="Select Player A"
                />
              </div>

              {/* VS */}
              <div className="flex-shrink-0 px-8">
                <div className="text-2xl font-bold text-muted-foreground">
                  VS
                </div>
              </div>

              {/* Player B */}
              <div className="flex-1 space-y-4">
                <PlayerSelector
                  value={playerB?.id || ""}
                  onValueChange={setPlayerB}
                  disabledPlayerId={playerA?.id}
                  placeholder="Select Player B"
                />
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">Result</h2>
            <div className="flex gap-8 justify-center">
              <Button
                onClick={() => setWinner(playerA)}
                disabled={!playerA || !playerB}
                className="flex-1 max-w-48 h-16 text-xl font-semibold"
                variant={winner === playerA ? "default" : "outline"}
              >
                {playerA?.name || "Left"} Wins
              </Button>

              <Button
                onClick={() => setWinner(null)}
                disabled={!playerA || !playerB}
                className="flex-1 max-w-36 h-16 text-xl font-semibold"
                variant={
                  winner === null && playerA && playerB ? "default" : "outline"
                }
              >
                Draw
              </Button>

              <Button
                onClick={() => setWinner(playerB)}
                disabled={!playerA || !playerB}
                className="flex-1 max-w-48 h-16 text-xl font-semibold"
                variant={winner === playerB ? "default" : "outline"}
              >
                {playerB?.name || "Right"} Wins
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSubmitGame}
              disabled={
                !playerA ||
                !playerB ||
                winner === null ||
                registerGameMut.isPending
              }
              className="w-64 h-16 text-2xl font-bold"
              variant="default"
            >
              {registerGameMut.isPending ? "Submitting..." : "Submit Game"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
