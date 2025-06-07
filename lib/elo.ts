import { type Player, type Game, UncheckedPlayer } from "@/lib/database";

// ELO Rating System Implementation
const INITIAL_RATING = 1200;
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
  player1Rating: number,
  player2Rating: number,
  winnerId: string,
  player1Id: string,
  player2Id: string
) {
  const expectedScore1 = calculateExpectedScore(player1Rating, player2Rating);
  const expectedScore2 = calculateExpectedScore(player2Rating, player1Rating);

  const actualScore1 = winnerId === player1Id ? 1 : 0;
  const actualScore2 = winnerId === player2Id ? 1 : 0;

  const newRating1 = calculateNewRating(
    player1Rating,
    expectedScore1,
    actualScore1
  );
  const newRating2 = calculateNewRating(
    player2Rating,
    expectedScore2,
    actualScore2
  );

  return {
    player1: {
      before: player1Rating,
      after: newRating1,
      change: newRating1 - player1Rating,
    },
    player2: {
      before: player2Rating,
      after: newRating2,
      change: newRating2 - player2Rating,
    },
  };
}

export function calculateNewRatingsForGame(
  player1Rating: number,
  player2Rating: number,
  winnerId: string | null,
  player1Id: string,
  player2Id: string
) {
  if (winnerId === null) {
    // Handle draws - each player gets 0.5 actual score
    const expectedScore1 = calculateExpectedScore(player1Rating, player2Rating);
    const expectedScore2 = calculateExpectedScore(player2Rating, player1Rating);

    const newRating1 = player1Rating + K_FACTOR * (0.5 - expectedScore1);
    const newRating2 = player2Rating + K_FACTOR * (0.5 - expectedScore2);

    return {
      player1NewRating: newRating1,
      player2NewRating: newRating2,
    };
  } else {
    // Handle wins/losses
    const ratingChanges = calculateRatingChanges(
      player1Rating,
      player2Rating,
      winnerId,
      player1Id,
      player2Id
    );

    return {
      player1NewRating: ratingChanges.player1.after,
      player2NewRating: ratingChanges.player2.after,
    };
  }
}

export function calculatePlayerRatings(
  players: UncheckedPlayer[],
  games: Game[]
): Player[] {
  // Initialize all players with starting rating
  const playerRatings: Record<string, number> = {};
  for (const player of players) {
    playerRatings[player.id] = INITIAL_RATING;
  }

  // Sort games by creation date to process them chronologically
  const sortedGames = [...games].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Process each game to update ratings
  for (const game of sortedGames) {
    const player1Id = game.a;
    const player2Id = game.b;
    const winnerId = game.winner;

    const player1Rating = playerRatings[player1Id];
    const player2Rating = playerRatings[player2Id];

    // Handle draws (winner is null)
    if (winnerId === null) {
      // For draws, each player gets 0.5 actual score
      const expectedScore1 = calculateExpectedScore(
        player1Rating,
        player2Rating
      );
      const expectedScore2 = calculateExpectedScore(
        player2Rating,
        player1Rating
      );

      playerRatings[player1Id] =
        player1Rating + K_FACTOR * (0.5 - expectedScore1);
      playerRatings[player2Id] =
        player2Rating + K_FACTOR * (0.5 - expectedScore2);
    } else {
      // Normal win/loss case
      const ratingChanges = calculateRatingChanges(
        player1Rating,
        player2Rating,
        winnerId,
        player1Id,
        player2Id
      );

      playerRatings[player1Id] = ratingChanges.player1.after;
      playerRatings[player2Id] = ratingChanges.player2.after;
    }
  }

  // Return players with their computed ratings
  const result: Player[] = [];
  for (const player of players) {
    // This is the moment an unchecked player becomes a checked player
    result.push({ ...player, rating: playerRatings[player.id] });
  }
  return result;
}
