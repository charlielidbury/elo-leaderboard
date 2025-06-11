import {
  supabase,
  type Player,
  type Game,
  UnpopulatedGame,
  UncheckedPlayer,
} from "@/lib/database";
import { calculatePlayerRatings, pointsTransfer } from "@/lib/elo";

async function getPlayersGames(): Promise<[Player[], Game[]]> {
  // Fetch all players
  const { data: uncheckedPlayers, error: playersError } = await supabase
    .from("players")
    .select("*");

  if (playersError) throw playersError;

  // Fetch all games
  const { data: unpopulatedGames, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: true });

  if (gamesError) throw gamesError;

  //
  const playersMap: Map<string, UncheckedPlayer> = new Map(
    uncheckedPlayers?.map((player) => [player.id, player])
  );
  const populateGame = (game: UnpopulatedGame): Game => ({
    ...game,
    winner: game.winner_id ? (playersMap.get(game.winner_id)! as Player) : null,
    charlie: playersMap.get(game.c_id)! as Player, // type assertions are required because we havent checked the players yet
    rushil: playersMap.get(game.r_id)! as Player,
  });
  const games = unpopulatedGames.map(populateGame);

  // Calculate current ratings using ELO system
  // Type cast to satisfy the function signature - calculatePlayerRatings only uses basic fields
  const players = calculatePlayerRatings(
    uncheckedPlayers,
    games.map(populateGame)
  );

  // Sort by current rating (descending)
  players.sort((a, b) => b.rating - a.rating);

  games.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return [players, games];
}

// Players query
export const playersQuery = {
  queryKey: ["players"],
  queryFn: async (): Promise<Player[]> => {
    const [players, games] = await getPlayersGames();
    return players;
  },
};

// Games query
export const gamesQuery = {
  queryKey: ["games"],
  queryFn: async (): Promise<Game[]> => {
    const [players, games] = await getPlayersGames();
    return games;
  },
};

// Register game mutation
export const registerGameMutation = {
  mutationFn: async ({
    charlie,
    rushil,
    winner,
  }: {
    charlie: Player;
    rushil: Player;
    winner: Player | null;
  }) => {
    // Calculate new ratings based on game outcome
    const charlieToRushil = pointsTransfer(charlie, rushil, winner);

    const { data, error } = await supabase
      .from("games")
      .insert({
        c_id: charlie.id,
        r_id: rushil.id,
        winner_id: winner?.id,
        c_rating_check: Math.round(charlie.rating - charlieToRushil),
        r_rating_check: Math.round(rushil.rating + charlieToRushil),
      })
      .select();

    if (error) throw error;
    return data;
  },
};
