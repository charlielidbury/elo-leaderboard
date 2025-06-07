import { supabase, type Player, type Game } from "@/lib/database";
import { calculateNewRatingsForGame, calculatePlayerRatings } from "@/lib/elo";

// Players query
export const playersQuery = {
  queryKey: ["players"],
  queryFn: async (): Promise<Player[]> => {
    // Fetch all players
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("*");

    if (playersError) throw playersError;

    // Fetch all games
    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: true });

    if (gamesError) throw gamesError;

    // Calculate current ratings using ELO system
    // Type cast to satisfy the function signature - calculatePlayerRatings only uses basic fields
    const playersWithRatings = calculatePlayerRatings(
      (players || []) as Player[],
      (games || []) as Game[]
    );

    // Sort by current rating (descending)
    return playersWithRatings.sort((a, b) => b.rating - a.rating);
  },
};

// Games query
export const gamesQuery = {
  queryKey: ["games"],
  queryFn: async (): Promise<Game[]> => {
    const { data: games, error } = await supabase
      .from("games")
      .select(
        `
        *,
        player1:players!games_player1_id_fkey(*),
        player2:players!games_player2_id_fkey(*),
        winner_player:players!games_winner_id_fkey(*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data to match the expected format
    const gamesWithPlayers =
      games?.map((game) => ({
        ...game,
        player1: Array.isArray(game.player1) ? game.player1[0] : game.player1,
        player2: Array.isArray(game.player2) ? game.player2[0] : game.player2,
        winner: Array.isArray(game.winner_player)
          ? game.winner_player[0]
          : game.winner_player,
      })) || [];

    return gamesWithPlayers as Game[];
  },
};

// Register game mutation
export const registerGameMutation = {
  mutationFn: async ({
    player1,
    player2,
    winner,
  }: {
    player1: Player;
    player2: Player;
    winner: Player | null;
  }) => {
    // Calculate new ratings based on game outcome
    const { player1NewRating, player2NewRating } = calculateNewRatingsForGame(
      player1.rating_check,
      player2.rating_check,
      winner?.id || null,
      player1.id,
      player2.id
    );

    const { data, error } = await supabase
      .from("games")
      .insert({
        a: player1.id,
        b: player2.id,
        winner: winner?.id,
        a_rating_check: player1NewRating,
        b_rating_check: player2NewRating,
      })
      .select();

    if (error) throw error;
    return data;
  },
};
