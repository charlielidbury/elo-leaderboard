// ELO Rating System Implementation
export const INITIAL_RATING = 1200
export const K_FACTOR = 32

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

export function calculateNewRating(currentRating: number, expectedScore: number, actualScore: number): number {
  return currentRating + K_FACTOR * (actualScore - expectedScore)
}

export function calculateRatingChanges(
  player1Rating: number,
  player2Rating: number,
  winnerId: string,
  player1Id: string,
  player2Id: string,
) {
  const expectedScore1 = calculateExpectedScore(player1Rating, player2Rating)
  const expectedScore2 = calculateExpectedScore(player2Rating, player1Rating)

  const actualScore1 = winnerId === player1Id ? 1 : 0
  const actualScore2 = winnerId === player2Id ? 1 : 0

  const newRating1 = calculateNewRating(player1Rating, expectedScore1, actualScore1)
  const newRating2 = calculateNewRating(player2Rating, expectedScore2, actualScore2)

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
  }
}
