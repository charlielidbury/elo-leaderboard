import {
  supabase,
  type Player,
  type GameResult,
  type PlayerInsert,
  type GameInsert,
} from "./supabase";

interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

class SupabaseDataService {
  async getPlayers(): Promise<SupabaseResponse<Player[]>> {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("rating", { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async addPlayer(
    name: string,
    initialRating = 1200
  ): Promise<SupabaseResponse<Player>> {
    try {
      // Check for duplicate names
      const { data: existingPlayers, error: checkError } = await supabase
        .from("players")
        .select("name")
        .ilike("name", name.trim());

      if (checkError) throw checkError;

      if (existingPlayers && existingPlayers.length > 0) {
        throw new Error("Player with this name already exists");
      }

      const newPlayer: PlayerInsert = {
        name: name.trim(),
        rating: initialRating,
        wins: 0,
        losses: 0,
        games_played: 0,
      };

      const { data, error } = await supabase
        .from("players")
        .insert(newPlayer)
        .select()
        .single();

      if (error) throw error;

      return {
        data: data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async getGamesWithPlayers(): Promise<SupabaseResponse<GameResult[]>> {
    try {
      const { data, error } = await supabase
        .from("games")
        .select(
          `
          *,
          player1:players!games_player1_id_fkey(*),
          player2:players!games_player2_id_fkey(*),
          winner:players!games_winner_id_fkey(*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected format
      const gamesWithPlayers =
        data?.map((game) => ({
          ...game,
          player1: Array.isArray(game.player1) ? game.player1[0] : game.player1,
          player2: Array.isArray(game.player2) ? game.player2[0] : game.player2,
          winner: Array.isArray(game.winner) ? game.winner[0] : game.winner,
        })) || [];

      return {
        data: gamesWithPlayers as GameResult[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async recordGame(
    player1_id: string,
    player2_id: string,
    winner_id: string,
    ratingChanges: {
      player1: { before: number; after: number; change: number };
      player2: { before: number; after: number; change: number };
    }
  ): Promise<SupabaseResponse<GameResult>> {
    try {
      // Validate inputs
      if (player1_id === player2_id) {
        throw new Error("Players must be different");
      }

      if (winner_id !== player1_id && winner_id !== player2_id) {
        throw new Error("Winner must be one of the players");
      }

      // Start a transaction by using RPC or handle it manually
      // For now, we'll do it manually with error handling

      // First, get the current players to validate they exist
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("*")
        .in("id", [player1_id, player2_id]);

      if (playersError) throw playersError;

      if (!players || players.length !== 2) {
        throw new Error("One or both players not found");
      }

      const player1 = players.find((p) => p.id === player1_id)!;
      const player2 = players.find((p) => p.id === player2_id)!;

      // Create game record
      const newGame: GameInsert = {
        player1_id,
        player2_id,
        winner_id,
        player1_rating_before: ratingChanges.player1.before,
        player1_rating_after: ratingChanges.player1.after,
        player2_rating_before: ratingChanges.player2.before,
        player2_rating_after: ratingChanges.player2.after,
      };

      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert(newGame)
        .select()
        .single();

      if (gameError) throw gameError;

      // Update player stats
      const player1Update = {
        rating: ratingChanges.player1.after,
        wins: player1.wins! + (winner_id === player1_id ? 1 : 0),
        losses: player1.losses! + (winner_id === player1_id ? 0 : 1),
        games_played: player1.games_played! + 1,
      };

      const player2Update = {
        rating: ratingChanges.player2.after,
        wins: player2.wins! + (winner_id === player2_id ? 1 : 0),
        losses: player2.losses! + (winner_id === player2_id ? 0 : 1),
        games_played: player2.games_played! + 1,
      };

      // Update both players
      const { error: player1Error } = await supabase
        .from("players")
        .update(player1Update)
        .eq("id", player1_id);

      if (player1Error) throw player1Error;

      const { error: player2Error } = await supabase
        .from("players")
        .update(player2Update)
        .eq("id", player2_id);

      if (player2Error) throw player2Error;

      return {
        data: gameData,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async clearAllData(): Promise<void> {
    // Delete all games first (due to foreign key constraints)
    const { error: gamesError } = await supabase
      .from("games")
      .delete()
      .neq("id", ""); // Delete all records

    if (gamesError) throw gamesError;

    // Then delete all players
    const { error: playersError } = await supabase
      .from("players")
      .delete()
      .neq("id", ""); // Delete all records

    if (playersError) throw playersError;
  }

  async resetToSampleData(): Promise<void> {
    // Clear all data first
    await this.clearAllData();

    // Add sample players
    const samplePlayers: PlayerInsert[] = [
      {
        name: "Alice",
        rating: 1250,
        wins: 3,
        losses: 1,
        games_played: 4,
      },
      {
        name: "Bob",
        rating: 1180,
        wins: 1,
        losses: 2,
        games_played: 3,
      },
      {
        name: "Charlie",
        rating: 1220,
        wins: 2,
        losses: 1,
        games_played: 3,
      },
    ];

    const { error } = await supabase.from("players").insert(samplePlayers);

    if (error) throw error;
  }

  // Real-time subscriptions
  subscribeToPlayers(callback: (players: Player[]) => void) {
    const subscription = supabase
      .channel("players")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => {
          // Refetch and call callback when data changes
          this.getPlayers().then(({ data }) => {
            if (data) callback(data);
          });
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }

  subscribeToGames(callback: (games: GameResult[]) => void) {
    const subscription = supabase
      .channel("games")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        () => {
          // Refetch and call callback when data changes
          this.getGamesWithPlayers().then(({ data }) => {
            if (data) callback(data);
          });
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }
}

// Export singleton instance
export const supabaseDataService = new SupabaseDataService();

// Export types for use in components
export type { Player, GameResult, SupabaseResponse };
