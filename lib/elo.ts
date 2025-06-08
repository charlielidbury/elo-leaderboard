import { type Player, type Game, UncheckedPlayer } from "@/lib/database";

// ELO Rating System Implementation
const INITIAL_RATING = 1000;
const K_FACTOR = 32;

function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calculateNewRating(
  currentRating: number,
  expectedScore: number,
  actualScore: number
): number {
  return currentRating + K_FACTOR * (actualScore - expectedScore);
}

function calculateRatingChanges(
  charlieRating: number,
  rushilRating: number,
  winnerId: string,
  charlieId: string,
  rushilId: string
) {
  const expectedScoreCharlie = calculateExpectedScore(
    charlieRating,
    rushilRating
  );
  const expectedScoreRushil = calculateExpectedScore(
    rushilRating,
    charlieRating
  );

  const actualScoreCharlie = winnerId === charlieId ? 1 : 0;
  const actualScoreRushil = winnerId === rushilId ? 1 : 0;

  const newRatingCharlie = calculateNewRating(
    charlieRating,
    expectedScoreCharlie,
    actualScoreCharlie
  );
  const newRatingRushil = calculateNewRating(
    rushilRating,
    expectedScoreRushil,
    actualScoreRushil
  );

  return {
    charlie: {
      before: charlieRating,
      after: newRatingCharlie,
      change: newRatingCharlie - charlieRating,
    },
    rushil: {
      before: rushilRating,
      after: newRatingRushil,
      change: newRatingRushil - rushilRating,
    },
  };
}

export function calculateNewRatingsForGame(
  charlie: Player,
  rushil: Player,
  winner: Player | null
) {
  if (winner === null) {
    // Handle draws - each player gets 0.5 actual score
    const expectedScoreCharlie = calculateExpectedScore(
      charlie.rating,
      rushil.rating
    );
    const expectedScoreRushil = calculateExpectedScore(
      rushil.rating,
      charlie.rating
    );

    const newRatingCharlie =
      charlie.rating + K_FACTOR * (0.5 - expectedScoreCharlie);
    const newRatingRushil =
      rushil.rating + K_FACTOR * (0.5 - expectedScoreRushil);

    return {
      charlieNewRating: newRatingCharlie,
      rushilNewRating: newRatingRushil,
    };
  } else {
    // Handle wins/losses
    const ratingChanges = calculateRatingChanges(
      charlie.rating,
      rushil.rating,
      winner.id,
      charlie.id,
      rushil.id
    );

    return {
      charlieNewRating: ratingChanges.charlie.after,
      rushilNewRating: ratingChanges.rushil.after,
    };
  }
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
    const charlie = game.charlie;
    const rushil = game.rushil;
    const winner = game.winner;

    const charlieRating = charlie.rating;
    const rushilRating = rushil.rating;

    // Handle draws (winner is null)
    if (winner === null) {
      // For draws, each player gets 0.5 actual score
      const expectedScoreCharlie = calculateExpectedScore(
        charlieRating,
        rushilRating
      );
      const expectedScoreRushil = calculateExpectedScore(
        rushilRating,
        charlieRating
      );

      charlie.rating = charlieRating + K_FACTOR * (0.5 - expectedScoreCharlie);
      rushil.rating = rushilRating + K_FACTOR * (0.5 - expectedScoreRushil);
    } else {
      // Normal win/loss case
      const ratingChanges = calculateRatingChanges(
        charlieRating,
        rushilRating,
        winner?.id ?? "",
        charlie.id,
        rushil.id
      );

      charlie.rating = ratingChanges.charlie.after;
      rushil.rating = ratingChanges.rushil.after;
    }
  }

  // Round ratings to nearest integer
  for (const player of players) {
    player.rating = Math.round(player.rating);
  }

  return players;
}
