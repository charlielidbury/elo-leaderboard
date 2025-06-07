import { supabase, type Player, type Game } from "@/lib/database";

// Players query
export const playersQuery = {
  queryKey: ["players"],
  queryFn: async (): Promise<Player[]> => {
    const { data: players, error } = await supabase
      .from("players")
      .select("*")
      .order("rating_check", { ascending: false });

    if (error) throw error;
    return players || [];
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
    const { data, error } = await supabase
      .from("games")
      .insert({
        a: player1.id,
        b: player2.id,
        winner: winner?.id,
        a_rating: player1.rating_check,
        b_rating: player2.rating_check,
      })
      .select();

    if (error) throw error;
    return data;
  },
};
