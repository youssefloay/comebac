import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { calculateInitialPrice } from '@/lib/fantasy/player-pricing'
import type { Player } from '@/lib/types'

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

    // Récupérer tous les joueurs
    const playersSnapshot = await adminDb.collection('players').get()
    const players = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Player[]

    if (players.length === 0) {
      return NextResponse.json(
        { error: 'Aucun joueur trouvé dans la base de données' },
        { status: 400 }
      )
    }

    let createdCount = 0
    let skippedCount = 0

    // Créer les stats Fantasy pour chaque joueur
    for (const player of players) {
      // Vérifier si les stats existent déjà
      const existingStats = await adminDb
        .collection('player_fantasy_stats')
        .where('playerId', '==', player.id)
        .get()

      if (!existingStats.empty) {
        skippedCount++
        continue
      }

      // Calculer le prix initial
      const price = calculateInitialPrice(player)

      // Créer les stats Fantasy
      await adminDb.collection('player_fantasy_stats').add({
        playerId: player.id,
        price,
        totalPoints: 0,
        gameweekPoints: 0,
        popularity: 0,
        form: [],
        priceChange: 0,
        selectedBy: 0,
        updatedAt: new Date()
      })

      createdCount++
    }

    // Vérifier si une gameweek existe déjà
    const gameweeksSnapshot = await adminDb
      .collection('fantasy_gameweeks')
      .where('number', '==', 1)
      .get()

    let gameweekMessage = ''
    if (gameweeksSnapshot.empty) {
      // Créer la première gameweek
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 7)
      
      const deadline = new Date(startDate)
      deadline.setHours(deadline.getHours() - 2)

      await adminDb.collection('fantasy_gameweeks').add({
        number: 1,
        startDate,
        endDate,
        deadline,
        isActive: true,
        isCompleted: false,
        createdAt: new Date()
      })

      gameweekMessage = ' Gameweek 1 créée.'
    } else {
      gameweekMessage = ' Gameweek 1 existe déjà.'
    }

    return NextResponse.json({
      success: true,
      message: `✅ Initialisation terminée: ${createdCount} stats créées, ${skippedCount} ignorées.${gameweekMessage}`
    })
  } catch (error) {
    console.error('Erreur lors de l\'initialisation Fantasy:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation' },
      { status: 500 }
    )
  }
}
