#!/usr/bin/env ts-node

/**
 * Script de mise à jour Fantasy après un match
 * 
 * Ce script:
 * 1. Récupère les résultats d'un match
 * 2. Calcule les points Fantasy de tous les joueurs du match
 * 3. Met à jour toutes les équipes Fantasy concernées
 * 4. Envoie des notifications aux utilisateurs
 * 5. Vérifie et attribue les badges
 * 
 * Usage:
 *   ts-node scripts/update-fantasy-after-match.ts <matchId>
 *   ts-node scripts/update-fantasy-after-match.ts --all  # Pour tous les matchs terminés
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import type { MatchStats, Position } from '../lib/types/fantasy'

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

/**
 * Calcule les points Fantasy d'un joueur basé sur ses performances
 */
function calculatePlayerPoints(matchStats: MatchStats): number {
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
 * Extrait les statistiques d'un joueur depuis un résultat de match
 */
async function extractPlayerStats(
  matchId: string,
  matchResult: any,
  match: any
): Promise<Map<string, MatchStats>> {
  const playerStatsMap = new Map<string, MatchStats>()

  // Récupérer tous les joueurs pour mapper les noms aux IDs et positions
  const playersSnapshot = await db.collection('players').get()
  const playersByName = new Map<string, any>()
  const playersById = new Map<string, any>()
  
  playersSnapshot.docs.forEach(doc => {
    const player = { id: doc.id, ...doc.data() }
    playersByName.set(player.name, player)
    playersById.set(player.id, player)
  })

  // Déterminer les scores
  const homeScore = matchResult.homeTeamScore || 0
  const awayScore = matchResult.awayTeamScore || 0

  // Traiter les buteurs de l'équipe à domicile
  const homeGoalScorers = matchResult.homeTeamGoalScorers || []
  const awayGoalScorers = matchResult.awayTeamGoalScorers || []

  // Traiter les cartons
  const homeYellowCards = matchResult.homeTeamYellowCards || []
  const awayYellowCards = matchResult.awayTeamYellowCards || []
  const homeRedCards = matchResult.homeTeamRedCards || []
  const awayRedCards = matchResult.awayTeamRedCards || []

  // Fonction helper pour traiter un joueur
  const processPlayer = (
    playerName: string,
    playerId: string | undefined,
    teamId: string,
    isHomeTeam: boolean
  ) => {
    const player = playerId ? playersById.get(playerId) : playersByName.get(playerName)
    if (!player) {
      console.warn(`⚠️  Joueur non trouvé: ${playerName}`)
      return null
    }

    const actualPlayerId = player.id
    const position = player.position as Position

    // Initialiser ou récupérer les stats existantes
    if (!playerStatsMap.has(actualPlayerId)) {
      const teamWon = isHomeTeam ? homeScore > awayScore : awayScore > homeScore
      const teamDraw = homeScore === awayScore
      const cleanSheet = isHomeTeam ? awayScore === 0 : homeScore === 0
      const goalsConceded = isHomeTeam ? awayScore : homeScore

      playerStatsMap.set(actualPlayerId, {
        playerId: actualPlayerId,
        position,
        minutesPlayed: 90, // On assume 90 minutes si le joueur a participé
        goals: 0,
        assists: 0,
        cleanSheet,
        teamWon,
        teamDraw,
        yellowCards: 0,
        redCards: 0,
        goalsConceded,
        penaltySaved: false,
        penaltyMissed: false
      })
    }

    return actualPlayerId
  }

  // Traiter les buteurs de l'équipe à domicile
  homeGoalScorers.forEach((goal: any) => {
    const playerId = processPlayer(goal.playerName, goal.playerId, match.homeTeamId, true)
    if (playerId) {
      const stats = playerStatsMap.get(playerId)!
      stats.goals++
    }

    // Traiter les passes décisives
    if (goal.assists) {
      const assistPlayerId = processPlayer(goal.assists, undefined, match.homeTeamId, true)
      if (assistPlayerId) {
        const stats = playerStatsMap.get(assistPlayerId)!
        stats.assists++
      }
    }
  })

  // Traiter les buteurs de l'équipe à l'extérieur
  awayGoalScorers.forEach((goal: any) => {
    const playerId = processPlayer(goal.playerName, goal.playerId, match.awayTeamId, false)
    if (playerId) {
      const stats = playerStatsMap.get(playerId)!
      stats.goals++
    }

    // Traiter les passes décisives
    if (goal.assists) {
      const assistPlayerId = processPlayer(goal.assists, undefined, match.awayTeamId, false)
      if (assistPlayerId) {
        const stats = playerStatsMap.get(assistPlayerId)!
        stats.assists++
      }
    }
  })

  // Traiter les cartons jaunes
  homeYellowCards.forEach((card: any) => {
    const playerId = processPlayer(card.playerName, undefined, match.homeTeamId, true)
    if (playerId) {
      const stats = playerStatsMap.get(playerId)!
      stats.yellowCards++
    }
  })

  awayYellowCards.forEach((card: any) => {
    const playerId = processPlayer(card.playerName, undefined, match.awayTeamId, false)
    if (playerId) {
      const stats = playerStatsMap.get(playerId)!
      stats.yellowCards++
    }
  })

  // Traiter les cartons rouges
  homeRedCards.forEach((card: any) => {
    const playerId = processPlayer(card.playerName, undefined, match.homeTeamId, true)
    if (playerId) {
      const stats = playerStatsMap.get(playerId)!
      stats.redCards++
    }
  })

  awayRedCards.forEach((card: any) => {
    const playerId = processPlayer(card.playerName, undefined, match.awayTeamId, false)
    if (playerId) {
      const stats = playerStatsMap.get(playerId)!
      stats.redCards++
    }
  })

  return playerStatsMap
}

/**
 * Met à jour les équipes Fantasy après un match
 */
async function updateFantasyTeamsAfterMatch(
  matchId: string,
  playerStatsMap: Map<string, MatchStats>
): Promise<void> {
  console.log(`\n📊 Mise à jour des équipes Fantasy...`)

  // Récupérer toutes les équipes Fantasy
  const teamsSnapshot = await db.collection('fantasy_teams').get()

  if (teamsSnapshot.empty) {
    console.log('ℹ️  Aucune équipe Fantasy trouvée')
    return
  }

  const updatePromises: Promise<any>[] = []
  const notificationPromises: Promise<any>[] = []
  const badgePromises: Promise<any>[] = []
  let teamsUpdated = 0

  for (const teamDoc of teamsSnapshot.docs) {
    const team = { id: teamDoc.id, ...teamDoc.data() }
    let gameweekPointsEarned = 0
    let hasPlayersInMatch = false
    let captainPoints = 0
    let bestPlayerPoints = 0
    let bestPlayerName = ''

    // Mettre à jour les points de chaque joueur de l'équipe
    const updatedPlayers = team.players.map((player: any) => {
      const matchStats = playerStatsMap.get(player.playerId)

      if (matchStats) {
        hasPlayersInMatch = true
        
        // Calculer les points du joueur
        const basePoints = calculatePlayerPoints(matchStats)
        
        // Doubler les points si c'est le capitaine
        const finalPoints = player.isCaptain ? basePoints * 2 : basePoints

        gameweekPointsEarned += finalPoints

        // Suivre le capitaine
        if (player.isCaptain) {
          captainPoints = finalPoints
        }

        // Suivre le meilleur joueur
        if (finalPoints > bestPlayerPoints) {
          bestPlayerPoints = finalPoints
          // Récupérer le nom du joueur
          const playerData = Array.from(playerStatsMap.values()).find(p => p.playerId === player.playerId)
          if (playerData) {
            bestPlayerName = player.playerId // On utilisera l'ID pour récupérer le nom plus tard
          }
        }

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
      const updatePromise = db.collection('fantasy_teams').doc(team.id).update({
        players: updatedPlayers,
        gameweekPoints: team.gameweekPoints + gameweekPointsEarned,
        totalPoints: team.totalPoints + gameweekPointsEarned,
        updatedAt: Timestamp.now()
      })

      updatePromises.push(updatePromise)
      teamsUpdated++

      console.log(`  ✅ ${team.teamName}: +${gameweekPointsEarned} points`)

      // Envoyer notification de points gagnés
      if (gameweekPointsEarned > 0) {
        const notifPromise = db.collection('notifications').add({
          userId: team.userId,
          type: 'fantasy_update',
          subType: 'points_earned',
          title: 'Fantasy ComeBac',
          message: `⚽ Votre équipe a marqué ${gameweekPointsEarned} points !`,
          link: '/public/fantasy/my-team',
          read: false,
          metadata: {
            points: gameweekPointsEarned,
            teamId: team.id,
            matchId
          },
          createdAt: Timestamp.now()
        })
        notificationPromises.push(notifPromise)
      }

      // Notification spéciale pour le capitaine si bon score
      if (captainPoints >= 10) {
        const notifPromise = db.collection('notifications').add({
          userId: team.userId,
          type: 'fantasy_update',
          subType: 'captain_scored',
          title: 'Fantasy ComeBac',
          message: `👑 Votre capitaine a marqué ${captainPoints} points (x2) !`,
          link: '/public/fantasy/my-team',
          read: false,
          metadata: {
            points: captainPoints,
            teamId: team.id,
            matchId
          },
          createdAt: Timestamp.now()
        })
        notificationPromises.push(notifPromise)
      }

      // Notification pour excellente performance d'un joueur
      if (bestPlayerPoints >= 15) {
        const notifPromise = db.collection('notifications').add({
          userId: team.userId,
          type: 'fantasy_update',
          subType: 'player_performance',
          title: 'Fantasy ComeBac',
          message: `⭐ Un de vos joueurs a marqué ${bestPlayerPoints} points !`,
          link: '/public/fantasy/my-team',
          read: false,
          metadata: {
            points: bestPlayerPoints,
            playerId: bestPlayerName,
            teamId: team.id,
            matchId
          },
          createdAt: Timestamp.now()
        })
        notificationPromises.push(notifPromise)
      }

      // Vérifier et attribuer les badges (on le fera après la mise à jour du classement)
      badgePromises.push(
        checkAndAwardBadges(team.userId, team.id, team.gameweek || 1)
      )
    }
  }

  // Attendre que toutes les mises à jour soient terminées
  await Promise.all(updatePromises)
  console.log(`\n✅ ${teamsUpdated} équipes mises à jour`)

  // Envoyer les notifications
  await Promise.all(notificationPromises)
  console.log(`✅ ${notificationPromises.length} notifications envoyées`)

  // Mettre à jour le classement
  await updateLeaderboard()

  // Vérifier les badges
  await Promise.all(badgePromises)
}

/**
 * Met à jour le classement Fantasy
 */
async function updateLeaderboard(): Promise<void> {
  console.log(`\n🏆 Mise à jour du classement...`)

  const teamsSnapshot = await db.collection('fantasy_teams').get()
  const teams = teamsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))

  // Trier par points totaux
  teams.sort((a: any, b: any) => b.totalPoints - a.totalPoints)

  // Mettre à jour les rangs
  const updatePromises = teams.map((team: any, index: number) => {
    const newRank = index + 1
    const oldRank = team.rank || 999

    return db.collection('fantasy_teams').doc(team.id).update({
      rank: newRank,
      updatedAt: Timestamp.now()
    }).then(() => {
      // Notifier si amélioration significative du classement
      if (oldRank > 100 && newRank <= 100) {
        return db.collection('notifications').add({
          userId: team.userId,
          type: 'fantasy_update',
          subType: 'rank_improved',
          title: 'Fantasy ComeBac',
          message: `📈 Vous êtes maintenant ${newRank}${newRank === 1 ? 'er' : 'ème'} !`,
          link: '/public/fantasy/leaderboard',
          read: false,
          metadata: {
            newRank,
            oldRank
          },
          createdAt: Timestamp.now()
        })
      } else if (oldRank > 50 && newRank <= 50) {
        return db.collection('notifications').add({
          userId: team.userId,
          type: 'fantasy_update',
          subType: 'rank_improved',
          title: 'Fantasy ComeBac',
          message: `📈 Vous êtes maintenant ${newRank}${newRank === 1 ? 'er' : 'ème'} !`,
          link: '/public/fantasy/leaderboard',
          read: false,
          metadata: {
            newRank,
            oldRank
          },
          createdAt: Timestamp.now()
        })
      } else if (oldRank > 10 && newRank <= 10) {
        return db.collection('notifications').add({
          userId: team.userId,
          type: 'fantasy_update',
          subType: 'rank_improved',
          title: 'Fantasy ComeBac',
          message: `📈 Vous êtes maintenant ${newRank}${newRank === 1 ? 'er' : 'ème'} !`,
          link: '/public/fantasy/leaderboard',
          read: false,
          metadata: {
            newRank,
            oldRank
          },
          createdAt: Timestamp.now()
        })
      }
    })
  })

  await Promise.all(updatePromises)
  console.log(`✅ Classement mis à jour`)
}

/**
 * Vérifie et attribue les badges
 */
async function checkAndAwardBadges(
  userId: string,
  teamId: string,
  gameweek: number
): Promise<void> {
  // Récupérer l'équipe
  const teamDoc = await db.collection('fantasy_teams').doc(teamId).get()
  if (!teamDoc.exists) return

  const team = { id: teamDoc.id, ...teamDoc.data() }
  const newBadges: string[] = []

  // Vérifier badge Top 10 de la semaine
  if (team.weeklyRank && team.weeklyRank <= 10) {
    const hasIt = await hasBadge(userId, 'top_10_week')
    if (!hasIt) {
      await awardBadge(userId, 'top_10_week', gameweek, {
        rank: team.weeklyRank,
        points: team.gameweekPoints
      })
      newBadges.push('Top 10 de la semaine')
    }
  }

  // Vérifier badge Podium
  if (team.rank && team.rank <= 3) {
    const hasIt = await hasBadge(userId, 'podium')
    if (!hasIt) {
      await awardBadge(userId, 'podium', gameweek, {
        rank: team.rank,
        points: team.totalPoints
      })
      newBadges.push('Podium')
    }
  }

  // Vérifier badge Century
  if (team.gameweekPoints >= 100) {
    const hasIt = await hasBadge(userId, 'century')
    if (!hasIt) {
      await awardBadge(userId, 'century', gameweek, {
        points: team.gameweekPoints
      })
      newBadges.push('Century')
    }
  }

  // Vérifier badge Captain Parfait
  const captain = team.players.find((p: any) => p.isCaptain)
  if (captain && captain.gameweekPoints >= 20) {
    const hasIt = await hasBadge(userId, 'perfect_captain')
    if (!hasIt) {
      await awardBadge(userId, 'perfect_captain', gameweek, {
        points: captain.gameweekPoints
      })
      newBadges.push('Captain Parfait')
    }
  }

  // Envoyer notifications pour les nouveaux badges
  for (const badgeName of newBadges) {
    await db.collection('notifications').add({
      userId,
      type: 'fantasy_update',
      subType: 'badge_earned',
      title: 'Fantasy ComeBac',
      message: `🏆 Nouveau badge débloqué : ${badgeName}`,
      link: '/public/fantasy/rewards',
      read: false,
      metadata: {
        badgeName,
        gameweek
      },
      createdAt: Timestamp.now()
    })
  }

  if (newBadges.length > 0) {
    console.log(`  🏆 ${newBadges.length} badge(s) attribué(s) à ${team.teamName}`)
  }
}

/**
 * Vérifie si un utilisateur a déjà un badge
 */
async function hasBadge(userId: string, badgeType: string): Promise<boolean> {
  const badgesSnapshot = await db.collection('fantasy_badges')
    .where('userId', '==', userId)
    .where('badgeType', '==', badgeType)
    .get()
  
  return !badgesSnapshot.empty
}

/**
 * Attribue un badge à un utilisateur
 */
async function awardBadge(
  userId: string,
  badgeType: string,
  gameweek: number,
  metadata?: any
): Promise<void> {
  await db.collection('fantasy_badges').add({
    userId,
    badgeType,
    earnedAt: Timestamp.now(),
    gameweek,
    metadata
  })
}

/**
 * Met à jour les statistiques Fantasy d'un joueur
 */
async function updatePlayerFantasyStats(
  playerId: string,
  points: number
): Promise<void> {
  const statsSnapshot = await db.collection('player_fantasy_stats')
    .where('playerId', '==', playerId)
    .get()

  if (statsSnapshot.empty) {
    console.warn(`⚠️  Pas de stats Fantasy pour le joueur ${playerId}`)
    return
  }

  const statsDoc = statsSnapshot.docs[0]
  const currentStats = statsDoc.data()

  await db.collection('player_fantasy_stats').doc(statsDoc.id).update({
    totalPoints: (currentStats.totalPoints || 0) + points,
    gameweekPoints: (currentStats.gameweekPoints || 0) + points,
    form: [...(currentStats.form || []).slice(-4), points],
    updatedAt: Timestamp.now()
  })
}

/**
 * Traite un match spécifique
 */
async function processMatch(matchId: string): Promise<void> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🎮 Traitement du match: ${matchId}`)
  console.log('='.repeat(60))

  // Récupérer le match
  const matchDoc = await db.collection('matches').doc(matchId).get()
  if (!matchDoc.exists) {
    console.error(`❌ Match ${matchId} non trouvé`)
    return
  }

  const match = { id: matchDoc.id, ...matchDoc.data() }
  console.log(`📍 Match: ${match.homeTeamId} vs ${match.awayTeamId}`)

  // Récupérer le résultat du match
  const resultsSnapshot = await db.collection('matchResults')
    .where('matchId', '==', matchId)
    .get()

  if (resultsSnapshot.empty) {
    console.error(`❌ Aucun résultat trouvé pour le match ${matchId}`)
    return
  }

  const matchResult = resultsSnapshot.docs[0].data()
  console.log(`📊 Score: ${matchResult.homeTeamScore} - ${matchResult.awayTeamScore}`)

  // Extraire les statistiques des joueurs
  const playerStatsMap = await extractPlayerStats(matchId, matchResult, match)
  console.log(`\n👥 ${playerStatsMap.size} joueurs ont participé au match`)

  // Afficher les points de chaque joueur
  console.log(`\n📈 Points Fantasy par joueur:`)
  for (const [playerId, stats] of playerStatsMap.entries()) {
    const points = calculatePlayerPoints(stats)
    console.log(`  • ${playerId}: ${points} points (${stats.goals}⚽ ${stats.assists}🅰️)`)
    
    // Mettre à jour les stats Fantasy du joueur
    await updatePlayerFantasyStats(playerId, points)
  }

  // Mettre à jour les équipes Fantasy
  await updateFantasyTeamsAfterMatch(matchId, playerStatsMap)

  console.log(`\n✅ Traitement du match ${matchId} terminé`)
}

/**
 * Traite tous les matchs terminés
 */
async function processAllMatches(): Promise<void> {
  console.log(`\n🎮 Traitement de tous les matchs terminés...`)

  // Récupérer tous les résultats de matchs
  const resultsSnapshot = await db.collection('matchResults').get()
  
  if (resultsSnapshot.empty) {
    console.log('ℹ️  Aucun résultat de match trouvé')
    return
  }

  console.log(`📊 ${resultsSnapshot.size} résultats de matchs trouvés`)

  for (const resultDoc of resultsSnapshot.docs) {
    const result = resultDoc.data()
    await processMatch(result.matchId)
  }

  console.log(`\n✅ Tous les matchs ont été traités`)
}

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    const args = process.argv.slice(2)

    if (args.length === 0) {
      console.error('❌ Usage: ts-node scripts/update-fantasy-after-match.ts <matchId>')
      console.error('   ou:    ts-node scripts/update-fantasy-after-match.ts --all')
      process.exit(1)
    }

    if (args[0] === '--all') {
      await processAllMatches()
    } else {
      const matchId = args[0]
      await processMatch(matchId)
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log('✅ Script terminé avec succès')
    console.log('='.repeat(60))
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution du script:', error)
    process.exit(1)
  }
}

// Exécuter le script
main()
