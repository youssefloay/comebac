import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { calculatePlayerPointsSync } from '@/lib/fantasy/points-system'
import type { Position } from '@/lib/types/fantasy'

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

    const { matchId } = await request.json()

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID requis' }, { status: 400 })
    }

    // Récupérer le match
    const matchDoc = await adminDb.collection('matches').doc(matchId).get()
    if (!matchDoc.exists) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 })
    }

    const match = matchDoc.data()

    // Récupérer le résultat du match
    const resultsSnapshot = await adminDb
      .collection('matchResults')
      .where('matchId', '==', matchId)
      .get()

    if (resultsSnapshot.empty) {
      return NextResponse.json({ error: 'Aucun résultat trouvé pour ce match' }, { status: 404 })
    }

    const matchResult = resultsSnapshot.docs[0].data()

    // Récupérer tous les joueurs pour mapper les noms aux IDs
    const playersSnapshot = await adminDb.collection('players').get()
    const playersByName = new Map<string, any>()
    const playersById = new Map<string, any>()
    
    playersSnapshot.docs.forEach(doc => {
      const player: any = { id: doc.id, ...doc.data() }
      playersByName.set(player.name, player)
      playersById.set(player.id, player)
    })

    // Extraire les statistiques des joueurs
    const homeScore = matchResult.homeTeamScore || 0
    const awayScore = matchResult.awayTeamScore || 0
    const playerStatsMap = new Map()

    const processPlayer = (playerName: string, playerId: string | undefined, isHomeTeam: boolean) => {
      const player = playerId ? playersById.get(playerId) : playersByName.get(playerName)
      if (!player) return null

      const actualPlayerId = player.id
      const position = player.position as Position

      if (!playerStatsMap.has(actualPlayerId)) {
        const teamWon = isHomeTeam ? homeScore > awayScore : awayScore > homeScore
        const teamDraw = homeScore === awayScore
        const cleanSheet = isHomeTeam ? awayScore === 0 : homeScore === 0
        const goalsConceded = isHomeTeam ? awayScore : homeScore

        playerStatsMap.set(actualPlayerId, {
          playerId: actualPlayerId,
          position,
          minutesPlayed: 90,
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

    // Traiter les buteurs
    const homeGoalScorers = matchResult.homeTeamGoalScorers || []
    const awayGoalScorers = matchResult.awayTeamGoalScorers || []

    homeGoalScorers.forEach((goal: any) => {
      const playerId = processPlayer(goal.playerName, goal.playerId, true)
      if (playerId) {
        playerStatsMap.get(playerId).goals++
        if (goal.assists) {
          const assistPlayerId = processPlayer(goal.assists, undefined, true)
          if (assistPlayerId) playerStatsMap.get(assistPlayerId).assists++
        }
      }
    })

    awayGoalScorers.forEach((goal: any) => {
      const playerId = processPlayer(goal.playerName, goal.playerId, false)
      if (playerId) {
        playerStatsMap.get(playerId).goals++
        if (goal.assists) {
          const assistPlayerId = processPlayer(goal.assists, undefined, false)
          if (assistPlayerId) playerStatsMap.get(assistPlayerId).assists++
        }
      }
    })

    // Traiter les cartons
    const homeYellowCards = matchResult.homeTeamYellowCards || []
    const awayYellowCards = matchResult.awayTeamYellowCards || []
    const homeRedCards = matchResult.homeTeamRedCards || []
    const awayRedCards = matchResult.awayTeamRedCards || []

    homeYellowCards.forEach((card: any) => {
      const playerId = processPlayer(card.playerName, undefined, true)
      if (playerId) playerStatsMap.get(playerId).yellowCards++
    })

    awayYellowCards.forEach((card: any) => {
      const playerId = processPlayer(card.playerName, undefined, false)
      if (playerId) playerStatsMap.get(playerId).yellowCards++
    })

    homeRedCards.forEach((card: any) => {
      const playerId = processPlayer(card.playerName, undefined, true)
      if (playerId) playerStatsMap.get(playerId).redCards++
    })

    awayRedCards.forEach((card: any) => {
      const playerId = processPlayer(card.playerName, undefined, false)
      if (playerId) playerStatsMap.get(playerId).redCards++
    })

    // Calculer les points de chaque joueur
    const playerPoints = new Map<string, number>()
    for (const [playerId, stats] of playerStatsMap.entries()) {
      const points = calculatePlayerPointsSync(stats as any)
      playerPoints.set(playerId, points)

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
    }

    // Mettre à jour les équipes Fantasy
    const teamsSnapshot = await adminDb.collection('fantasy_teams').get()
    let teamsUpdated = 0
    let notificationsSent = 0

    for (const teamDoc of teamsSnapshot.docs) {
      const team = teamDoc.data()
      let gameweekPointsEarned = 0
      let hasPlayersInMatch = false

      const updatedPlayers = team.players.map((player: any) => {
        const points = playerPoints.get(player.playerId)

        if (points !== undefined) {
          hasPlayersInMatch = true
          const finalPoints = player.isCaptain ? points * 2 : points
          gameweekPointsEarned += finalPoints

          return {
            ...player,
            gameweekPoints: player.gameweekPoints + finalPoints,
            points: player.points + finalPoints
          }
        }

        return player
      })

      if (hasPlayersInMatch) {
        await teamDoc.ref.update({
          players: updatedPlayers,
          gameweekPoints: team.gameweekPoints + gameweekPointsEarned,
          totalPoints: team.totalPoints + gameweekPointsEarned,
          updatedAt: new Date()
        })

        teamsUpdated++

        // Envoyer notification
        if (gameweekPointsEarned > 0) {
          await adminDb.collection('notifications').add({
            userId: team.userId,
            type: 'fantasy_update',
            subType: 'points_earned',
            title: 'Fantasy ComeBac',
            message: `⚽ Votre équipe a marqué ${gameweekPointsEarned} points !`,
            link: '/public/fantasy/my-team',
            read: false,
            metadata: {
              points: gameweekPointsEarned,
              teamId: teamDoc.id,
              matchId
            },
            createdAt: new Date()
          })
          notificationsSent++
        }
      }
    }

    // Mettre à jour le classement
    const allTeamsSnapshot = await adminDb.collection('fantasy_teams').get()
    const teams = allTeamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    teams.sort((a: any, b: any) => b.totalPoints - a.totalPoints)

    const rankUpdatePromises = teams.map((team: any, index: number) => {
      return adminDb.collection('fantasy_teams').doc(team.id).update({
        rank: index + 1,
        updatedAt: new Date()
      })
    })

    await Promise.all(rankUpdatePromises)

    return NextResponse.json({
      success: true,
      message: `✅ Match traité: ${playerStatsMap.size} joueurs, ${teamsUpdated} équipes mises à jour, ${notificationsSent} notifications envoyées`
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour après match:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour après match' },
      { status: 500 }
    )
  }
}
