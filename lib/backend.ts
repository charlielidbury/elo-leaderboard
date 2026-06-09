import {
  supabase,
  type Player,
  type Game,
  type Leaderboard,
  UnpopulatedGame,
  UncheckedPlayer,
} from "@/lib/database";
import { calculatePlayerRatings } from "@/lib/elo";

async function getPlayersGames(
  leaderboardId: string
): Promise<[Player[], Game[]]> {
  // Fetch all players (global)
  const { data: uncheckedPlayers, error: playersError } = await supabase
    .from("players")
    .select("*");

  if (playersError) throw playersError;

  // Fetch confirmed games scoped to this leaderboard
  const { data: unpopulatedGames, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .eq("leaderboard_id", leaderboardId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: true });

  if (gamesError) throw gamesError;

  const playersMap: Map<string, UncheckedPlayer> = new Map(
    uncheckedPlayers?.map((player) => [player.id, player])
  );
  const populateGame = (game: UnpopulatedGame): Game => ({
    ...game,
    winner: game.winner_id ? (playersMap.get(game.winner_id)! as Player) : null,
    charlie: playersMap.get(game.c_id)! as Player,
    rushil: playersMap.get(game.r_id)! as Player,
  });
  const games = unpopulatedGames.map(populateGame);

  // Calculate current ratings using ELO system
  const players = calculatePlayerRatings(
    uncheckedPlayers,
    games.map(populateGame)
  );

  // Filter to only players who have played in this leaderboard
  const playerIdsInLeaderboard = new Set<string>();
  for (const game of unpopulatedGames) {
    playerIdsInLeaderboard.add(game.c_id);
    playerIdsInLeaderboard.add(game.r_id);
  }
  const activePlayers = players.filter((p) => playerIdsInLeaderboard.has(p.id));

  // Sort by current rating (descending)
  activePlayers.sort((a, b) => b.rating - a.rating);

  games.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return [activePlayers, games];
}

// Players query factory (leaderboard-scoped)
export function playersQuery(leaderboardId: string) {
  return {
    queryKey: ["players", leaderboardId],
    queryFn: async (): Promise<Player[]> => {
      const [players] = await getPlayersGames(leaderboardId);
      return players;
    },
  };
}

// Games query factory (leaderboard-scoped)
export function gamesQuery(leaderboardId: string) {
  return {
    queryKey: ["games", leaderboardId],
    queryFn: async (): Promise<Game[]> => {
      const [, games] = await getPlayersGames(leaderboardId);
      return games;
    },
  };
}

// All players query (global, for opponent selection)
export const allPlayersQuery = {
  queryKey: ["all-players"],
  queryFn: async (): Promise<UncheckedPlayer[]> => {
    const { data, error } = await supabase.from("players").select("*");
    if (error) throw error;
    return data;
  },
};

// Register game mutation -- inserts as pending, requiring opponent confirmation
export const registerGameMutation = {
  mutationFn: async ({
    c_id,
    r_id,
    winner_id,
    leaderboard_id,
    submitted_by,
  }: {
    c_id: string;
    r_id: string;
    winner_id: string | null;
    leaderboard_id: string;
    submitted_by: string;
  }) => {
    // Verify auth session exists before inserting (gives a clearer error than RLS violation)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be logged in to submit a game.");
    if (user.id !== submitted_by)
      throw new Error("Auth session mismatch. Please refresh and try again.");

    const { data, error } = await supabase
      .from("games")
      .insert({
        c_id,
        r_id,
        winner_id,
        leaderboard_id,
        submitted_by,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Pending games query -- fetches pending games for this leaderboard (RLS filters to user's games)
export function pendingGamesQuery(leaderboardId: string) {
  return {
    queryKey: ["pending-games", leaderboardId],
    queryFn: async (): Promise<Game[]> => {
      // Fetch all players for population
      const { data: uncheckedPlayers, error: playersError } = await supabase
        .from("players")
        .select("*");

      if (playersError) throw playersError;

      const { data: unpopulatedGames, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .eq("leaderboard_id", leaderboardId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (gamesError) throw gamesError;

      const playersMap: Map<string, UncheckedPlayer> = new Map(
        uncheckedPlayers?.map((player) => [player.id, player])
      );

      return unpopulatedGames.map((game) => ({
        ...game,
        winner: game.winner_id
          ? (playersMap.get(game.winner_id)! as Player)
          : null,
        charlie: playersMap.get(game.c_id)! as Player,
        rushil: playersMap.get(game.r_id)! as Player,
      }));
    },
  };
}

// Confirm game mutation -- opponent confirms a pending game
export const confirmGameMutation = {
  mutationFn: async (gameId: string) => {
    const { data, error } = await supabase
      .from("games")
      .update({
        status: "confirmed",
        finalised_at: new Date().toISOString(),
      })
      .eq("id", gameId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Reject game mutation -- either player rejects a pending game (kept as rejected, not deleted)
export const rejectGameMutation = {
  mutationFn: async (gameId: string) => {
    const { data, error } = await supabase
      .from("games")
      .update({
        status: "rejected",
        finalised_at: new Date().toISOString(),
      })
      .eq("id", gameId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Leaderboard queries
export function leaderboardBySlugQuery(slug: string) {
  return {
    queryKey: ["leaderboard", slug],
    queryFn: async (): Promise<Leaderboard | null> => {
      const { data, error } = await supabase
        .from("leaderboards")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // not found
        throw error;
      }
      return data;
    },
  };
}

export const allLeaderboardsQuery = {
  queryKey: ["leaderboards"],
  queryFn: async (): Promise<Leaderboard[]> => {
    const { data, error } = await supabase
      .from("leaderboards")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },
};

export const createLeaderboardMutation = {
  mutationFn: async ({
    name,
    slug,
    created_by,
  }: {
    name: string;
    slug: string;
    created_by: string;
  }) => {
    const { data, error } = await supabase
      .from("leaderboards")
      .insert({ name, slug, created_by })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
