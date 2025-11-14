import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { calculatePlayerPointsSync } from '@/lib/fantasy/points-system'
import type { Position, MatchStats } from '@/lib/types/fantasy'

/**
 * API pour recalculer manuellement les points Fantasy
 * Permet de corriger des erreurs ou de forcer une mise à jour
 * 
 * Modes supportés:
 * 1. Recalculer les points d'un joueur spécifique pour un match
 * 2. Recalculer tous les points d'une équipe Fantasy
 * 3. Recalculer les points d'un joueur avec des stats personnalisées
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    // Vérifier que l'utilisateur est admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - Admin uniquement' }, { status: 403 })
    }

    const body = await request.json()
    const { mode, playerId, teamId, matchStats } = body

    // Mode 1: Recalculer les points d'un joueur avec des stats personnalisées
    if (mode === 'player_custom_stats') {
      if (!playerId || !matchStats) {
        return NextResponse.json(
          { error: 'playerId et matchStats requis pour ce mode' },
          { status: 400 }
        )
      }

      const result = await updatePlayerPointsCustom(playerId, matchStats)
      return NextResponse.json(result)
    }

    // Mode 2: Recalculer tous les points d'une équipe Fantasy
    if (mode === 'recalculate_team') {
      if (!teamId) {
        return NextResponse.json(
          { error: 'teamId requis pour ce mode' },
          { status: 400 }
        )
      }

      const result = await recalculateTeamPoints(teamId)
      return NextResponse.json(result)
    }

    // Mode 3: Réinitialiser les points d'une gameweek pour toutes les équipes
    if (mode === 'reset_gameweek') {
      const result = await resetGameweekPoints()
      return NextResponse.json(result)
    }

    // Mode 4: Corriger les points d'un joueur dans une équipe Fantasy
    if (mode === 'correct_player_in_team') {
      if (!teamId || !playerId) {
        return NextResponse.json(
          { error: 'teamId et playerId requis pour ce mode' },
          { status: 400 }
        )
      }

      const { pointsAdjustment } = body
      if (pointsAdjustment === undefined) {
        return NextResponse.json(
          { error: 'pointsAdjustment requis (peut être négatif)' },
          { status: 400 }
        )
      }

      const result = await correctPlayerPointsInTeam(teamId, playerId, pointsAdjustment)
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Mode invalide. Modes disponibles: player_custom_stats, recalculate_team, reset_gameweek, correct_player_in_team' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erreur lors de la mise à jour manuelle des points:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour manuelle des points' },
      { status: 500 }
    )
  }
}

/**
 * Met à jour les points d'un joueur avec des stats personnalisées
 */
async function updatePlayerPointsCustom(
  playerId: string,
  matchStats: MatchStats
): Promise<any> {
  // Vérifier que le joueur existe
  const playerDoc = await adminDb.collection('players').doc(playerId).get()
  if (!playerDoc.exists) {
    return { error: 'Joueur non trouvé', status: 404 }
  }

  // Calculer les points
  const points = calculatePlayerPointsSync(matchStats)

  // Mettre à jour les stats Fantasy du joueur
  const statsSnapshot = await adminDb
    .collection('player_fantasy_stats')
    .where('playerId', '==', playerId)
    .get()

  if (!statsSnapshot.empty) {
    const statsDoc = statsSnapshot.docs[0]
    const currentStats = statsDoc.data()

    await statsDoc.ref.update({
      totalPoints: (currentStats.totalPoints || 0) + points,
      gameweekPoints: (currentStats.gameweekPoints || 0) + points,
      form: [...(currentStats.form || []).slice(-4), points],
      updatedAt: new Date()
    })
  }

  // Mettre à jour toutes les équipes Fantasy qui ont ce joueur
  const teamsSnapshot = await adminDb.collection('fantasy_teams').get()
  let teamsUpdated = 0

  for (const teamDoc of teamsSnapshot.docs) {
    const team = teamDoc.data()
    let teamUpdated = false

    const updatedPlayers = team.players.map((player: any) => {
      if (player.playerId === playerId) {
        teamUpdated = true
        const finalPoints = player.isCaptain ? points * 2 : points

        return {
          ...player,
          gameweekPoints: player.gameweekPoints + finalPoints,
          points: player.points + finalPoints
        }
      }
      return player
    })

    if (teamUpdated) {
      const pointsEarned = updatedPlayers
        .filter((p: any) => p.playerId === playerId)
        .reduce((sum: number, p: any) => {
          const diff = p.points - (team.players.find((tp: any) => tp.playerId === playerId)?.points || 0)
          return sum + diff
        }, 0)

      await teamDoc.ref.update({
        players: updatedPlayers,
        gameweekPoints: team.gameweekPoints + pointsEarned,
        totalPoints: team.totalPoints + pointsEarned,
        updatedAt: new Date()
      })

      teamsUpdated++
    }
  }

  // Mettre à jour le classement
  await updateLeaderboard()

  return {
    success: true,
    message: `✅ Points mis à jour: ${points} points calculés, ${teamsUpdated} équipes mises à jour`,
    data: {
      playerId,
      pointsCalculated: points,
      teamsUpdated,
      matchStats
    }
  }
}

