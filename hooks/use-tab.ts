"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";

export type Tab = "history" | "leaderboard" | "addgame";

export function useTab() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get current tab from URL params, default to "leaderboard"
  const currentTab = (searchParams.get("tab") as Tab) || "leaderboard";

  // Function to set the tab by updating the URL
  const setTab = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  return { currentTab, setTab };
}
