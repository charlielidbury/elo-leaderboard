import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  playersQuery,
  registerGameMutation,
  currentPlayerQuery,
} from "@/lib/backend";
import { toast } from "@/hooks/use-toast";
import { type Player } from "@/lib/database";
import { useAuth } from "@/hooks/use-auth";
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
            {player.name} ({Math.round(player.rating)})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface OpponentSelectStageProps {
  currentUser: Player;
  opponent: Player | null;
  setOpponent: (player: Player | null) => void;
}

function OpponentSelectStage({
  currentUser,
  opponent,
  setOpponent,
}: OpponentSelectStageProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center">Select Opponent</h2>
      <div className="flex items-center gap-8">
        {/* Current User */}
        <div className="flex-1 space-y-4">
          <div className="text-2xl h-16 flex items-center justify-center bg-muted rounded-md border">
            {currentUser.name} ({Math.round(currentUser.rating)})
          </div>
        </div>

        {/* VS */}
        <div className="flex-shrink-0 px-8">
          <div className="text-2xl font-bold text-muted-foreground">VS</div>
        </div>

        {/* Opponent */}
        <div className="flex-1 space-y-4">
          <PlayerSelector
            value={opponent?.id || ""}
            onValueChange={setOpponent}
            disabledPlayerId={currentUser.id}
            placeholder="Select Opponent"
          />
        </div>
      </div>
    </div>
  );
}

interface ResultStageProps {
  currentUser: Player;
  opponent: Player;
  winner: Player | null;
  setWinner: (winner: Player | null) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function ResultStage({
  currentUser,
  opponent,
  winner,
  setWinner,
  onSubmit,
  isSubmitting,
}: ResultStageProps) {
  return (
    <>
      {/* Result Section */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-center">Result</h2>
        <div className="flex gap-8 justify-center">
          <Button
            onClick={() => setWinner(currentUser)}
            className="flex-1 max-w-48 h-16 text-xl font-semibold"
            variant={winner === currentUser ? "default" : "outline"}
          >
            I Win
          </Button>

          <Button
            onClick={() => setWinner(null)}
            className="flex-1 max-w-36 h-16 text-xl font-semibold"
            variant={winner === null ? "default" : "outline"}
          >
            Draw
          </Button>

          <Button
            onClick={() => setWinner(opponent)}
            className="flex-1 max-w-48 h-16 text-xl font-semibold"
            variant={winner === opponent ? "default" : "outline"}
          >
            {opponent.name} Wins
          </Button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={onSubmit}
          disabled={winner === null || isSubmitting}
          className="w-64 h-16 text-2xl font-bold"
          variant="default"
        >
          {isSubmitting ? "Submitting..." : "Submit Game"}
        </Button>
      </div>
    </>
  );
}

export default function RegisterGame() {
  const [isOpen, setIsOpen] = useState(false);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  const { user: authUser } = useAuth();
  const currentUserPlayer = useQuery(currentPlayerQuery);
  const players = useQuery(playersQuery);
  const queryClient = useQueryClient();

  const registerGameMut = useMutation({
    ...registerGameMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setIsOpen(false);
      setOpponent(null);
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
    if (!currentUserPlayer.data || !opponent) {
      toast({
        title: "Please select an opponent",
        variant: "destructive",
      });
      return;
    }

    if (currentUserPlayer.data.id === opponent.id) {
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

    // Map current user to Charlie or Rushil based on some logic
    // For simplicity, let's always put current user as Charlie
    registerGameMut.mutate({
      charlie: currentUserPlayer.data,
      rushil: opponent,
      winner,
    });
  };

  // Show loading state while fetching current user
  if (!authUser) {
    return (
      <div className="flex items-center justify-center p-6 rounded-lg border-2 border-dashed border-muted-foreground/30">
        <p className="text-muted-foreground">
          Please sign in to register a game
        </p>
      </div>
    );
  }

  if (currentUserPlayer.isLoading) {
    return (
      <div className="flex items-center justify-center p-6 rounded-lg border-2 border-dashed border-muted-foreground/30">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!currentUserPlayer.data) {
    return (
      <div className="flex items-center justify-center p-6 rounded-lg border-2 border-dashed border-muted-foreground/30">
        <p className="text-muted-foreground">
          Player profile not found. Please contact an admin.
        </p>
      </div>
    );
  }

  const opponentSelected = opponent !== null;

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
          {/* Opponent Selection Stage */}
          <OpponentSelectStage
            currentUser={currentUserPlayer.data}
            opponent={opponent}
            setOpponent={setOpponent}
          />

          {/* Result Stage - Only show when opponent is selected */}
          {opponentSelected && (
            <ResultStage
              currentUser={currentUserPlayer.data}
              opponent={opponent}
              winner={winner}
              setWinner={setWinner}
              onSubmit={handleSubmitGame}
              isSubmitting={registerGameMut.isPending}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