/**
 * Recalcule tous les points d'une équipe Fantasy
 * Utile pour corriger des erreurs de calcul
 */
async function recalculateTeamPoints(teamId: string): Promise<any> {
  const teamDoc = await adminDb.collection('fantasy_teams').doc(teamId).get()
  
  if (!teamDoc.exists) {
    return { error: 'Équipe Fantasy non trouvée', status: 404 }
  }

  const team = teamDoc.data()
  if (!team) {
    return { error: 'Données de l\'équipe invalides', status: 500 }
  }

  let totalPoints = 0
  let gameweekPoints = 0

  // Recalculer les points de chaque joueur
  const updatedPlayers = await Promise.all(
    team.players.map(async (player: any) => {
      // Récupérer les stats Fantasy du joueur
      const statsSnapshot = await adminDb
        .collection('player_fantasy_stats')
        .where('playerId', '==', player.playerId)
        .get()

      if (!statsSnapshot.empty) {
        const stats = statsSnapshot.docs[0].data()
        const playerTotalPoints = stats.totalPoints || 0
        const playerGameweekPoints = stats.gameweekPoints || 0

        // Appliquer le multiplicateur capitaine
        const finalTotalPoints = player.isCaptain ? playerTotalPoints * 2 : playerTotalPoints
        const finalGameweekPoints = player.isCaptain ? playerGameweekPoints * 2 : playerGameweekPoints

        totalPoints += finalTotalPoints
        gameweekPoints += finalGameweekPoints

        return {
          ...player,
          points: finalTotalPoints,
          gameweekPoints: finalGameweekPoints
        }
      }

      return player
    })
  )

  // Mettre à jour l'équipe
  await teamDoc.ref.update({
    players: updatedPlayers,
    totalPoints,
    gameweekPoints,
    updatedAt: new Date()
  })

  // Mettre à jour le classement
  await updateLeaderboard()

  return {
    success: true,
    message: `✅ Équipe recalculée: ${totalPoints} points totaux, ${gameweekPoints} points gameweek`,
    data: {
      teamId,
      teamName: team.teamName,
      totalPoints,
      gameweekPoints,
      playersCount: updatedPlayers.length
    }
  }
}

/**
 * Réinitialise les points de gameweek pour toutes les équipes
 * Utile au début d'une nouvelle gameweek
 */
async function resetGameweekPoints(): Promise<any> {
  const teamsSnapshot = await adminDb.collection('fantasy_teams').get()
  const statsSnapshot = await adminDb.collection('player_fantasy_stats').get()

  // Réinitialiser les points gameweek des joueurs
  const statsUpdatePromises = statsSnapshot.docs.map(doc =>
    doc.ref.update({
      gameweekPoints: 0,
      updatedAt: new Date()
    })
  )

  // Réinitialiser les points gameweek des équipes
  const teamsUpdatePromises = teamsSnapshot.docs.map(doc => {
    const team = doc.data()
    const updatedPlayers = team.players.map((player: any) => ({
      ...player,
      gameweekPoints: 0
    }))

    return doc.ref.update({
      players: updatedPlayers,
      gameweekPoints: 0,
      weeklyRank: 0,
      updatedAt: new Date()
    })
  })

  await Promise.all([...statsUpdatePromises, ...teamsUpdatePromises])

  return {
    success: true,
    message: `✅ Points gameweek réinitialisés: ${teamsSnapshot.size} équipes, ${statsSnapshot.size} joueurs`,
    data: {
      teamsReset: teamsSnapshot.size,
      playersReset: statsSnapshot.size
    }
  }
}

