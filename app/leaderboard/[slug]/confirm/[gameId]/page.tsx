"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/database";
import type { UncheckedPlayer } from "@/lib/database";
import { confirmGameMutation, rejectGameMutation } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LoginButton } from "@/components/login-button";
import { toast } from "@/hooks/use-toast";
import { Check, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ConfirmGamePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const gameId = params.gameId as string;
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [actionDone, setActionDone] = useState<"confirmed" | "rejected" | null>(
    null
  );

  // Fetch the game
  const gameQuery = useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch players for display names
  const playersQuery = useQuery({
    queryKey: ["all-players"],
    queryFn: async (): Promise<UncheckedPlayer[]> => {
      const { data, error } = await supabase.from("players").select("*");
      if (error) throw error;
      return data;
    },
  });

  const confirmMut = useMutation({
    ...confirmGameMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      toast({
        title: "Game confirmed!",
        description: "The game has been recorded and ratings updated.",
      });
      setActionDone("confirmed");
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
      toast({
        title: "Game rejected",
        description: "The pending game has been rejected.",
      });
      setActionDone("rejected");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <h1 className="text-2xl font-bold">Confirm Game</h1>
          <p className="text-muted-foreground">
            You need to be logged in to confirm this game.
          </p>
          <LoginButton full />
        </div>
      </div>
    );
  }

  if (actionDone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <h1 className="text-2xl font-bold">
            {actionDone === "confirmed" ? "Game Confirmed!" : "Game Rejected"}
          </h1>
          <p className="text-muted-foreground">
            {actionDone === "confirmed"
              ? "The game has been recorded and ratings have been updated."
              : "The pending game has been rejected."}
          </p>
          <Link href={`/leaderboard/${slug}`}>
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (gameQuery.isLoading || playersQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading game...
      </div>
    );
  }

  if (gameQuery.isError || !gameQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <h1 className="text-2xl font-bold">Game not found</h1>
          <p className="text-muted-foreground">
            This game may have already been confirmed, rejected, or does not
            exist.
          </p>
          <Link href={`/leaderboard/${slug}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const game = gameQuery.data;
  const playersMap = new Map(
    playersQuery.data?.map((p) => [p.id, p]) ?? []
  );
  const charlie = playersMap.get(game.c_id);
  const rushil = playersMap.get(game.r_id);
  const isOpponent = user.id !== game.submitted_by && (user.id === game.c_id || user.id === game.r_id);
  const isSubmitter = user.id === game.submitted_by;
  const submitterName = playersMap.get(game.submitted_by)?.name ?? "Unknown";

  const scoreDisplay =
    game.winner_id === game.c_id
      ? "1 - 0"
      : game.winner_id === game.r_id
      ? "0 - 1"
      : "½ - ½";

  if (game.status === "confirmed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <h1 className="text-2xl font-bold">Already Confirmed</h1>
          <p className="text-muted-foreground">
            This game has already been confirmed.
          </p>
          <Link href={`/leaderboard/${slug}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (game.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <h1 className="text-2xl font-bold">Game Rejected</h1>
          <p className="text-muted-foreground">
            This game has been rejected and will not count.
          </p>
          <Link href={`/leaderboard/${slug}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isOpponent && !isSubmitter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <h1 className="text-2xl font-bold">Not Your Game</h1>
          <p className="text-muted-foreground">
            You are not a participant in this game.
          </p>
          <Link href={`/leaderboard/${slug}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm mx-auto px-4">
        <h1 className="text-2xl font-bold">Confirm Game</h1>
        <p className="text-sm text-muted-foreground">
          Submitted by {submitterName}
        </p>

        {/* Game display */}
        <div className="rounded-lg border border-dashed border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-left">
              <div className="text-xl font-semibold">
                {charlie?.name ?? "Unknown"}
              </div>
            </div>
            <div className="flex-shrink-0 mx-6 text-center">
              <div className="text-xl font-bold">{scoreDisplay}</div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-xl font-semibold">
                {rushil?.name ?? "Unknown"}
              </div>
            </div>
          </div>
        </div>

        {isOpponent && !showRejectConfirm && (
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => confirmMut.mutate(game.id)}
              disabled={confirmMut.isPending || rejectMut.isPending}
              className="gap-1.5"
            >
              <Check className="h-4 w-4" />
              Confirm
            </Button>
            <Button
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
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reject this game?
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="destructive"
                onClick={() => rejectMut.mutate(game.id)}
                disabled={rejectMut.isPending}
              >
                Yes, reject
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isSubmitter && (
          <p className="text-sm text-muted-foreground italic">
            Waiting for your opponent to confirm...
          </p>
        )}

        <Link href={`/leaderboard/${slug}`}>
          <Button variant="ghost" size="sm" className="gap-2 mt-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
