import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { 
  validateFantasyTeam, 
  INITIAL_BUDGET 
} from '@/lib/fantasy/validation'
import type { 
  CreateFantasyTeamData
} from '@/lib/types/fantasy'

/**
 * POST - Créer une nouvelle équipe Fantasy
 * 
 * Body:
 * - userId: string (required)
 * - teamName: string (required, 3-30 caractères)
 * - formation: Formation (required)
 * - players: FantasyPlayer[] (required, 7 joueurs)
 * - captainId: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, teamName, formation, players, captainId } = body as CreateFantasyTeamData

    // Validation des champs requis
    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      )
    }

    if (!teamName) {
      return NextResponse.json(
        { error: 'teamName est requis' },
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

    // Vérifier si l'utilisateur a déjà une équipe Fantasy
    const existingTeamSnapshot = await adminDb
      .collection('fantasy_teams')
      .where('userId', '==', userId)
      .get()

    if (!existingTeamSnapshot.empty) {
      return NextResponse.json(
        { error: 'Vous avez déjà une équipe Fantasy' },
        { status: 400 }
      )
    }

    // Valider l'équipe complète (nom, formation, composition, budget)
    const validation = validateFantasyTeam(teamName, players, formation, INITIAL_BUDGET)
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation échouée',
          errors: validation.errors 
        },
        { status: 400 }
      )
    }

    // Vérifier que le capitaine est bien dans l'équipe
    const captainPlayer = players.find(p => p.playerId === captainId)
    if (!captainPlayer) {
      return NextResponse.json(
        { error: 'Le capitaine doit être un joueur de votre équipe' },
        { status: 400 }
      )
    }

    // Calculer le budget restant
    const totalCost = players.reduce((sum, player) => sum + player.price, 0)
    const budgetRemaining = INITIAL_BUDGET - totalCost

    // Créer l'équipe Fantasy dans Firestore
    const now = Timestamp.now()
    const fantasyTeamData = {
      userId,
      teamName: teamName.trim(),
      budget: INITIAL_BUDGET,
      budgetRemaining,
      formation,
      players: players.map(player => ({
        ...player,
        points: 0,
        gameweekPoints: 0,
        isCaptain: player.playerId === captainId
      })),
      captainId,
      totalPoints: 0,
      gameweekPoints: 0,
      rank: 0,
      weeklyRank: 0,
      transfers: 2, // 2 transferts gratuits par défaut
      wildcardUsed: false,
      badges: [],
      createdAt: now,
      updatedAt: now
    }

    const docRef = await adminDb
      .collection('fantasy_teams')
      .add(fantasyTeamData)

    console.log(`✅ Équipe Fantasy créée: ${teamName} (ID: ${docRef.id}) pour l'utilisateur ${userId}`)

    // Retourner l'équipe créée avec son ID
    const createdTeam = {
      id: docRef.id,
      ...fantasyTeamData
    }

    return NextResponse.json({
      success: true,
      message: 'Équipe Fantasy créée avec succès',
      team: createdTeam
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'équipe Fantasy:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la création de l\'équipe',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
