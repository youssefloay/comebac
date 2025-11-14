import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

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

    // Récupérer la gameweek active actuelle
    const currentGameweekSnapshot = await adminDb
      .collection('fantasy_gameweeks')
      .where('isActive', '==', true)
      .get()

    let nextGameweekNumber = 1
    let startDate = new Date()

    if (!currentGameweekSnapshot.empty) {
      const currentGameweek = currentGameweekSnapshot.docs[0]
      const currentData = currentGameweek.data()
      nextGameweekNumber = currentData.number + 1

      // Clôturer la gameweek actuelle
      await currentGameweek.ref.update({
        isActive: false,
        isCompleted: true,
        updatedAt: new Date()
      })

      // La nouvelle gameweek commence à la fin de l'ancienne
      startDate = currentData.endDate.toDate()
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
        updatedAt: new Date()
      })
    })

    await Promise.all(teamUpdatePromises)

    // Réinitialiser les points hebdomadaires des joueurs dans les stats Fantasy
    const statsSnapshot = await adminDb.collection('player_fantasy_stats').get()
    const statsUpdatePromises = statsSnapshot.docs.map(doc => {
      return doc.ref.update({
        gameweekPoints: 0,
        updatedAt: new Date()
      })
    })

    await Promise.all(statsUpdatePromises)

    // Créer la nouvelle gameweek
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)
    
    const deadline = new Date(startDate)
    deadline.setHours(deadline.getHours() - 2)

    await adminDb.collection('fantasy_gameweeks').add({
      number: nextGameweekNumber,
      startDate,
      endDate,
      deadline,
      isActive: true,
      isCompleted: false,
      createdAt: new Date()
    })

    // Envoyer des notifications de deadline à tous les utilisateurs
    const notificationPromises = teamsSnapshot.docs.map(doc => {
      const team = doc.data()
      const hoursRemaining = Math.round((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60))

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
        createdAt: new Date()
      })
    })

    await Promise.all(notificationPromises)

    return NextResponse.json({
      success: true,
      message: `✅ Gameweek ${nextGameweekNumber} démarrée: ${teamsSnapshot.size} équipes mises à jour, ${notificationPromises.length} notifications envoyées`
    })
  } catch (error) {
    console.error('Erreur lors du démarrage de la gameweek:', error)
    return NextResponse.json(
      { error: 'Erreur lors du démarrage de la gameweek' },
      { status: 500 }
    )
  }
}
