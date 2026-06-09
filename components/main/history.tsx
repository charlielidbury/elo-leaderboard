import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  gamesQuery,
  pendingGamesQuery,
  confirmGameMutation,
  rejectGameMutation,
} from "@/lib/backend";
import { useState, useEffect } from "react";
import { type Game } from "@/lib/database";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { usePlayer } from "@/hooks/use-player";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Clock, Check, X } from "lucide-react";

// Animation constants
const ANIMATION_DELAY_MS = 35;
const ANIMATION_DURATION_MS = 150;

function GameDisplay({ game, index }: { game: Game; index: number }) {
  const [isClicked, setIsClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * ANIMATION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      key={game.id}
      className={`rounded-lg border cursor-pointer bg-muted transition-all ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDuration: `${ANIMATION_DURATION_MS}ms` }}
      onClick={() => setIsClicked(!isClicked)}
    >
      {/* Main row content */}
      <div className="flex items-center justify-between p-4">
        {/* Left Player */}
        <div className="flex-1 text-left">
          <div className="text-xl font-semibold">{game.charlie.name}</div>
        </div>

        {/* Score in the middle */}
        <div className="flex-shrink-0 mx-8 text-center">
          <div className="text-xl font-bold">
            {game.winner === game.charlie
              ? "1 - 0"
              : game.winner === null
              ? "½ - ½"
              : "0 - 1"}
          </div>
        </div>

        {/* Right Player */}
        <div className="flex-1 text-right">
          <div className="text-xl font-semibold">{game.rushil.name}</div>
        </div>
      </div>

      {/* Expanded content */}
      {isClicked && (
        <div className="px-4 pb-4 pt-0 text-center">
          <div className="text-xs text-muted-foreground/60">
            {game.created_at && new Date(game.created_at).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}

function PendingGameDisplay({ game }: { game: Game }) {
  const { player } = usePlayer();
  const { leaderboardId } = useLeaderboard();
  const queryClient = useQueryClient();
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const isOpponent =
    player && player.id !== game.submitted_by;
  const isSubmitter = player && player.id === game.submitted_by;

  const opponentName =
    game.submitted_by === game.charlie.id
      ? game.rushil.name
      : game.charlie.name;
  const submitterName =
    game.submitted_by === game.charlie.id
      ? game.charlie.name
      : game.rushil.name;

  const confirmMut = useMutation({
    ...confirmGameMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games", leaderboardId] });
      queryClient.invalidateQueries({ queryKey: ["players", leaderboardId] });
      queryClient.invalidateQueries({
        queryKey: ["pending-games", leaderboardId],
      });
      toast({
        title: "Game confirmed!",
        description: "The game has been recorded and ratings updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to confirm game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMut = useMutation({
    ...rejectGameMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-games", leaderboardId],
      });
      toast({
        title: isSubmitter ? "Game cancelled" : "Game rejected",
        description: isSubmitter
          ? "The pending game has been cancelled."
          : "The pending game has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000
    );
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="rounded-lg border border-dashed border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
      {/* Main row content */}
      <div className="flex items-center justify-between p-4">
        {/* Left Player */}
        <div className="flex-1 text-left">
          <div className="text-xl font-semibold">{game.charlie.name}</div>
        </div>

        {/* Score in the middle */}
        <div className="flex-shrink-0 mx-8 text-center">
          <div className="text-xl font-bold">
            {game.winner === game.charlie
              ? "1 - 0"
              : game.winner === null
              ? "½ - ½"
              : "0 - 1"}
          </div>
        </div>

        {/* Right Player */}
        <div className="flex-1 text-right">
          <div className="text-xl font-semibold">{game.rushil.name}</div>
        </div>
      </div>

      {/* Pending info and actions */}
      <div className="px-4 pb-4 pt-0 space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>
            Submitted by {submitterName} {timeAgo(game.created_at)}
          </span>
        </div>

        {isOpponent && !showRejectConfirm && (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              onClick={() => confirmMut.mutate(game.id)}
              disabled={confirmMut.isPending || rejectMut.isPending}
              className="gap-1.5"
            >
              <Check className="h-4 w-4" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRejectConfirm(true)}
              disabled={confirmMut.isPending || rejectMut.isPending}
              className="gap-1.5"
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        )}

        {isOpponent && showRejectConfirm && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reject this game?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => rejectMut.mutate(game.id)}
                disabled={rejectMut.isPending}
              >
                Yes, reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isSubmitter && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground italic">
              Waiting for {opponentName} to confirm...
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => rejectMut.mutate(game.id)}
              disabled={rejectMut.isPending}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Games() {
  const { leaderboardId } = useLeaderboard();
  const { player } = usePlayer();
  const games = useQuery(gamesQuery(leaderboardId));
  const pendingGames = useQuery({
    ...pendingGamesQuery(leaderboardId),
    enabled: !!player,
  });

  if (games.isLoading) {
    return (
      <p className="text-center text-muted-foreground py-8">Loading games...</p>
    );
  }

  if (games.isError) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Error loading games. Please try again.
      </p>
    );
  }

  const hasPendingGames =
    pendingGames.data && pendingGames.data.length > 0;

  return (
    <div className="space-y-6">
      {/* Pending games section */}
      {hasPendingGames && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pending Confirmation
          </h3>
          <div className="space-y-2">
            {pendingGames.data!.map((game) => (
              <PendingGameDisplay key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Confirmed games */}
      {hasPendingGames && games.data && games.data.length > 0 && (
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Game History
        </h3>
      )}
      <div className="space-y-2">
        {games.data?.length === 0 && !hasPendingGames ? (
          <p className="text-center text-muted-foreground py-8">
            No games recorded yet.
          </p>
        ) : (
          games.data
            ?.slice(0, 10)
            .map((game, index) => (
              <GameDisplay key={game.id} game={game} index={index} />
            ))
        )}
      </div>
    </div>
  );
}
