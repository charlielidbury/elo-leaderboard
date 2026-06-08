"use client";

import { createContext, useContext } from "react";
import { type Leaderboard } from "@/lib/database";

interface LeaderboardContextValue {
  leaderboard: Leaderboard;
  leaderboardId: string;
}

export const LeaderboardContext = createContext<LeaderboardContextValue | null>(
  null
);

export function useLeaderboard(): LeaderboardContextValue {
  const ctx = useContext(LeaderboardContext);
  if (!ctx) {
    throw new Error("useLeaderboard must be used within a LeaderboardProvider");
  }
  return ctx;
}
