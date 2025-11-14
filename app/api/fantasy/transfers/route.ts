import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { validateTransfer } from '@/lib/fantasy/validation'
import type { FantasyPlayer } from '@/lib/types/fantasy'

const TRANSFER_PENALTY_POINTS = 4

/**
 * POST - Effectuer un transfert de joueur
 * 
 * Body:
 * - teamId: string (required)
 * - userId: string (required)
 * - playerOutId: string (required) - ID du joueur à remplacer
 * - playerInId: string (required) - ID du nouveau joueur
 * - playerInPrice: number (required) - Prix actuel du nouveau joueur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId, userId, playerOutId, playerInId, playerInPrice } = body

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

    if (!playerOutId) {
      return NextResponse.json(
        { error: 'playerOutId est requis' },
        { status: 400 }
      )
    }

    if (!playerInId) {
      return NextResponse.json(
        { error: 'playerInId est requis' },
        { status: 400 }
      )
    }

    if (typeof playerInPrice !== 'number' || playerInPrice <= 0) {
      return NextResponse.json(
        { error: 'playerInPrice est requis et doit être un nombre positif' },
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

    // Trouver le joueur à remplacer
    const players: FantasyPlayer[] = teamData?.players || []
    const playerOutIndex = players.findIndex(p => p.playerId === playerOutId)

    if (playerOutIndex === -1) {
      return NextResponse.json(
        { error: 'Le joueur à remplacer n\'est pas dans votre équipe' },
        { status: 400 }
      )
    }

    const playerOut = players[playerOutIndex]

    // Vérifier que le nouveau joueur n'est pas déjà dans l'équipe
    if (players.some(p => p.playerId === playerInId)) {
      return NextResponse.json(
        { error: 'Ce joueur est déjà dans votre équipe' },
        { status: 400 }
      )
    }

    // Récupérer les informations du nouveau joueur depuis la collection players
    const playerInDoc = await adminDb.collection('players').doc(playerInId).get()
    
    if (!playerInDoc.exists) {
      return NextResponse.json(
        { error: 'Joueur non trouvé' },
        { status: 404 }
      )
    }

    const playerInData = playerInDoc.data()

    // Créer l'objet FantasyPlayer pour le nouveau joueur
    const playerIn: FantasyPlayer = {
      playerId: playerInId,
      position: playerInData?.position || playerOut.position,
      price: playerInPrice,
      points: 0,
      gameweekPoints: 0,
      isCaptain: playerOut.isCaptain // Conserver le statut de capitaine si applicable
    }

    // Valider le transfert
    const budgetRemaining = teamData?.budgetRemaining || 0
    const validation = validateTransfer(playerOut, playerIn, budgetRemaining)

    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation du transfert échouée',
          errors: validation.errors 
        },
        { status: 400 }
      )
    }

    // Calculer le nouveau budget restant
    const priceDifference = playerIn.price - playerOut.price
    const newBudgetRemaining = budgetRemaining - priceDifference

    // Calculer les pénalités si nécessaire
    const transfersRemaining = teamData?.transfers || 0
    let pointsDeducted = 0
    let newTransfersRemaining = transfersRemaining

    if (transfersRemaining > 0) {
      // Transfert gratuit
      newTransfersRemaining = transfersRemaining - 1
    } else {
      // Pénalité de transfert
      pointsDeducted = TRANSFER_PENALTY_POINTS
    }

    // Remplacer le joueur dans l'équipe
    const updatedPlayers = [...players]
    updatedPlayers[playerOutIndex] = playerIn

    // Si le joueur sortant était capitaine, le nouveau joueur devient capitaine
    const newCaptainId = playerOut.isCaptain ? playerInId : teamData?.captainId

    // Mettre à jour l'équipe
    const now = Timestamp.now()
    const updatedData = {
      players: updatedPlayers,
      captainId: newCaptainId,
      budgetRemaining: newBudgetRemaining,
      transfers: newTransfersRemaining,
      totalPoints: (teamData?.totalPoints || 0) - pointsDeducted,
      updatedAt: now
    }

    await teamRef.update(updatedData)

    console.log(`✅ Transfert effectué pour l'équipe ${teamId}: ${playerOutId} → ${playerInId}`)
    if (pointsDeducted > 0) {
      console.log(`   Pénalité appliquée: -${pointsDeducted} points`)
    }

    // Retourner l'équipe mise à jour
    const updatedTeam = {
      id: teamId,
      ...teamData,
      ...updatedData
    }

    return NextResponse.json({
      success: true,
      message: pointsDeducted > 0 
        ? `Transfert effectué avec une pénalité de ${pointsDeducted} points`
        : 'Transfert effectué avec succès',
      team: updatedTeam,
      pointsDeducted,
      transfersRemaining: newTransfersRemaining
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur lors du transfert:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors du transfert',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
