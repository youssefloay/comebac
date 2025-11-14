import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { MatchStats, FantasyTeam, FantasyPlayer, Position } from '../types/fantasy'

/**
 * Calcule les points Fantasy d'un joueur basé sur ses performances dans un match
 * Selon la grille de points du Requirement 6
 */
export async function calculatePlayerPoints(
  playerId: string,
  matchId: string,
  matchStats: MatchStats
): Promise<number> {
  const position = matchStats.position
  let points = 0

  // Minutes jouées
  if (matchStats.minutesPlayed >= 60) {
    points += 2
  } else if (matchStats.minutesPlayed > 0) {
    points += 1
  }

  // Buts marqués (selon position)
  if (matchStats.goals > 0) {
    const goalPoints: Record<Position, number> = {
      'Gardien': 10,
      'Défenseur': 6,
      'Milieu': 5,
      'Attaquant': 4
    }
    points += matchStats.goals * goalPoints[position]
  }

  // Passes décisives
  points += matchStats.assists * 3

  // Clean sheet (Gardien et Défenseur uniquement)
  if ((position === 'Gardien' || position === 'Défenseur') && matchStats.cleanSheet) {
    points += 4
  }

  // Milieu avec clean sheet
  if (position === 'Milieu' && matchStats.cleanSheet) {
    points += 1
  }

  // Résultat de l'équipe
  if (matchStats.teamWon) {
    points += 2
  } else if (matchStats.teamDraw) {
    points += 1
  }

  // Cartons
  points -= matchStats.yellowCards * 1
  points -= matchStats.redCards * 3

  // Buts encaissés (Gardien uniquement)
  if (position === 'Gardien' && matchStats.goalsConceded >= 2) {
    points -= 1
  }

  // Penalty arrêté (Gardien uniquement)
  if (matchStats.penaltySaved) {
    points += 5
  }

  // Penalty manqué
  if (matchStats.penaltyMissed) {
    points -= 2
  }

  return points
}

/**
 * Met à jour toutes les équipes Fantasy après un match
 * Calcule les points de chaque joueur et met à jour les équipes concernées
 */
export async function updateFantasyTeamsAfterMatch(
  matchId: string,
  playerStatsMap: Map<string, MatchStats>
): Promise<void> {
  try {
    console.log(`[Fantasy] Updating teams after match ${matchId}`)

    // Récupérer toutes les équipes Fantasy
    const teamsRef = collection(db, 'fantasy_teams')
    const teamsSnapshot = await getDocs(teamsRef)

    if (teamsSnapshot.empty) {
      console.log('[Fantasy] No fantasy teams found')
      return
    }

    const updatePromises: Promise<void>[] = []

    for (const teamDoc of teamsSnapshot.docs) {
      const team = { id: teamDoc.id, ...teamDoc.data() } as FantasyTeam
      let gameweekPointsEarned = 0
      let hasPlayersInMatch = false

      // Mettre à jour les points de chaque joueur de l'équipe
      const updatedPlayers = team.players.map((player: FantasyPlayer) => {
        const matchStats = playerStatsMap.get(player.playerId)

        if (matchStats) {
          hasPlayersInMatch = true
          // Calculer les points du joueur
          const basePoints = calculatePlayerPointsSync(matchStats)
          
          // Doubler les points si c'est le capitaine
          const finalPoints = player.isCaptain ? basePoints * 2 : basePoints

          gameweekPointsEarned += finalPoints

          return {
            ...player,
            gameweekPoints: player.gameweekPoints + finalPoints,
            points: player.points + finalPoints
          }
        }

        return player
      })

      // Mettre à jour l'équipe si elle a des joueurs dans ce match
      if (hasPlayersInMatch) {
        const teamRef = doc(db, 'fantasy_teams', team.id)
        const updatePromise = updateDoc(teamRef, {
          players: updatedPlayers,
          gameweekPoints: team.gameweekPoints + gameweekPointsEarned,
          totalPoints: team.totalPoints + gameweekPointsEarned,
          updatedAt: Timestamp.now()
        })

        updatePromises.push(updatePromise)

        console.log(
          `[Fantasy] Team ${team.teamName} earned ${gameweekPointsEarned} points`
        )
      }
    }

    // Attendre que toutes les mises à jour soient terminées
    await Promise.all(updatePromises)

    console.log(`[Fantasy] Updated ${updatePromises.length} teams`)
  } catch (error) {
    console.error('[Fantasy] Error updating teams after match:', error)
    throw error
  }
}

/**
 * Version synchrone du calcul de points (pour utilisation interne)
 */
