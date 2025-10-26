import { createMatch } from "./db"
import type { Match } from "./types"

/**
 * Generates a round-robin tournament schedule (home and away matches)
 * @param teamIds Array of team IDs to generate matches for
 * @param startDate Date to start scheduling matches
 * @param daysPerRound Number of days between rounds
 * @returns Array of generated match IDs
 */
export async function generateRoundRobinMatches(
  teamIds: string[],
  startDate: Date,
  daysPerRound = 7,
): Promise<string[]> {
  if (teamIds.length < 2) {
    throw new Error("Au moins 2 équipes sont nécessaires pour générer des matchs")
  }

  const generatedMatchIds: string[] = []
  const matchDate = new Date(startDate)

  // Generate home and away matches for each pair of teams
  for (let round = 1; round <= 2; round++) {
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        const homeTeamId = round === 1 ? teamIds[i] : teamIds[j]
        const awayTeamId = round === 1 ? teamIds[j] : teamIds[i]

        const matchId = await createMatch({
          homeTeamId,
          awayTeamId,
          date: new Date(matchDate),
          round: round === 1 ? i + j + 1 : teamIds.length + i + j + 1,
          status: "scheduled",
        })

        generatedMatchIds.push(matchId)

        // Increment date for next match
        matchDate.setDate(matchDate.getDate() + 1)
      }
    }

    // Add days between rounds
    matchDate.setDate(matchDate.getDate() + daysPerRound - 1)
  }

  return generatedMatchIds
}

/**
 * Calculates team statistics based on match results
 * @param matchResults Array of match results
 * @returns Object with statistics for each team
 */
export function calculateTeamStats(
  matches: Match[],
  results: Array<{ matchId: string; homeScore: number; awayScore: number }>,
) {
  const stats: Record<
    string,
    {
      teamId: string
      matchesPlayed: number
      wins: number
      draws: number
      losses: number
      goalsFor: number
      goalsAgainst: number
      points: number
    }
  > = {}

  // Initialize stats for all teams
  const allTeamIds = new Set<string>()
  matches.forEach((match) => {
    allTeamIds.add(match.homeTeamId)
    allTeamIds.add(match.awayTeamId)
  })

  allTeamIds.forEach((teamId) => {
    stats[teamId] = {
      teamId,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    }
  })

  // Calculate stats from results
  results.forEach((result) => {
    const match = matches.find((m) => m.id === result.matchId)
    if (!match) return

    const homeTeamId = match.homeTeamId
    const awayTeamId = match.awayTeamId
    const homeScore = result.homeScore
    const awayScore = result.awayScore

    // Update home team stats
    stats[homeTeamId].matchesPlayed++
    stats[homeTeamId].goalsFor += homeScore
    stats[homeTeamId].goalsAgainst += awayScore

    // Update away team stats
    stats[awayTeamId].matchesPlayed++
    stats[awayTeamId].goalsFor += awayScore
    stats[awayTeamId].goalsAgainst += homeScore

    // Determine winner and update points
    if (homeScore > awayScore) {
      stats[homeTeamId].wins++
      stats[homeTeamId].points += 3
      stats[awayTeamId].losses++
    } else if (awayScore > homeScore) {
      stats[awayTeamId].wins++
      stats[awayTeamId].points += 3
      stats[homeTeamId].losses++
    } else {
      stats[homeTeamId].draws++
      stats[homeTeamId].points += 1
      stats[awayTeamId].draws++
      stats[awayTeamId].points += 1
    }
  })

  return stats
}

/**
 * Generates ranking based on team statistics
 * @param stats Team statistics object
 * @returns Sorted array of teams by ranking
 */
export function generateRanking(
  stats: Record<
    string,
    {
      teamId: string
      matchesPlayed: number
      wins: number
      draws: number
      losses: number
      goalsFor: number
      goalsAgainst: number
      points: number
    }
  >,
) {
  return Object.values(stats)
    .sort((a, b) => {
      // Sort by points (descending)
      if (b.points !== a.points) return b.points - a.points
      // Then by goal difference (descending)
      const aDiff = a.goalsFor - a.goalsAgainst
      const bDiff = b.goalsFor - b.goalsAgainst
      if (bDiff !== aDiff) return bDiff - aDiff
      // Then by goals for (descending)
      return b.goalsFor - a.goalsFor
    })
    .map((stat, index) => ({
      ...stat,
      rank: index + 1,
    }))
}
