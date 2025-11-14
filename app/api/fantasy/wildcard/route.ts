import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { 
  validateFantasyTeam
} from '@/lib/fantasy/validation'
import type { 
  Formation,
  FantasyPlayer
} from '@/lib/types/fantasy'

/**
 * POST - Utiliser le Wildcard pour refaire complètement son équipe
 * 
 * Body:
 * - teamId: string (required)
 * - userId: string (required)
 * - formation: Formation (required, peut être différente de l'actuelle)
 * - players: FantasyPlayer[] (required, 7 nouveaux joueurs)
 * - captainId: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId, userId, formation, players, captainId } = body

    // Validation des champs requis
    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId est requis' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      )
    }

    if (!formation) {
      return NextResponse.json(
        { error: 'formation est requise' },
        { status: 400 }
      )
    }

    if (!players || !Array.isArray(players)) {
      return NextResponse.json(
        { error: 'players est requis et doit être un tableau' },
        { status: 400 }
      )
    }

    if (!captainId) {
      return NextResponse.json(
        { error: 'captainId est requis' },
        { status: 400 }
      )
    }

    // Récupérer l'équipe Fantasy existante
    const teamRef = adminDb.collection('fantasy_teams').doc(teamId)
    const teamDoc = await teamRef.get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { error: 'Équipe Fantasy non trouvée' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()

    // Vérifier que l'équipe appartient bien à l'utilisateur
    if (teamData?.userId !== userId) {
      return NextResponse.json(
        { error: 'Cette équipe ne vous appartient pas' },
        { status: 403 }
      )
    }

    // Vérifier que le Wildcard n'a pas déjà été utilisé
    if (teamData?.wildcardUsed === true) {
      return NextResponse.json(
        { error: 'Vous avez déjà utilisé votre Wildcard cette saison' },
        { status: 400 }
      )
    }

    // Valider la nouvelle équipe complète (nom, formation, composition, budget)
    const teamName = teamData?.teamName || 'Mon Équipe'
    const budget = teamData?.budget || 100
    
    const validation = validateFantasyTeam(teamName, players, formation, budget)
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation de la nouvelle équipe échouée',
          errors: validation.errors 
        },
        { status: 400 }
      )
    }

    // Vérifier que le capitaine est bien dans la nouvelle équipe
    const captainPlayer = players.find(p => p.playerId === captainId)
    if (!captainPlayer) {
      return NextResponse.json(
        { error: 'Le capitaine doit être un joueur de votre équipe' },
        { status: 400 }
      )
    }

    // Calculer le nouveau budget restant
    const totalCost = players.reduce((sum, player) => sum + player.price, 0)
    const budgetRemaining = budget - totalCost

    // Mettre à jour l'équipe avec la nouvelle composition et marquer le Wildcard comme utilisé
    const now = Timestamp.now()
    const updatedData = {
      formation,
      players: players.map(player => ({
        ...player,
        points: player.points || 0,
        gameweekPoints: player.gameweekPoints || 0,
        isCaptain: player.playerId === captainId
      })),
      captainId,
      budgetRemaining,
      wildcardUsed: true,
      transfers: 2, // Réinitialiser les transferts gratuits
      updatedAt: now
    }

    await teamRef.update(updatedData)

    console.log(`✅ Wildcard utilisé pour l'équipe ${teamId} (utilisateur: ${userId})`)

    // Retourner l'équipe mise à jour
    const updatedTeam = {
      id: teamId,
      ...teamData,
      ...updatedData
    }

    return NextResponse.json({
      success: true,
      message: 'Wildcard utilisé avec succès. Votre équipe a été complètement refaite !',
      team: updatedTeam
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur lors de l\'utilisation du Wildcard:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de l\'utilisation du Wildcard',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Vérifier la disponibilité du Wildcard pour une équipe
 * 
 * Query params:
 * - teamId: string (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId est requis' },
        { status: 400 }
      )
    }

    // Récupérer l'équipe Fantasy
    const teamDoc = await adminDb
      .collection('fantasy_teams')
      .doc(teamId)
      .get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { error: 'Équipe Fantasy non trouvée' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()
    const wildcardUsed = teamData?.wildcardUsed || false

    return NextResponse.json({
      success: true,
      wildcardAvailable: !wildcardUsed,
      wildcardUsed
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du Wildcard:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la vérification du Wildcard',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