export function calculatePlayerPointsSync(matchStats: MatchStats): number {
  const position = matchStats.position
  let points = 0

  // Minutes jouées
  if (matchStats.minutesPlayed >= 60) {
    points += 2
  } else if (matchStats.minutesPlayed > 0) {
    points += 1
  }

  // Buts marqués
  if (matchStats.goals > 0) {
    const goalPoints: Record<Position, number> = {
      'Gardien': 10,
      'Défenseur': 6,
      'Milieu': 5,
      'Attaquant': 4
    }
    points += matchStats.goals * goalPoints[position]
  }

  // Passes décisives
  points += matchStats.assists * 3

  // Clean sheet
  if ((position === 'Gardien' || position === 'Défenseur') && matchStats.cleanSheet) {
    points += 4
  }

  if (position === 'Milieu' && matchStats.cleanSheet) {
    points += 1
  }

  // Résultat de l'équipe
  if (matchStats.teamWon) {
    points += 2
  } else if (matchStats.teamDraw) {
    points += 1
  }

  // Cartons
  points -= matchStats.yellowCards * 1
  points -= matchStats.redCards * 3

  // Buts encaissés (Gardien)
  if (position === 'Gardien' && matchStats.goalsConceded >= 2) {
    points -= 1
  }

  // Penalty
  if (matchStats.penaltySaved) {
    points += 5
  }

  if (matchStats.penaltyMissed) {
    points -= 2
  }

  return points
}

/**
 * Récupère les statistiques d'un joueur pour un match spécifique
 * Cette fonction devra être adaptée selon la structure réelle des données de match
 */
export async function getPlayerMatchStats(
  playerId: string,
  matchId: string
): Promise<MatchStats | null> {
  try {
    // Récupérer le joueur pour obtenir sa position
    const playerDoc = await getDoc(doc(db, 'players', playerId))
    if (!playerDoc.exists()) {
      return null
    }

    const playerData = playerDoc.data()
    const position = playerData.position as Position

    // Récupérer les résultats du match
    const matchResultsRef = collection(db, 'matchResults')
    const q = query(matchResultsRef, where('matchId', '==', matchId))
    const matchResultsSnapshot = await getDocs(q)

    if (matchResultsSnapshot.empty) {
      return null
    }

    const matchResult = matchResultsSnapshot.docs[0].data()
    const playerName = playerData.name

    // Initialiser les stats
    const stats: MatchStats = {
      playerId,
      position,
      minutesPlayed: 0,
      goals: 0,
      assists: 0,
      cleanSheet: false,
      teamWon: false,
      teamDraw: false,
      yellowCards: 0,
      redCards: 0,
      goalsConceded: 0,
      penaltySaved: false,
      penaltyMissed: false
    }

    // Déterminer si le joueur a joué (simplifié - assume qu'il a joué s'il a des stats)
    let hasPlayed = false

    // Compter les buts
    const homeGoals = matchResult.homeTeamGoalScorers || []
    const awayGoals = matchResult.awayTeamGoalScorers || []
    
    homeGoals.forEach((goal: any) => {
      if (goal.playerName === playerName) {
        stats.goals++
        hasPlayed = true
      }
      if (goal.assists === playerName) {
        stats.assists++
        hasPlayed = true
      }
    })

    awayGoals.forEach((goal: any) => {
      if (goal.playerName === playerName) {
        stats.goals++
        hasPlayed = true
      }
      if (goal.assists === playerName) {
        stats.assists++
        hasPlayed = true
      }
    })

    // Si le joueur a joué, on assume 90 minutes (à améliorer avec des données réelles)
    if (hasPlayed) {
      stats.minutesPlayed = 90
    }

    // Déterminer le résultat pour l'équipe du joueur
    const playerTeamId = playerData.teamId
    const matchDoc = await getDoc(doc(db, 'matches', matchId))
    
    if (matchDoc.exists()) {
      const matchData = matchDoc.data()
      const isHomeTeam = matchData.homeTeamId === playerTeamId
      const homeScore = matchResult.homeTeamScore || 0
      const awayScore = matchResult.awayTeamScore || 0

      if (homeScore === awayScore) {
        stats.teamDraw = true
      } else if (isHomeTeam && homeScore > awayScore) {
        stats.teamWon = true
      } else if (!isHomeTeam && awayScore > homeScore) {
        stats.teamWon = true
      }

      // Clean sheet
      if (isHomeTeam && awayScore === 0) {
        stats.cleanSheet = true
      } else if (!isHomeTeam && homeScore === 0) {
        stats.cleanSheet = true
      }

      // Buts encaissés (pour gardien)
      if (position === 'Gardien') {
        stats.goalsConceded = isHomeTeam ? awayScore : homeScore
      }
    }

    return hasPlayed ? stats : null
  } catch (error) {
    console.error('[Fantasy] Error getting player match stats:', error)
    return null
  }
}

/**
 * Met à jour les statistiques Fantasy d'un joueur après un match
 */
export async function updatePlayerFantasyStats(
  playerId: string,
  points: number
): Promise<void> {
  try {
    const statsRef = collection(db, 'player_fantasy_stats')
    const q = query(statsRef, where('playerId', '==', playerId))
    const statsSnapshot = await getDocs(q)

    if (statsSnapshot.empty) {
      // Les stats n'existent pas encore, elles seront créées par le script d'initialisation
      console.log(`[Fantasy] No stats found for player ${playerId}`)
      return
    }

    const statsDoc = statsSnapshot.docs[0]
    const currentStats = statsDoc.data()

    // Mettre à jour les stats
    await updateDoc(doc(db, 'player_fantasy_stats', statsDoc.id), {
      totalPoints: (currentStats.totalPoints || 0) + points,
      gameweekPoints: (currentStats.gameweekPoints || 0) + points,
      form: [...(currentStats.form || []).slice(-4), points], // Garder les 5 derniers matchs
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('[Fantasy] Error updating player fantasy stats:', error)
    throw error
  }
}