/**
 * Corrige les points d'un joueur spécifique dans une équipe Fantasy
 * Permet d'ajouter ou retirer des points manuellement
 */
async function correctPlayerPointsInTeam(
  teamId: string,
  playerId: string,
  pointsAdjustment: number
): Promise<any> {
  const teamDoc = await adminDb.collection('fantasy_teams').doc(teamId).get()
  
  if (!teamDoc.exists) {
    return { error: 'Équipe Fantasy non trouvée', status: 404 }
  }

  const team = teamDoc.data()
  if (!team) {
    return { error: 'Données de l\'équipe invalides', status: 500 }
  }

  let playerFound = false

  const updatedPlayers = team.players.map((player: any) => {
    if (player.playerId === playerId) {
      playerFound = true
      return {
        ...player,
        points: player.points + pointsAdjustment,
        gameweekPoints: player.gameweekPoints + pointsAdjustment
      }
    }
    return player
  })

  if (!playerFound) {
    return { error: 'Joueur non trouvé dans cette équipe', status: 404 }
  }

  // Mettre à jour l'équipe
  await teamDoc.ref.update({
    players: updatedPlayers,
    totalPoints: team.totalPoints + pointsAdjustment,
    gameweekPoints: team.gameweekPoints + pointsAdjustment,
    updatedAt: new Date()
  })

  // Mettre à jour le classement
  await updateLeaderboard()

  // Envoyer une notification si l'ajustement est significatif
  if (Math.abs(pointsAdjustment) >= 5) {
    const playerDoc = await adminDb.collection('players').doc(playerId).get()
    const playerName = playerDoc.exists ? playerDoc.data()?.name : 'Joueur'

    await adminDb.collection('notifications').add({
      userId: team.userId,
      type: 'fantasy_update',
      subType: 'points_earned',
      title: 'Fantasy ComeBac - Correction',
      message: `⚙️ Correction: ${playerName} ${pointsAdjustment > 0 ? '+' : ''}${pointsAdjustment} points`,
      link: '/public/fantasy/my-team',
      read: false,
      metadata: {
        points: pointsAdjustment,
        teamId,
        playerId,
        correction: true
      },
      createdAt: new Date()
    })
  }

  return {
    success: true,
    message: `✅ Points corrigés: ${pointsAdjustment > 0 ? '+' : ''}${pointsAdjustment} points pour le joueur`,
    data: {
      teamId,
      teamName: team.teamName,
      playerId,
      pointsAdjustment,
      newTotalPoints: team.totalPoints + pointsAdjustment
    }
  }
}

/**
 * Met à jour le classement de toutes les équipes Fantasy
 */
async function updateLeaderboard(): Promise<void> {
  const teamsSnapshot = await adminDb.collection('fantasy_teams').get()
  const teams = teamsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))

  // Classement général (par points totaux)
  teams.sort((a: any, b: any) => b.totalPoints - a.totalPoints)
  const rankUpdatePromises = teams.map((team: any, index: number) =>
    adminDb.collection('fantasy_teams').doc(team.id).update({
      rank: index + 1,
      updatedAt: new Date()
    })
  )

  // Classement hebdomadaire (par points gameweek)
  teams.sort((a: any, b: any) => b.gameweekPoints - a.gameweekPoints)
  const weeklyRankUpdatePromises = teams.map((team: any, index: number) =>
    adminDb.collection('fantasy_teams').doc(team.id).update({
      weeklyRank: index + 1,
      updatedAt: new Date()
    })
  )

  await Promise.all([...rankUpdatePromises, ...weeklyRankUpdatePromises])
}
