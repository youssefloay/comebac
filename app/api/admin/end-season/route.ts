import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, deleteDoc, Timestamp, writeBatch, doc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { seasonName } = await request.json()
    
    if (!seasonName) {
      return NextResponse.json({ error: 'Le nom de la saison est requis' }, { status: 400 })
    }

    console.log(`🏁 Début de l'archivage de la saison: ${seasonName}`)

    // 1. Récupérer toutes les données actuelles
    const [teamsSnap, playersSnap, matchesSnap, resultsSnap, statsSnap] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'players')),
      getDocs(collection(db, 'matches')),
      getDocs(collection(db, 'matchResults')),
      getDocs(collection(db, 'teamStatistics'))
    ])

    const archiveData = {
      seasonName,
      archivedAt: Timestamp.now(),
      teams: teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      players: playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      matches: matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      matchResults: resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      teamStatistics: statsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      summary: {
        totalTeams: teamsSnap.size,
        totalPlayers: playersSnap.size,
        totalMatches: matchesSnap.size,
        totalResults: resultsSnap.size,
        totalGoals: resultsSnap.docs.reduce((sum, doc) => {
          const data = doc.data()
          return sum + (data.homeTeamScore || 0) + (data.awayTeamScore || 0)
        }, 0)
      }
    }

    // 2. Sauvegarder dans la collection archives
    const archiveRef = await addDoc(collection(db, 'seasonArchives'), archiveData)
    console.log(`✅ Archive créée avec l'ID: ${archiveRef.id}`)

    // 3. Supprimer les données actuelles (sauf les équipes et joueurs)
    console.log('🗑️ Suppression des matchs, résultats et statistiques...')
    
    const batch = writeBatch(db)
    let batchCount = 0
    const maxBatchSize = 500

    // Supprimer les matchs
    for (const docSnap of matchesSnap.docs) {
      batch.delete(docSnap.ref)
      batchCount++
      if (batchCount >= maxBatchSize) {
        await batch.commit()
        batchCount = 0
      }
    }

    // Supprimer les résultats
    for (const docSnap of resultsSnap.docs) {
      batch.delete(docSnap.ref)
      batchCount++
      if (batchCount >= maxBatchSize) {
        await batch.commit()
        batchCount = 0
      }
    }

    // Supprimer les statistiques
    for (const docSnap of statsSnap.docs) {
      batch.delete(docSnap.ref)
      batchCount++
      if (batchCount >= maxBatchSize) {
        await batch.commit()
        batchCount = 0
      }
    }

    if (batchCount > 0) {
      await batch.commit()
    }

    // 4. Réinitialiser les statistiques des joueurs
    console.log('🔄 Réinitialisation des statistiques des joueurs...')
    const playerBatch = writeBatch(db)
    let playerBatchCount = 0

    for (const docSnap of playersSnap.docs) {
      playerBatch.update(docSnap.ref, {
        seasonStats: {
          goals: 0,
          assists: 0,
          matches: 0,
          yellowCards: 0,
          redCards: 0
        },
        updatedAt: Timestamp.now()
      })
      playerBatchCount++
      if (playerBatchCount >= maxBatchSize) {
        await playerBatch.commit()
        playerBatchCount = 0
      }
    }

    if (playerBatchCount > 0) {
      await playerBatch.commit()
    }

    // 5. Créer les nouvelles statistiques d'équipe à zéro
    console.log('📊 Création des nouvelles statistiques d\'équipe...')
    const newStatsPromises = teamsSnap.docs.map(teamDoc =>
      addDoc(collection(db, 'teamStatistics'), {
        teamId: teamDoc.id,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        matchesPlayed: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    )
    await Promise.all(newStatsPromises)

    console.log('✅ Fin de saison terminée avec succès!')

    return NextResponse.json({
      success: true,
      archiveId: archiveRef.id,
      summary: archiveData.summary,
      message: `Saison "${seasonName}" archivée avec succès!`
    })
  } catch (error) {
    console.error('❌ Erreur lors de la fin de saison:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'archivage de la saison',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
