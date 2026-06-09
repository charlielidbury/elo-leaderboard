import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { playersQuery, allPlayersQuery, registerGameMutation } from "@/lib/backend";
import { toast } from "@/hooks/use-toast";
import { type Player, type UncheckedPlayer, type UnpopulatedGame } from "@/lib/database";
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
import { LoginButton } from "@/components/login-button";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { QRCodeSVG } from "qrcode.react";

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

  // Show login prompt when not authenticated
  if (player === null) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground text-lg text-center">
          Must be logged in to add games
        </p>
        <LoginButton full />
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
  const { leaderboardId } = useLeaderboard();
  const players = useQuery(playersQuery(leaderboardId));
  const allPlayers = useQuery(allPlayersQuery);
  const [opponent, setOpponent] = useState<Player | null>(null);

  // Combine: show all global players, using leaderboard-scoped ratings where available
  const playerList = (() => {
    if (!allPlayers.data) return players.data || [];
    const ratedMap = new Map<string, Player>();
    if (players.data) {
      for (const p of players.data) {
        ratedMap.set(p.id, p);
      }
    }
    // Return all players, using rated version if available, else adding default rating
    return allPlayers.data.map(
      (p) => ratedMap.get(p.id) || { ...p, rating: 1000 }
    );
  })();

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-center">
        <div>
          <Select
            value={opponent?.id || ""}
            onValueChange={(playerId) => {
              const selectedPlayer = playerList.find(
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
              {playerList.map((player) => (
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
  if (winner === undefined) {
    return null;
  }

  return (
    <div className="space-y-12">
      <RatingDisplay
        currentUser={currentUser}
        opponent={opponent}
        winner={winner}
      />
      <SubmitStage
        currentUser={currentUser}
        opponent={opponent}
        winner={winner}
      />
    </div>
  );
}

function RatingDisplay({
  currentUser,
  opponent,
  winner,
}: {
  currentUser: Player;
  opponent: Player;
  winner: Player | null | undefined;
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
    setAnimatedCurrentRating(Math.round(currentUser.rating));
    setAnimatedOpponentRating(Math.round(opponent.rating));
    setAnimatedCurrentChange(0);
    setAnimatedOpponentChange(0);

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
          // Animation complete
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
}: {
  currentUser: Player;
  opponent: Player;
  winner: Player | null | undefined;
}) {
  const { leaderboard, leaderboardId } = useLeaderboard();
  const queryClient = useQueryClient();
  const [submittedGame, setSubmittedGame] = useState<UnpopulatedGame | null>(null);

  const registerGameMut = useMutation({
    ...registerGameMutation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["games", leaderboardId] });
      queryClient.invalidateQueries({ queryKey: ["players", leaderboardId] });
      queryClient.invalidateQueries({ queryKey: ["pending-games", leaderboardId] });
      toast({
        title: "Game submitted!",
        description: `Waiting for ${opponent.name} to confirm.`,
      });
      setSubmittedGame(data);
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

    registerGameMut.mutate({
      c_id: currentUser.id,
      r_id: opponent.id,
      winner_id: winner?.id ?? null,
      leaderboard_id: leaderboardId,
      submitted_by: currentUser.id,
    });
  };

  const getButtonText = () => {
    if (registerGameMut.isPending) return "Submitting...";

    if (winner === currentUser) return "Declare Victory";
    if (winner === opponent) return "Admit Defeat";
    if (winner === null) return "Submit Draw";

    return "Submit Game";
  };

  // Show QR code after successful submission
  if (submittedGame) {
    const confirmUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/leaderboard/${leaderboard.slug}/confirm/${submittedGame.id}`;

    return (
      <div className={`${STAGE_FADE_IN} flex flex-col items-center space-y-4`}>
        <h3 className="text-lg font-semibold">Waiting for {opponent.name} to confirm</h3>
        <p className="text-sm text-muted-foreground text-center">
          Ask them to scan this QR code, or they can confirm from the History tab.
        </p>
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG value={confirmUrl} size={200} />
        </div>
        <p className="text-xs text-muted-foreground break-all max-w-[300px] text-center">
          {confirmUrl}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {winner !== undefined && (
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
