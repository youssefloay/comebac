import { getMatches, getMatchResult, updateTeamStatistics, getAllTeamStatistics } from "./db"
import { calculateTeamStats } from "./match-generation"
import type { TeamStatistics } from "./types"

/**
 * Recalculates and updates all team statistics in the database
 * Should be called whenever a match result is added or updated
 */
export async function recalculateAllStatistics(): Promise<void> {
  try {
    const [matches, allResults] = await Promise.all([
      getMatches(),
      Promise.all(
        (await getMatches()).map(async (m) => {
          const result = await getMatchResult(m.id)
          return result
        }),
      ),
    ])

    const completedResults = allResults.filter((r) => r !== null) as any[]

    // Calculate stats
    const stats = calculateTeamStats(
      matches,
      completedResults.map((r) => ({
        matchId: r.matchId,
        homeScore: r.homeTeamScore,
        awayScore: r.awayTeamScore,
      })),
    )

    // Update each team's statistics in the database
    for (const [teamId, teamStats] of Object.entries(stats)) {
      await updateTeamStatistics(teamId, {
        matchesPlayed: teamStats.matchesPlayed,
        wins: teamStats.wins,
        draws: teamStats.draws,
        losses: teamStats.losses,
        goalsFor: teamStats.goalsFor,
        goalsAgainst: teamStats.goalsAgainst,
        points: teamStats.points,
      })
    }

    console.log("[v0] Statistics recalculated and updated successfully")
  } catch (error) {
    console.error("[v0] Error recalculating statistics:", error)
    throw error
  }
}

/**
 * Gets the current ranking with all statistics
 */
export async function getCurrentRanking(): Promise<
  Array<
    TeamStatistics & {
      rank: number
      goalDifference: number
    }
  >
> {
  try {
    const allStats = await getAllTeamStatistics()

    return allStats
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
        goalDifference: stat.goalsFor - stat.goalsAgainst,
      }))
  } catch (error) {
    console.error("[v0] Error getting ranking:", error)
    throw error
  }
}

/**
 * Gets detailed statistics for a specific team
 */
export async function getTeamDetailedStats(teamId: string) {
  try {
    const [matches, allResults] = await Promise.all([
      getMatches(),
      Promise.all(
        (await getMatches()).map(async (m) => {
          const result = await getMatchResult(m.id)
          return result
        }),
      ),
    ])

    const teamMatches = matches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
    const completedResults = allResults.filter((r) => r !== null) as any[]

    const teamResults = completedResults.filter((r) => {
      const match = matches.find((m) => m.id === r.matchId)
      return match && (match.homeTeamId === teamId || match.awayTeamId === teamId)
    })

    // Calculate home and away stats
    const homeStats = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
    const awayStats = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }

    teamResults.forEach((result) => {
      const match = matches.find((m) => m.id === result.matchId)
      if (!match) return

      if (match.homeTeamId === teamId) {
        homeStats.played++
        homeStats.goalsFor += result.homeTeamScore
        homeStats.goalsAgainst += result.awayTeamScore

        if (result.homeTeamScore > result.awayTeamScore) homeStats.wins++
        else if (result.homeTeamScore === result.awayTeamScore) homeStats.draws++
        else homeStats.losses++
      } else {
        awayStats.played++
        awayStats.goalsFor += result.awayTeamScore
        awayStats.goalsAgainst += result.homeTeamScore

        if (result.awayTeamScore > result.homeTeamScore) awayStats.wins++
        else if (result.awayTeamScore === result.homeTeamScore) awayStats.draws++
        else awayStats.losses++
      }
    })

    return {
      totalMatches: teamMatches.length,
      completedMatches: teamResults.length,
      homeStats,
      awayStats,
      recentMatches: teamResults.slice(-5),
    }
  } catch (error) {
    console.error("[v0] Error getting team stats:", error)
    throw error
  }
}

/**
 * Gets top scorers (requires match results with goal scorers)
 */
export async function getTopScorers() {
  try {
    const matches = await getMatches()
    const allResults = await Promise.all(matches.map((m) => getMatchResult(m.id)))

    const scorerStats: Record<string, { name: string; goals: number }> = {}

    allResults.forEach((result) => {
      if (!result) return

      result.homeTeamGoalScorers.forEach((scorer) => {
        if (!scorerStats[scorer]) {
          scorerStats[scorer] = { name: scorer, goals: 0 }
        }
        scorerStats[scorer].goals++
      })

      result.awayTeamGoalScorers.forEach((scorer) => {
        if (!scorerStats[scorer]) {
          scorerStats[scorer] = { name: scorer, goals: 0 }
        }
        scorerStats[scorer].goals++
      })
    })

    return Object.values(scorerStats)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10)
  } catch (error) {
    console.error("[v0] Error getting top scorers:", error)
    throw error
  }
}
