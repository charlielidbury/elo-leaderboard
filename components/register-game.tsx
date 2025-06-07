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
            {player.name} ({player.rating_check})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function RegisterGame() {
  const [isOpen, setIsOpen] = useState(false);
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  const players = useQuery(playersQuery);
  const queryClient = useQueryClient();

  const registerGameMut = useMutation({
    ...registerGameMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setIsOpen(false);
      setPlayer1(null);
      setPlayer2(null);
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
    if (!player1 || !player2) {
      toast({
        title: "Please select both players",
        variant: "destructive",
      });
      return;
    }

    if (player1.id === player2.id) {
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
      player1,
      player2,
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
              {/* Player 1 */}
              <div className="flex-1 space-y-4">
                <PlayerSelector
                  value={player1?.id || ""}
                  onValueChange={setPlayer1}
                  disabledPlayerId={player2?.id}
                  placeholder="Select Player 1"
                />
              </div>

              {/* VS */}
              <div className="flex-shrink-0 px-8">
                <div className="text-2xl font-bold text-muted-foreground">
                  VS
                </div>
              </div>

              {/* Player 2 */}
              <div className="flex-1 space-y-4">
                <PlayerSelector
                  value={player2?.id || ""}
                  onValueChange={setPlayer2}
                  disabledPlayerId={player1?.id}
                  placeholder="Select Player 2"
                />
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">Result</h2>
            <div className="flex gap-8 justify-center">
              <Button
                onClick={() => setWinner(player1)}
                disabled={!player1 || !player2}
                className="flex-1 max-w-48 h-16 text-xl font-semibold"
                variant={winner === player1 ? "default" : "outline"}
              >
                {player1?.name || "Left"} Wins
              </Button>

              <Button
                onClick={() => setWinner(null)}
                disabled={!player1 || !player2}
                className="flex-1 max-w-36 h-16 text-xl font-semibold"
                variant={
                  winner === null && player1 && player2 ? "default" : "outline"
                }
              >
                Draw
              </Button>

              <Button
                onClick={() => setWinner(player2)}
                disabled={!player1 || !player2}
                className="flex-1 max-w-48 h-16 text-xl font-semibold"
                variant={winner === player2 ? "default" : "outline"}
              >
                {player2?.name || "Right"} Wins
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSubmitGame}
              disabled={
                !player1 ||
                !player2 ||
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
