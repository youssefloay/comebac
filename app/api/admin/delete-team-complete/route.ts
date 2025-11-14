import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { teamId, teamName } = await request.json()

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID requis' }, { status: 400 })
    }

    console.log(`🗑️ Début de la suppression complète de l'équipe: ${teamName} (${teamId})`)

    const deletionReport = {
      teamId,
      teamName,
      players: [] as any[],
      coaches: [] as any[],
      firebaseAccounts: [] as any[],
      statistics: 0,
      matches: 0,
      results: 0,
      lineups: 0,
      favorites: 0,
      errors: [] as any[]
    }

    // 1. Récupérer et supprimer les joueurs
    console.log('📋 Récupération des joueurs...')
    const playersSnapshot = await adminDb.collection('players')
      .where('teamId', '==', teamId)
      .get()

    for (const playerDoc of playersSnapshot.docs) {
      const playerData = playerDoc.data()
      const playerId = playerDoc.id
      const playerEmail = playerData.email

      try {
        // Supprimer le compte Firebase Auth
        if (playerEmail) {
          try {
            const userRecord = await adminAuth.getUserByEmail(playerEmail)
            await adminAuth.deleteUser(userRecord.uid)
            deletionReport.firebaseAccounts.push({
              type: 'player',
              email: playerEmail,
              uid: userRecord.uid,
              status: 'deleted'
            })
            console.log(`✅ Compte Firebase supprimé: ${playerEmail}`)
          } catch (authError: any) {
            if (authError.code !== 'auth/user-not-found') {
              deletionReport.errors.push({
                type: 'firebase-auth',
                email: playerEmail,
                error: authError.message
              })
              console.log(`⚠️ Erreur suppression compte: ${playerEmail}`)
            }
          }
        }

        // Supprimer le document joueur
        await playerDoc.ref.delete()
        deletionReport.players.push({
          id: playerId,
          name: `${playerData.firstName} ${playerData.lastName}`,
          email: playerEmail,
          status: 'deleted'
        })
        console.log(`✅ Joueur supprimé: ${playerData.firstName} ${playerData.lastName}`)
      } catch (error: any) {
        deletionReport.errors.push({
          type: 'player',
          id: playerId,
          error: error.message
        })
      }
    }

    // 2. Récupérer et supprimer les coaches
    console.log('📋 Récupération des coaches...')
    const coachesSnapshot = await adminDb.collection('coaches')
      .where('teamId', '==', teamId)
      .get()

    for (const coachDoc of coachesSnapshot.docs) {
      const coachData = coachDoc.data()
      const coachId = coachDoc.id
      const coachEmail = coachData.email

      try {
        // Supprimer le compte Firebase Auth
        if (coachEmail) {
          try {
            const userRecord = await adminAuth.getUserByEmail(coachEmail)
            await adminAuth.deleteUser(userRecord.uid)
            deletionReport.firebaseAccounts.push({
              type: 'coach',
              email: coachEmail,
              uid: userRecord.uid,
              status: 'deleted'
            })
            console.log(`✅ Compte Firebase supprimé: ${coachEmail}`)
          } catch (authError: any) {
            if (authError.code !== 'auth/user-not-found') {
              deletionReport.errors.push({
                type: 'firebase-auth',
                email: coachEmail,
                error: authError.message
              })
              console.log(`⚠️ Erreur suppression compte: ${coachEmail}`)
            }
          }
        }

        // Supprimer le document coach
        await coachDoc.ref.delete()
        deletionReport.coaches.push({
          id: coachId,
          name: `${coachData.firstName} ${coachData.lastName}`,
          email: coachEmail,
          status: 'deleted'
        })
        console.log(`✅ Coach supprimé: ${coachData.firstName} ${coachData.lastName}`)
      } catch (error: any) {
        deletionReport.errors.push({
          type: 'coach',
          id: coachId,
          error: error.message
        })
      }
    }

    // 3. Supprimer les statistiques de l'équipe
    console.log('📊 Suppression des statistiques...')
    const statsSnapshot = await adminDb.collection('teamStatistics')
      .where('teamId', '==', teamId)
      .get()
    
    for (const statDoc of statsSnapshot.docs) {
      await statDoc.ref.delete()
      deletionReport.statistics++
    }

    // 4. Supprimer les matchs
    console.log('⚽ Suppression des matchs...')
    const matchesSnapshot = await adminDb.collection('matches').get()
    
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data()
      if (matchData.homeTeamId === teamId || matchData.awayTeamId === teamId) {
        await matchDoc.ref.delete()
        deletionReport.matches++
      }
    }

    // 5. Supprimer les résultats
    console.log('📈 Suppression des résultats...')
    const resultsSnapshot = await adminDb.collection('matchResults').get()
    
    for (const resultDoc of resultsSnapshot.docs) {
      const resultData = resultDoc.data()
      if (resultData.homeTeamId === teamId || resultData.awayTeamId === teamId) {
        await resultDoc.ref.delete()
        deletionReport.results++
      }
    }

    // 6. Supprimer les compositions
    console.log('📝 Suppression des compositions...')
    const lineupsSnapshot = await adminDb.collection('lineups')
      .where('teamId', '==', teamId)
      .get()
    
    for (const lineupDoc of lineupsSnapshot.docs) {
      await lineupDoc.ref.delete()
      deletionReport.lineups++
    }

    // 7. Supprimer les favoris
    console.log('⭐ Suppression des favoris...')
    const favoritesSnapshot = await adminDb.collection('favorites')
      .where('teamId', '==', teamId)
      .get()
    
    for (const favoriteDoc of favoritesSnapshot.docs) {
      await favoriteDoc.ref.delete()
      deletionReport.favorites++
    }

    // 8. Supprimer l'équipe elle-même
    console.log('🏆 Suppression de l\'équipe...')
    await adminDb.collection('teams').doc(teamId).delete()

    console.log('✅ Suppression complète terminée')

    return NextResponse.json({
      success: true,
      message: `Équipe "${teamName}" supprimée complètement`,
      report: deletionReport
    })

  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
