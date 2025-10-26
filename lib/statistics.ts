import { getMatches, getAllMatchResults, updateTeamStatistics, getAllTeamStatistics, getTeams } from "./db"
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
      getAllMatchResults(),
    ])

    const completedResults = allResults

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
      getAllMatchResults(),
    ])

    const teamMatches = matches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
    const completedResults = allResults

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
 * Gets top scorers with detailed statistics
 */
export async function getTopScorers() {
  try {
    const allResults = await getAllMatchResults()

    const scorerStats: Record<string, { 
      name: string; 
      goals: number; 
      assists: number;
      matches: number;
      goalsPerMatch: number;
    }> = {}

    allResults.forEach((result) => {
      // Track matches for each player
      const matchPlayers = new Set<string>()

      result.homeTeamGoalScorers.forEach((scorer) => {
        const playerName = scorer.playerName
        if (!scorerStats[playerName]) {
          scorerStats[playerName] = { name: playerName, goals: 0, assists: 0, matches: 0, goalsPerMatch: 0 }
        }
        scorerStats[playerName].goals++
        matchPlayers.add(playerName)
      })

      result.awayTeamGoalScorers.forEach((scorer) => {
        const playerName = scorer.playerName
        if (!scorerStats[playerName]) {
          scorerStats[playerName] = { name: playerName, goals: 0, assists: 0, matches: 0, goalsPerMatch: 0 }
        }
        scorerStats[playerName].goals++
        matchPlayers.add(playerName)
      })

      // Count assists
      result.homeTeamGoalScorers.forEach((scorer) => {
        if (scorer.assists) {
          if (!scorerStats[scorer.assists]) {
            scorerStats[scorer.assists] = { name: scorer.assists, goals: 0, assists: 0, matches: 0, goalsPerMatch: 0 }
          }
          scorerStats[scorer.assists].assists++
          matchPlayers.add(scorer.assists)
        }
      })

      result.awayTeamGoalScorers.forEach((scorer) => {
        if (scorer.assists) {
          if (!scorerStats[scorer.assists]) {
            scorerStats[scorer.assists] = { name: scorer.assists, goals: 0, assists: 0, matches: 0, goalsPerMatch: 0 }
          }
          scorerStats[scorer.assists].assists++
          matchPlayers.add(scorer.assists)
        }
      })

      // Update match count for players who participated
      matchPlayers.forEach(playerName => {
        scorerStats[playerName].matches++
      })
    })

    // Calculate goals per match
    Object.values(scorerStats).forEach(player => {
      player.goalsPerMatch = player.matches > 0 ? Number((player.goals / player.matches).toFixed(2)) : 0
    })

    return Object.values(scorerStats)
      .filter(player => player.goals > 0 || player.assists > 0)
      .sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals
        return b.assists - a.assists
      })
      .slice(0, 20)
  } catch (error) {
    console.error("[v0] Error getting top scorers:", error)
    throw error
  }
}

/**
 * Gets detailed match history with all goals and assists
 */
export async function getDetailedMatchHistory() {
  try {
    const [matches, results] = await Promise.all([
      getMatches(),
      getAllMatchResults()
    ])

    const detailedMatches = matches
      .filter(match => match.status === "completed")
      .map(match => {
        const result = results.find(r => r.matchId === match.id)
        return {
          ...match,
          result: result || null
        }
      })
      .filter(match => match.result)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return detailedMatches
  } catch (error) {
    console.error("[v0] Error getting detailed match history:", error)
    throw error
  }
}

/**
 * Gets comprehensive team statistics including match details
 */
