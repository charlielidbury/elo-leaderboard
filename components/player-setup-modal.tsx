"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePlayer } from "@/hooks/use-player";
import { DisplayNameSetup } from "./display-name-setup";

export function PlayerSetupModal() {
  const { user, loading: authLoading } = useAuth();
  const { player, loading: playerLoading, createPlayer } = usePlayer();

  // Show the popup if:
  // 1. Auth is not loading
  // 2. Player data is not loading
  // 3. User is authenticated
  // 4. But no player exists
  const shouldShowSetup = !authLoading && !playerLoading && !!user && !player;

  return (
    <DisplayNameSetup isOpen={shouldShowSetup} onComplete={createPlayer} />
  );
}
