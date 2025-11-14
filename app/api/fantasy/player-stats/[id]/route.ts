import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { fetchTeamsWithPlayer } from '@/lib/fantasy/firestore-queries'

/**
 * GET - Récupérer les statistiques Fantasy d'un joueur
 * 
 * Params:
 * - id: string (required) - ID du joueur
 * 
 * Returns:
 * - stats: PlayerFantasyStats avec popularité et forme calculées
 * - playerInfo: Informations de base du joueur (nom, photo, équipe, poste)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = params.id

    if (!playerId) {
      return NextResponse.json(
        { error: 'ID du joueur requis' },
        { status: 400 }
      )
    }

    // 1. Récupérer les informations de base du joueur
    const playerDoc = await adminDb.collection('players').doc(playerId).get()

    if (!playerDoc.exists) {
      return NextResponse.json(
        { error: 'Joueur non trouvé' },
        { status: 404 }
      )
    }

    const playerData = playerDoc.data()

    // 2. Récupérer les statistiques Fantasy du joueur
    const fantasyStatsSnapshot = await adminDb
      .collection('player_fantasy_stats')
      .where('playerId', '==', playerId)
      .limit(1)
      .get()

    // Type pour les stats avec Date au lieu de Timestamp (pour la sérialisation)
    interface SerializablePlayerFantasyStats {
      playerId: string
      price: number
      totalPoints: number
      gameweekPoints: number
      popularity: number
      form: number[]
      priceChange: number
      selectedBy: number
      updatedAt: Date
    }

    let fantasyStats: SerializablePlayerFantasyStats

    if (fantasyStatsSnapshot.empty) {
      // Si pas de stats Fantasy, créer des stats par défaut
      console.log(`Aucune stat Fantasy trouvée pour le joueur ${playerId}, création de stats par défaut`)
      
      fantasyStats = {
        playerId,
        price: calculateDefaultPrice(playerData?.position || 'Milieu'),
        totalPoints: 0,
        gameweekPoints: 0,
        popularity: 0,
        form: [],
        priceChange: 0,
        selectedBy: 0,
        updatedAt: new Date()
      }
    } else {
      const statsDoc = fantasyStatsSnapshot.docs[0]
      const statsData = statsDoc.data()
      
      fantasyStats = {
        playerId: statsData.playerId,
        price: statsData.price || 5.0,
        totalPoints: statsData.totalPoints || 0,
        gameweekPoints: statsData.gameweekPoints || 0,
        popularity: statsData.popularity || 0,
        form: statsData.form || [],
        priceChange: statsData.priceChange || 0,
        selectedBy: statsData.selectedBy || 0,
        updatedAt: statsData.updatedAt?.toDate() || new Date()
      }
    }

    // 3. OPTIMIZED: Calculate popularity efficiently
    // Use cached values from player_fantasy_stats if recent (< 1 hour old)
    const statsAge = Date.now() - fantasyStats.updatedAt.getTime()
    const oneHour = 60 * 60 * 1000
    
    if (statsAge > oneHour) {
      // Only recalculate if stats are stale
      const totalTeamsSnapshot = await adminDb.collection('fantasy_teams').count().get()
      const totalTeams = totalTeamsSnapshot.data().count

      if (totalTeams > 0) {
        // OPTIMIZATION: Use optimized query from firestore-queries
        const teamsWithPlayer = await fetchTeamsWithPlayer(playerId)
        
        // Calculate popularity percentage
        fantasyStats.popularity = Math.round((teamsWithPlayer.length / totalTeams) * 100)
        fantasyStats.selectedBy = teamsWithPlayer.length
        
        // Update the cached stats in background (don't block response)
        updatePlayerPopularityInBackground(playerId, fantasyStats.popularity, fantasyStats.selectedBy)
      }
    }
    // else: use cached popularity values from fantasyStats

    // 4. Calculer la forme récente (moyenne des 5 derniers matchs)
    const recentForm = fantasyStats.form.slice(-5)
    const formAverage = recentForm.length > 0
      ? recentForm.reduce((sum, points) => sum + points, 0) / recentForm.length
      : 0

    // 5. Récupérer les informations de l'équipe réelle
    let teamInfo = null
    if (playerData?.teamId) {
      const teamDoc = await adminDb.collection('teams').doc(playerData.teamId).get()
      if (teamDoc.exists) {
        const teamData = teamDoc.data()
        teamInfo = {
          id: teamDoc.id,
          name: teamData?.name || 'Équipe inconnue',
          logo: teamData?.logo || null,
          color: teamData?.color || null
        }
      }
    }

    // 6. Construire la réponse avec toutes les informations
    const response = {
      stats: fantasyStats,
      playerInfo: {
        id: playerDoc.id,
        name: playerData?.name || 'Joueur inconnu',
        photo: playerData?.photo || null,
        position: playerData?.position || 'Milieu',
        number: playerData?.number || null,
        school: playerData?.school || null,
        isCaptain: playerData?.isCaptain || false,
        teamId: playerData?.teamId || null,
        teamName: teamInfo?.name || null,
        teamLogo: teamInfo?.logo || null,
        teamColor: teamInfo?.color || null,
        seasonStats: playerData?.seasonStats || {
          goals: 0,
          assists: 0,
          matches: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0
        }
      },
      formAverage: Math.round(formAverage * 10) / 10,
      priceDirection: fantasyStats.priceChange > 0 ? 'up' : 
                      fantasyStats.priceChange < 0 ? 'down' : 'stable'
    }

    console.log(`✅ Stats Fantasy récupérées pour ${response.playerInfo.name} (${playerId})`)
    console.log(`   Prix: ${fantasyStats.price}M€, Popularité: ${fantasyStats.popularity}%, Forme: ${formAverage.toFixed(1)}`)

    return NextResponse.json({
      success: true,
      ...response
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stats Fantasy du joueur:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la récupération des statistiques',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * Calcule un prix par défaut basé sur la position
 */
function calculateDefaultPrice(position: string): number {
  const basePrices: Record<string, number> = {
    'Gardien': 4.5,
    'Défenseur': 5.0,
    'Milieu': 6.0,
    'Attaquant': 7.0
  }
  
  return basePrices[position] || 5.0
}

/**
 * Update player popularity in background without blocking response
 * OPTIMIZATION: Cache popularity values to avoid recalculating on every request
 */
async function updatePlayerPopularityInBackground(
  playerId: string,
  popularity: number,
  selectedBy: number
) {
  try {
    const statsRef = adminDb.collection('player_fantasy_stats')
    const snapshot = await statsRef.where('playerId', '==', playerId).limit(1).get()
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref
      await docRef.update({
        popularity,
        selectedBy,
        updatedAt: new Date()
      })
      console.log(`✅ Popularité mise à jour pour le joueur ${playerId}: ${popularity}%`)
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la popularité:', error)
    // Don't propagate error as this is a background operation
  }
}