export async function getComprehensiveTeamStats(teamId: string) {
  try {
    const [matches, results] = await Promise.all([
      getMatches(),
      getAllMatchResults()
    ])

    const teamMatches = matches.filter(m => m.homeTeamId === teamId || m.awayTeamId === teamId)
    const completedMatches = teamMatches.filter(m => m.status === "completed")
    
    const teamResults = results.filter(r => {
      const match = matches.find(m => m.id === r.matchId)
      return match && (match.homeTeamId === teamId || match.awayTeamId === teamId)
    })

    // Detailed match results with goals and assists
    const detailedResults = teamResults.map(result => {
      const match = matches.find(m => m.id === result.matchId)
      const isHome = match?.homeTeamId === teamId
      
      return {
        match,
        result,
        isHome,
        teamScore: isHome ? result.homeTeamScore : result.awayTeamScore,
        opponentScore: isHome ? result.awayTeamScore : result.homeTeamScore,
        teamGoals: isHome ? result.homeTeamGoalScorers : result.awayTeamGoalScorers,
        opponentGoals: isHome ? result.awayTeamGoalScorers : result.homeTeamGoalScorers,
        outcome: isHome 
          ? (result.homeTeamScore > result.awayTeamScore ? 'W' : result.homeTeamScore === result.awayTeamScore ? 'D' : 'L')
          : (result.awayTeamScore > result.homeTeamScore ? 'W' : result.awayTeamScore === result.homeTeamScore ? 'D' : 'L')
      }
    }).sort((a, b) => new Date(b.match?.date || 0).getTime() - new Date(a.match?.date || 0).getTime())

    // Calculate streaks
    let currentStreak = 0
    let streakType = ''
    for (let i = 0; i < detailedResults.length; i++) {
      const outcome = detailedResults[i].outcome
      if (i === 0) {
        currentStreak = 1
        streakType = outcome
      } else if (detailedResults[i-1].outcome === outcome) {
        currentStreak++
      } else {
        break
      }
    }

    // Player statistics for this team
    const playerStats: Record<string, {
      name: string
      goals: number
      assists: number
      matches: number
    }> = {}

    detailedResults.forEach(({ teamGoals }) => {
      const matchPlayers = new Set<string>()
      
      teamGoals.forEach(goal => {
        if (!playerStats[goal.playerName]) {
          playerStats[goal.playerName] = { name: goal.playerName, goals: 0, assists: 0, matches: 0 }
        }
        playerStats[goal.playerName].goals++
        matchPlayers.add(goal.playerName)

        if (goal.assists) {
          if (!playerStats[goal.assists]) {
            playerStats[goal.assists] = { name: goal.assists, goals: 0, assists: 0, matches: 0 }
          }
          playerStats[goal.assists].assists++
          matchPlayers.add(goal.assists)
        }
      })

      matchPlayers.forEach(playerName => {
        playerStats[playerName].matches++
      })
    })

    const topPlayers = Object.values(playerStats)
      .filter(p => p.goals > 0 || p.assists > 0)
      .sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals
        return b.assists - a.assists
      })

    // Form guide (last 5 matches)
    const formGuide = detailedResults.slice(0, 5).map(r => r.outcome)

    return {
      totalMatches: teamMatches.length,
      completedMatches: completedMatches.length,
      scheduledMatches: teamMatches.length - completedMatches.length,
      detailedResults,
      topPlayers,
      currentStreak: `${currentStreak}${streakType}`,
      formGuide,
      // Additional stats
      biggestWin: detailedResults
        .filter(r => r.outcome === 'W')
        .sort((a, b) => (b.teamScore - b.opponentScore) - (a.teamScore - a.opponentScore))[0] || null,
      biggestLoss: detailedResults
        .filter(r => r.outcome === 'L')
        .sort((a, b) => (b.opponentScore - b.teamScore) - (a.opponentScore - a.teamScore))[0] || null,
      cleanSheets: detailedResults.filter(r => r.opponentScore === 0).length,
      failedToScore: detailedResults.filter(r => r.teamScore === 0).length
    }
  } catch (error) {
    console.error("[v0] Error getting comprehensive team stats:", error)
    throw error
  }
}

/**
 * Gets head-to-head statistics between two teams
 */
export async function getHeadToHeadStats(team1Id: string, team2Id: string) {
  try {
    const [matches, results] = await Promise.all([
      getMatches(),
      getAllMatchResults()
    ])

    const h2hMatches = matches.filter(m => 
      (m.homeTeamId === team1Id && m.awayTeamId === team2Id) ||
      (m.homeTeamId === team2Id && m.awayTeamId === team1Id)
    )

    const h2hResults = results.filter(r => {
      const match = matches.find(m => m.id === r.matchId)
      return match && h2hMatches.some(h2h => h2h.id === match.id)
    })

    const detailedH2H = h2hResults.map(result => {
      const match = matches.find(m => m.id === result.matchId)
      const team1IsHome = match?.homeTeamId === team1Id
      
      return {
        match,
        result,
        team1Score: team1IsHome ? result.homeTeamScore : result.awayTeamScore,
        team2Score: team1IsHome ? result.awayTeamScore : result.homeTeamScore,
        team1Goals: team1IsHome ? result.homeTeamGoalScorers : result.awayTeamGoalScorers,
        team2Goals: team1IsHome ? result.awayTeamGoalScorers : result.homeTeamGoalScorers,
        winner: team1IsHome 
          ? (result.homeTeamScore > result.awayTeamScore ? team1Id : result.homeTeamScore === result.awayTeamScore ? 'draw' : team2Id)
          : (result.awayTeamScore > result.homeTeamScore ? team1Id : result.awayTeamScore === result.homeTeamScore ? 'draw' : team2Id)
      }
    }).sort((a, b) => new Date(b.match?.date || 0).getTime() - new Date(a.match?.date || 0).getTime())

    const team1Wins = detailedH2H.filter(h => h.winner === team1Id).length
    const team2Wins = detailedH2H.filter(h => h.winner === team2Id).length
    const draws = detailedH2H.filter(h => h.winner === 'draw').length

    return {
      totalMatches: detailedH2H.length,
      team1Wins,
      team2Wins,
      draws,
      detailedMatches: detailedH2H,
      lastMeeting: detailedH2H[0] || null
    }
  } catch (error) {
    console.error("[v0] Error getting head-to-head stats:", error)
    throw error
  }
}
