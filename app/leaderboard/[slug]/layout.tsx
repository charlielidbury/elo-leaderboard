import type { Metadata } from "next";
import { headers } from "next/headers";

const HOST_TITLES: Record<string, string> = {
  "omnibus-chess.vercel.app": "Omnibus Chess",
};

const DEFAULT_TITLE = "ELO Leaderboard";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") ?? "";
  return {
    title: HOST_TITLES[host] ?? DEFAULT_TITLE,
  };
}

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
