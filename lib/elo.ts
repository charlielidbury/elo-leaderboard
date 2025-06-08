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
  playerARating: number,
  playerBRating: number,
  winnerId: string,
  playerAId: string,
  playerBId: string
) {
  const expectedScoreA = calculateExpectedScore(playerARating, playerBRating);
  const expectedScoreB = calculateExpectedScore(playerBRating, playerARating);

  const actualScoreA = winnerId === playerAId ? 1 : 0;
  const actualScoreB = winnerId === playerBId ? 1 : 0;

  const newRatingA = calculateNewRating(
    playerARating,
    expectedScoreA,
    actualScoreA
  );
  const newRatingB = calculateNewRating(
    playerBRating,
    expectedScoreB,
    actualScoreB
  );

  return {
    playerA: {
      before: playerARating,
      after: newRatingA,
      change: newRatingA - playerARating,
    },
    playerB: {
      before: playerBRating,
      after: newRatingB,
      change: newRatingB - playerBRating,
    },
  };
}

export function calculateNewRatingsForGame(
  playerA: Player,
  playerB: Player,
  winner: Player | null
) {
  if (winner === null) {
    // Handle draws - each player gets 0.5 actual score
    const expectedScoreA = calculateExpectedScore(
      playerA.rating,
      playerB.rating
    );
    const expectedScoreB = calculateExpectedScore(
      playerB.rating,
      playerA.rating
    );

    const newRatingA = playerA.rating + K_FACTOR * (0.5 - expectedScoreA);
    const newRatingB = playerB.rating + K_FACTOR * (0.5 - expectedScoreB);

    return {
      playerANewRating: newRatingA,
      playerBNewRating: newRatingB,
    };
  } else {
    // Handle wins/losses
    const ratingChanges = calculateRatingChanges(
      playerA.rating,
      playerB.rating,
      winner.id,
      playerA.id,
      playerB.id
    );

    return {
      playerANewRating: ratingChanges.playerA.after,
      playerBNewRating: ratingChanges.playerB.after,
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
    const playerA = game.a;
    const playerB = game.b;
    const winner = game.winner;

    const playerARating = playerA.rating;
    const playerBRating = playerB.rating;

    // Handle draws (winner is null)
    if (winner === null) {
      // For draws, each player gets 0.5 actual score
      const expectedScoreA = calculateExpectedScore(
        playerARating,
        playerBRating
      );
      const expectedScoreB = calculateExpectedScore(
        playerBRating,
        playerARating
      );

      playerA.rating = playerARating + K_FACTOR * (0.5 - expectedScoreA);
      playerB.rating = playerBRating + K_FACTOR * (0.5 - expectedScoreB);
    } else {
      // Normal win/loss case
      const ratingChanges = calculateRatingChanges(
        playerARating,
        playerBRating,
        winner?.id ?? "",
        playerA.id,
        playerB.id
      );

      playerA.rating = ratingChanges.playerA.after;
      playerB.rating = ratingChanges.playerB.after;
    }
  }

  return players;
}
