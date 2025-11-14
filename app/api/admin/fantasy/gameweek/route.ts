import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

/**
 * POST - Créer une nouvelle gameweek
 * Body: { startDate?: string }
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
    const { startDate: customStartDate } = body

    // Récupérer la gameweek active actuelle
    const currentGameweekSnapshot = await adminDb
      .collection('fantasy_gameweeks')
      .where('isActive', '==', true)
      .get()

    let nextGameweekNumber = 1
    let startDate = customStartDate ? new Date(customStartDate) : new Date()

    if (!currentGameweekSnapshot.empty) {
      const currentGameweek = currentGameweekSnapshot.docs[0]
      const currentData = currentGameweek.data()
      nextGameweekNumber = currentData.number + 1

      // Calculer le classement hebdomadaire avant de clôturer
      await calculateWeeklyRanking(currentData.number)

      // Clôturer la gameweek actuelle
      await currentGameweek.ref.update({
        isActive: false,
        isCompleted: true,
        updatedAt: Timestamp.now()
      })

      // Si pas de date personnalisée, la nouvelle gameweek commence à la fin de l'ancienne
      if (!customStartDate) {
        startDate = currentData.endDate.toDate()
      }
    }

    // Réinitialiser les transferts gratuits pour toutes les équipes
    const teamsSnapshot = await adminDb.collection('fantasy_teams').get()
    const teamUpdatePromises = teamsSnapshot.docs.map(doc => {
      const team = doc.data()
      
      // Réinitialiser les points hebdomadaires des joueurs
      const updatedPlayers = (team.players || []).map((player: any) => ({
        ...player,
        gameweekPoints: 0
      }))

      return doc.ref.update({
        transfers: 2, // 2 transferts gratuits par gameweek
        gameweekPoints: 0,
        players: updatedPlayers,
        updatedAt: Timestamp.now()
      })
    })

    await Promise.all(teamUpdatePromises)

    // Réinitialiser les points hebdomadaires des joueurs dans les stats Fantasy
    const statsSnapshot = await adminDb.collection('player_fantasy_stats').get()
    const statsUpdatePromises = statsSnapshot.docs.map(doc => {
      return doc.ref.update({
        gameweekPoints: 0,
        updatedAt: Timestamp.now()
      })
    })

    await Promise.all(statsUpdatePromises)

    // Créer la nouvelle gameweek
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)
    
    const deadline = new Date(startDate)
    deadline.setHours(deadline.getHours() - 2)

    const newGameweekRef = await adminDb.collection('fantasy_gameweeks').add({
      number: nextGameweekNumber,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      deadline: Timestamp.fromDate(deadline),
      isActive: true,
      isCompleted: false,
      createdAt: Timestamp.now()
    })

    // Envoyer des notifications de deadline à tous les utilisateurs
    const hoursRemaining = Math.round((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60))
    const notificationPromises = teamsSnapshot.docs.map(doc => {
      const team = doc.data()

      return adminDb.collection('notifications').add({
        userId: team.userId,
        type: 'fantasy_update',
        subType: 'transfer_deadline',
        title: 'Fantasy ComeBac',
        message: `⏰ Nouvelle gameweek ${nextGameweekNumber} ! Deadline de transferts dans ${hoursRemaining}h`,
        link: '/public/fantasy/transfers',
        read: false,
        metadata: {
          gameweek: nextGameweekNumber,
          hoursRemaining,
          deadline: deadline.toISOString()
        },
        createdAt: Timestamp.now()
      })
    })

    await Promise.all(notificationPromises)

    return NextResponse.json({
      success: true,
      message: `✅ Gameweek ${nextGameweekNumber} créée avec succès`,
      data: {
        gameweekId: newGameweekRef.id,
        gameweekNumber: nextGameweekNumber,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        deadline: deadline.toISOString(),
        teamsUpdated: teamsSnapshot.size,
        notificationsSent: notificationPromises.length
      }
    })
  } catch (error) {
    console.error('Erreur lors de la création de la gameweek:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la gameweek' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Clôturer la gameweek active
 */
export async function PATCH(request: NextRequest) {
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

    // Récupérer la gameweek active
    const currentGameweekSnapshot = await adminDb
      .collection('fantasy_gameweeks')
      .where('isActive', '==', true)
      .get()

    if (currentGameweekSnapshot.empty) {
      return NextResponse.json(
        { error: 'Aucune gameweek active trouvée' },
        { status: 404 }
      )
    }

    const currentGameweek = currentGameweekSnapshot.docs[0]
    const currentData = currentGameweek.data()

    // Calculer le classement hebdomadaire
    await calculateWeeklyRanking(currentData.number)

    // Clôturer la gameweek
    await currentGameweek.ref.update({
      isActive: false,
      isCompleted: true,
      updatedAt: Timestamp.now()
    })

    return NextResponse.json({
      success: true,
      message: `✅ Gameweek ${currentData.number} clôturée avec succès`,
      data: {
        gameweekId: currentGameweek.id,
        gameweekNumber: currentData.number
      }
    })
  } catch (error) {
    console.error('Erreur lors de la clôture de la gameweek:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la clôture de la gameweek' },
      { status: 500 }
    )
  }
}

/**
 * GET - Récupérer les informations de la gameweek active
 */
export async function GET(request: NextRequest) {
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

    // Récupérer la gameweek active
    const activeGameweekSnapshot = await adminDb
      .collection('fantasy_gameweeks')
      .where('isActive', '==', true)
      .get()

    // Récupérer toutes les gameweeks pour l'historique
    const allGameweeksSnapshot = await adminDb
      .collection('fantasy_gameweeks')
      .orderBy('number', 'desc')
      .limit(10)
      .get()

    const activeGameweek = activeGameweekSnapshot.empty
      ? null
      : {
          id: activeGameweekSnapshot.docs[0].id,
          ...activeGameweekSnapshot.docs[0].data(),
          startDate: activeGameweekSnapshot.docs[0].data().startDate.toDate().toISOString(),
          endDate: activeGameweekSnapshot.docs[0].data().endDate.toDate().toISOString(),
          deadline: activeGameweekSnapshot.docs[0].data().deadline.toDate().toISOString(),
        }

    const gameweeksHistory = allGameweeksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate.toDate().toISOString(),
      endDate: doc.data().endDate.toDate().toISOString(),
      deadline: doc.data().deadline.toDate().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: {
        activeGameweek,
        gameweeksHistory
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de la gameweek:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la gameweek' },
      { status: 500 }
    )
  }
}

/**
 * Calcule le classement hebdomadaire basé sur les points de la gameweek
 */
async function calculateWeeklyRanking(gameweekNumber: number): Promise<void> {
  const teamsSnapshot = await adminDb.collection('fantasy_teams').get()
  
  if (teamsSnapshot.empty) {
    return
  }
  
  // Récupérer les équipes avec leurs points hebdomadaires
  const teams = teamsSnapshot.docs.map(doc => ({
    id: doc.id,
    gameweekPoints: doc.data().gameweekPoints || 0
  }))
  
  // Trier par points hebdomadaires (décroissant)
  teams.sort((a, b) => b.gameweekPoints - a.gameweekPoints)
  
  // Mettre à jour les rangs hebdomadaires
  const updatePromises = teams.map((team, index) => {
    return adminDb.collection('fantasy_teams').doc(team.id).update({
      weeklyRank: index + 1,
      updatedAt: Timestamp.now()
    })
  })
  
  await Promise.all(updatePromises)
}
