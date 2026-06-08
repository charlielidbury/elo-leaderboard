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

  // Fetch games scoped to this leaderboard
  const { data: unpopulatedGames, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .eq("leaderboard_id", leaderboardId)
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

// Register game mutation (trigger handles rating_check server-side)
export const registerGameMutation = {
  mutationFn: async ({
    c_id,
    r_id,
    winner_id,
    leaderboard_id,
  }: {
    c_id: string;
    r_id: string;
    winner_id: string | null;
    leaderboard_id: string;
  }) => {
    const { data, error } = await supabase
      .from("games")
      .insert({
        c_id,
        r_id,
        winner_id,
        leaderboard_id,
      })
      .select();

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
