import { type Player, type Game, UncheckedPlayer } from "@/lib/database";

// ELO Rating System Implementation
export const INITIAL_RATING = 1000;
export const K_FACTOR = 32;

// Returns how many points the {from} player should transfer to the {to} player
// Given that {winner} won.
// Note: might be negative if {from} is the winner or if drew against weaker player.
export function pointsTransfer(
  from: Player,
  to: Player,
  winner: Player | null
): number {
  // Calculate expected score for 'to' player using standard ELO formula
  const toExpected = 1 / (1 + Math.pow(10, (from.rating - to.rating) / 400));

  // Determine actual score for 'to' player based on game outcome
  let result = 0.5;
  if (winner === to) result = 1;
  else if (winner === from) result = 0;

  // Apply ELO formula: K × (Actual Score - Expected Score)
  // This represents how many points 'to' should gain (positive) or lose (negative)
  return K_FACTOR * (result - toExpected);
}

// In-place updates players with their ratings
export function calculatePlayerRatings(
  uncheckedPlayers: UncheckedPlayer[],
  games: Game[]
): Player[] {
  // Add an initial rating to each player
  for (const player of uncheckedPlayers) {
    (player as any).rating = INITIAL_RATING;
  }
  const players = uncheckedPlayers as Player[]; // tell typescript that we have populated the rating field

  // Sort games by creation date to process them chronologically
  const sortedGames = [...games].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Process each game to update ratings
  for (const game of sortedGames) {
    const { charlie, winner, rushil } = game;

    const charlieToRushil = pointsTransfer(charlie, rushil, winner);

    charlie.rating -= charlieToRushil;
    rushil.rating += charlieToRushil;
  }

  // Round ratings to nearest integer
  for (const player of players) {
    player.rating = Math.round(player.rating);
  }

  return players;
}
