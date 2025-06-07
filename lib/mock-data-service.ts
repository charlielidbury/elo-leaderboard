// Mock data service that simulates Supabase backend
// All fake methods are kept together for easy mocking

interface Player {
  id: string
  name: string
  rating: number
  wins: number
  losses: number
  games_played: number
  created_at: string
}

interface GameResult {
  id: string
  player1_id: string
  player2_id: string
  winner_id: string
  player1_rating_before: number
  player1_rating_after: number
  player2_rating_before: number
  player2_rating_after: number
  created_at: string
  player1?: Player
  player2?: Player
  winner?: Player
}

interface MockResponse<T> {
  data: T | null
  error: Error | null
}

// Simulate network delay
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// Generate UUID-like IDs
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)

class MockDataService {
  private readonly PLAYERS_KEY = "elo_leaderboard_players"
  private readonly GAMES_KEY = "elo_leaderboard_games"

  // Initialize with some sample data if localStorage is empty
  private initializeSampleData() {
    if (!this.getPlayersFromStorage().length) {
      const samplePlayers: Player[] = [
        {
          id: generateId(),
          name: "Alice",
          rating: 1250,
          wins: 3,
          losses: 1,
          games_played: 4,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: generateId(),
          name: "Bob",
          rating: 1180,
          wins: 1,
          losses: 2,
          games_played: 3,
          created_at: new Date(Date.now() - 43200000).toISOString(),
        },
        {
          id: generateId(),
          name: "Charlie",
          rating: 1220,
          wins: 2,
          losses: 1,
          games_played: 3,
          created_at: new Date(Date.now() - 21600000).toISOString(),
        },
      ]
      localStorage.setItem(this.PLAYERS_KEY, JSON.stringify(samplePlayers))
    }
  }

  private getPlayersFromStorage(): Player[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.PLAYERS_KEY)
    return stored ? JSON.parse(stored) : []
  }

  private getGamesFromStorage(): GameResult[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.GAMES_KEY)
    return stored ? JSON.parse(stored) : []
  }

  private savePlayersToStorage(players: Player[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.PLAYERS_KEY, JSON.stringify(players))
    }
  }

  private saveGamesToStorage(games: GameResult[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.GAMES_KEY, JSON.stringify(games))
    }
  }

  // Mock Supabase-like API methods
  async getPlayers(): Promise<MockResponse<Player[]>> {
    await delay()

    try {
      this.initializeSampleData()
      const players = this.getPlayersFromStorage()
      const sortedPlayers = players.sort((a, b) => b.rating - a.rating)

      return {
        data: sortedPlayers,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  async addPlayer(name: string, initialRating = 1200): Promise<MockResponse<Player>> {
    await delay()

    try {
      const players = this.getPlayersFromStorage()

      // Check for duplicate names
      if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Player with this name already exists")
      }

      const newPlayer: Player = {
        id: generateId(),
        name: name.trim(),
        rating: initialRating,
        wins: 0,
        losses: 0,
        games_played: 0,
        created_at: new Date().toISOString(),
      }

      players.push(newPlayer)
      this.savePlayersToStorage(players)

      return {
        data: newPlayer,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  async getGamesWithPlayers(): Promise<MockResponse<GameResult[]>> {
    await delay()

    try {
      const games = this.getGamesFromStorage()
      const players = this.getPlayersFromStorage()

      // Join games with player data (simulate SQL joins)
      const gamesWithPlayers = games
        .map((game) => ({
          ...game,
          player1: players.find((p) => p.id === game.player1_id),
          player2: players.find((p) => p.id === game.player2_id),
          winner: players.find((p) => p.id === game.winner_id),
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return {
        data: gamesWithPlayers,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  async recordGame(
    player1_id: string,
    player2_id: string,
    winner_id: string,
    ratingChanges: {
      player1: { before: number; after: number; change: number }
      player2: { before: number; after: number; change: number }
    },
  ): Promise<MockResponse<GameResult>> {
    await delay(500) // Longer delay to simulate complex transaction

    try {
      const players = this.getPlayersFromStorage()
      const games = this.getGamesFromStorage()

      // Find players
      const player1 = players.find((p) => p.id === player1_id)
      const player2 = players.find((p) => p.id === player2_id)

      if (!player1 || !player2) {
        throw new Error("One or both players not found")
      }

      if (player1_id === player2_id) {
        throw new Error("Players must be different")
      }

      if (winner_id !== player1_id && winner_id !== player2_id) {
        throw new Error("Winner must be one of the players")
      }

      // Create game record
      const newGame: GameResult = {
        id: generateId(),
        player1_id,
        player2_id,
        winner_id,
        player1_rating_before: ratingChanges.player1.before,
        player1_rating_after: ratingChanges.player1.after,
        player2_rating_before: ratingChanges.player2.before,
        player2_rating_after: ratingChanges.player2.after,
        created_at: new Date().toISOString(),
      }

      // Update player stats
      const updatedPlayers = players.map((player) => {
        if (player.id === player1_id) {
          return {
            ...player,
            rating: ratingChanges.player1.after,
            wins: player.wins + (winner_id === player1_id ? 1 : 0),
            losses: player.losses + (winner_id === player1_id ? 0 : 1),
            games_played: player.games_played + 1,
          }
        }
        if (player.id === player2_id) {
          return {
            ...player,
            rating: ratingChanges.player2.after,
            wins: player.wins + (winner_id === player2_id ? 1 : 0),
            losses: player.losses + (winner_id === player2_id ? 0 : 1),
            games_played: player.games_played + 1,
          }
        }
        return player
      })

      // Save updates
      games.push(newGame)
      this.savePlayersToStorage(updatedPlayers)
      this.saveGamesToStorage(games)

      return {
        data: newGame,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  // Utility methods for testing/development
  async clearAllData(): Promise<void> {
    await delay(100)
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.PLAYERS_KEY)
      localStorage.removeItem(this.GAMES_KEY)
    }
  }

  async resetToSampleData(): Promise<void> {
    await delay(100)
    await this.clearAllData()
    this.initializeSampleData()
  }

  // Simulate real-time subscriptions (for future use)
  subscribeToPlayers(callback: (players: Player[]) => void) {
    // In a real implementation, this would set up WebSocket connections
    // For now, we'll just return a cleanup function
    return () => {
      // Cleanup subscription
    }
  }

  subscribeToGames(callback: (games: GameResult[]) => void) {
    // In a real implementation, this would set up WebSocket connections
    return () => {
      // Cleanup subscription
    }
  }
}

// Export singleton instance
export const mockDataService = new MockDataService()

// Export types for use in components
export type { Player, GameResult, MockResponse }
