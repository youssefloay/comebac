import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import type { FantasyTeam, FantasyPlayer } from '@/lib/types/fantasy'
import { batchFetchPlayers, batchFetchTeams } from '@/lib/fantasy/firestore-queries'

/**
 * GET - Récupérer l'équipe Fantasy d'un utilisateur
 * 
 * Query params:
 * - userId: string (required) - ID de l'utilisateur
 * 
 * Returns:
 * - team: FantasyTeam avec tous les détails des joueurs
 * - playerDetails: Informations complètes de chaque joueur (nom, photo, équipe, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Validation du paramètre userId
    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      )
    }

    // Récupérer l'équipe Fantasy de l'utilisateur
    const fantasyTeamsRef = adminDb.collection('fantasy_teams')
    const teamSnapshot = await fantasyTeamsRef
      .where('userId', '==', userId)
      .limit(1)
      .get()

    if (teamSnapshot.empty) {
      return NextResponse.json(
        { error: 'Aucune équipe Fantasy trouvée pour cet utilisateur' },
        { status: 404 }
      )
    }

    const teamDoc = teamSnapshot.docs[0]
    const teamData = teamDoc.data()

    // OPTIMIZATION: Batch fetch player details
    const playerIds = teamData.players.map((p: FantasyPlayer) => p.playerId)
    const playerDetailsMap = await batchFetchPlayers(playerIds)

    // Transform player data to include required fields
    playerDetailsMap.forEach((player, playerId) => {
      playerDetailsMap.set(playerId, {
        id: playerId,
        name: player.name,
        photo: player.photo || null,
        position: player.position,
        number: player.number,
        teamId: player.teamId,
        school: player.school || null,
        isCaptain: player.isCaptain || false,
        seasonStats: player.seasonStats || {
          goals: 0,
          assists: 0,
          matches: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0
        }
      })
    })

    // OPTIMIZATION: Batch fetch team information
    const teamIds = Array.from(
      new Set(
        Array.from(playerDetailsMap.values()).map((p: any) => p.teamId)
      )
    ).filter(Boolean) as string[]
    
    const teamNamesMap = await batchFetchTeams(teamIds)

    // Transform team data
    teamNamesMap.forEach((team, teamId) => {
      teamNamesMap.set(teamId, {
        name: team.name,
        logo: team.logo || null,
        color: team.color || null
      })
    })

    // Enrichir les détails des joueurs avec les informations d'équipe
    playerDetailsMap.forEach((player, playerId) => {
      const teamInfo = teamNamesMap.get(player.teamId)
      if (teamInfo) {
        player.teamName = teamInfo.name
        player.teamLogo = teamInfo.logo
        player.teamColor = teamInfo.color
      }
    })

    // Calculer les points en temps réel
    // Les points sont déjà stockés dans la base de données et mis à jour après chaque match
    // Nous les récupérons directement depuis teamData.players
    const playersWithDetails = teamData.players.map((fantasyPlayer: FantasyPlayer) => {
      const playerDetails = playerDetailsMap.get(fantasyPlayer.playerId)
      
      return {
        ...fantasyPlayer,
        // Ajouter les détails du joueur réel
        name: playerDetails?.name || 'Joueur inconnu',
        photo: playerDetails?.photo || null,
        number: playerDetails?.number || null,
        teamId: playerDetails?.teamId || null,
        teamName: playerDetails?.teamName || null,
        teamLogo: playerDetails?.teamLogo || null,
        teamColor: playerDetails?.teamColor || null,
        school: playerDetails?.school || null,
        seasonStats: playerDetails?.seasonStats || null
      }
    })

    // Construire l'objet équipe complet
    const team: FantasyTeam = {
      id: teamDoc.id,
      userId: teamData.userId,
      teamName: teamData.teamName,
      budget: teamData.budget,
      budgetRemaining: teamData.budgetRemaining,
      formation: teamData.formation,
      players: playersWithDetails,
      captainId: teamData.captainId,
      totalPoints: teamData.totalPoints || 0,
      gameweekPoints: teamData.gameweekPoints || 0,
      rank: teamData.rank || 0,
      weeklyRank: teamData.weeklyRank || 0,
      transfers: teamData.transfers || 2,
      wildcardUsed: teamData.wildcardUsed || false,
      badges: teamData.badges || [],
      createdAt: teamData.createdAt,
      updatedAt: teamData.updatedAt
    }

    console.log(`✅ Équipe Fantasy récupérée: ${team.teamName} (ID: ${team.id}) pour l'utilisateur ${userId}`)

    return NextResponse.json({
      success: true,
      team
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'équipe Fantasy:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la récupération de l\'équipe',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
