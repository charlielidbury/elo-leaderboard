import { redirect } from "next/navigation";
import { headers } from "next/headers";

const HOST_TO_LEADERBOARD: Record<string, string> = {
  "omnibus-chess.vercel.app": "omnibus",
};

const DEFAULT_LEADERBOARD = "test-league";

export default async function Home() {
  const host = (await headers()).get("host") ?? "";
  const leaderboard = HOST_TO_LEADERBOARD[host] ?? DEFAULT_LEADERBOARD;
  redirect(`/leaderboard/${leaderboard}`);
}
