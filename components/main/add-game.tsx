import { useState, useEffect } from "react";
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
import { pointsTransfer } from "@/lib/elo";

const STAGE_FADE_IN = "animate-in fade-in duration-300";

// Rating animation constants
const RATING_ANIMATION_DURATION_PER_10_POINTS = 1000; // 1 second per 10 points transferred
const RATING_ANIMATION_STEPS = 60; // 60 steps for smooth animation
const RATING_ANIMATION_DELAY = 500; // 500ms delay before animation starts

export default function RegisterGame() {
  const { player } = usePlayer();

  if (player === undefined) {
    return;
  }

  // Show loading state while fetching current user
  if (player === null) {
    return (
      <div className="flex items-center justify-center p-12 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted">
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
            value={opponent?.id || ""}
            onValueChange={(playerId) => {
              const selectedPlayer = players.data?.find(
                (p) => p.id === playerId
              );
              setOpponent(selectedPlayer || null);
            }}
          >
            <SelectTrigger
              className={`text-2xl font-semibold h-16 px-8 gap-3 ${
                !opponent
                  ? "bg-muted hover:bg-muted/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <SelectValue placeholder="Opponent" />
            </SelectTrigger>
            <SelectContent>
              {players.data?.map((player) => (
                <SelectItem
                  key={player.id}
                  value={player.id}
                  disabled={player.id === currentUser.id}
                >
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {opponent && (
        <div className={STAGE_FADE_IN}>
          <ResultStage currentUser={currentUser} opponent={opponent} />
        </div>
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
            className={`h-16 text-2xl font-semibold px-8 rounded-r-none border-r-0 ${
              winner !== currentUser ? "bg-muted hover:bg-muted/80" : ""
            }`}
            variant={winner === currentUser ? "default" : "outline"}
          >
            Win
          </Button>

          <Button
            onClick={() => setWinner(opponent)}
            className={`h-16 text-2xl font-semibold px-8 rounded-none border-r-0 ${
              winner !== opponent ? "bg-muted hover:bg-muted/80" : ""
            }`}
            variant={winner === opponent ? "default" : "outline"}
          >
            Loss
          </Button>

          <Button
            onClick={() => setWinner(null)}
            className={`h-16 text-2xl font-semibold px-8 rounded-l-none ${
              winner !== null ? "bg-muted hover:bg-muted/80" : ""
            }`}
            variant={winner === null ? "default" : "outline"}
          >
            Draw
          </Button>
        </div>
      </div>

      <div className={STAGE_FADE_IN}>
        <RatingStage
          currentUser={currentUser}
          opponent={opponent}
          winner={winner}
        />
      </div>
    </div>
  );
}

function RatingStage({
  currentUser,
  opponent,
  winner,
}: {
  currentUser: Player;
  opponent: Player;
  winner: Player | null | undefined;
}) {
  const [isAnimating, setIsAnimating] = useState(true);
  useEffect(() => {
    setIsAnimating(true);
  }, [winner]);

  if (winner === undefined) {
    return null;
  }

  return (
    <div className="space-y-12">
      <RatingDisplay
        currentUser={currentUser}
        opponent={opponent}
        winner={winner}
        setAnimating={setIsAnimating}
      />
      <SubmitStage
        currentUser={currentUser}
        opponent={opponent}
        winner={winner}
        isAnimating={isAnimating}
      />
    </div>
  );
}

function RatingDisplay({
  currentUser,
  opponent,
  winner,
  setAnimating,
}: {
  currentUser: Player;
  opponent: Player;
  winner: Player | null | undefined;
  setAnimating: (isAnimating: boolean) => void;
}) {
  const [animatedCurrentRating, setAnimatedCurrentRating] = useState(
    Math.round(currentUser.rating)
  );
  const [animatedOpponentRating, setAnimatedOpponentRating] = useState(
    Math.round(opponent.rating)
  );
  const [animatedCurrentChange, setAnimatedCurrentChange] = useState(0);
  const [animatedOpponentChange, setAnimatedOpponentChange] = useState(0);

  // Calculate rating changes
  const pointsToOpponent = pointsTransfer(
    currentUser,
    opponent,
    winner === undefined ? null : winner
  );
  const pointsToCurrentUser = -pointsToOpponent;

  const newCurrentRating = Math.round(currentUser.rating + pointsToCurrentUser);
  const newOpponentRating = Math.round(opponent.rating + pointsToOpponent);

  useEffect(() => {
    // Calculate animation duration based on points transfer
    const pointsTransferred = Math.abs(pointsToOpponent);
    const calculatedDuration =
      (pointsTransferred / 10) * RATING_ANIMATION_DURATION_PER_10_POINTS;

    // Start animation after a short delay
    const timer = setTimeout(() => {
      const duration = calculatedDuration;
      const steps = RATING_ANIMATION_STEPS;
      const interval = duration / steps;

      let currentStep = 0;

      const animate = () => {
        currentStep++;
        const progress = currentStep / steps;

        // Ease-out animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const currentRatingDiff = newCurrentRating - currentUser.rating;
        const opponentRatingDiff = newOpponentRating - opponent.rating;

        const newAnimatedCurrentRating = Math.round(
          currentUser.rating + currentRatingDiff * easeProgress
        );
        const newAnimatedOpponentRating = Math.round(
          opponent.rating + opponentRatingDiff * easeProgress
        );

        setAnimatedCurrentRating(newAnimatedCurrentRating);
        setAnimatedOpponentRating(newAnimatedOpponentRating);

        // Animate the change indicators as well
        setAnimatedCurrentChange(
          Math.round(pointsToCurrentUser * easeProgress)
        );
        setAnimatedOpponentChange(Math.round(pointsToOpponent * easeProgress));

        if (currentStep < steps) {
          setTimeout(animate, interval);
        } else {
          setAnimating(false); // Animation ends
        }
      };

      animate();
    }, RATING_ANIMATION_DELAY);

    return () => clearTimeout(timer);
  }, [
    currentUser.rating,
    opponent.rating,
    newCurrentRating,
    newOpponentRating,
    pointsToCurrentUser,
    pointsToOpponent,
    setAnimating,
  ]);

  const formatChange = (change: number) => {
    if (change > 0) return `(+${change})`;
    if (change < 0) return `(${change})`;
    return "(0)";
  };

  return (
    <div className="flex items-center justify-center space-x-16">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground">
          {currentUser.name}
        </h3>
        <div className="mt-2">
          <span className="text-xl font-semibold">{animatedCurrentRating}</span>
          {animatedCurrentChange !== 0 && (
            <span
              className={`ml-2 text-sm font-medium ${
                animatedCurrentChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatChange(animatedCurrentChange)}
            </span>
          )}
        </div>
      </div>

      <div className="text-4xl font-bold text-muted-foreground">VS</div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground">{opponent.name}</h3>
        <div className="mt-2">
          <span className="text-xl font-semibold">
            {animatedOpponentRating}
          </span>
          {animatedOpponentChange !== 0 && (
            <span
              className={`ml-2 text-sm font-medium ${
                animatedOpponentChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatChange(animatedOpponentChange)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmitStage({
  currentUser,
  opponent,
  winner,
  isAnimating,
}: {
  currentUser: Player;
  opponent: Player;
  winner: Player | null | undefined;
  isAnimating: boolean;
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

  const getButtonText = () => {
    if (registerGameMut.isPending) return "Submitting...";

    if (winner === currentUser) return "Declare Victory";
    if (winner === opponent) return "Admit Defeat";
    if (winner === null) return "Submit Draw";

    return "Submit Game";
  };

  return (
    <div className="flex justify-center">
      {winner !== undefined && !isAnimating && (
        <div className={`${STAGE_FADE_IN} text-center`}>
          <Button
            onClick={handleSubmitGame}
            disabled={registerGameMut.isPending}
            className="h-16 text-2xl font-bold px-8"
          >
            {getButtonText()}
          </Button>
          {winner === null && (
            <p className="text-sm text-muted-foreground mt-2">Boring :/</p>
          )}
          {winner === currentUser && (
            <p className="text-sm text-muted-foreground mt-2">
              Don't forget to gloat!
            </p>
          )}
          {winner === opponent && (
            <p className="text-sm text-muted-foreground mt-2">Loser!</p>
          )}
        </div>
      )}
    </div>
  );
}
