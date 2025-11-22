import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, deleteDoc, Timestamp } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deleteFinals = true, isTest = false } = body

    // Récupérer les matchs de qualification Mini-League
    const qualificationQuery = query(
      collection(db, 'matches'),
      where('tournamentMode', '==', 'MINI_LEAGUE'),
      where('isFinal', '==', false),
      where('isTest', '==', isTest)
    )
    const qualificationSnapshot = await getDocs(qualificationQuery)

    // Récupérer les finales si demandé
    let finalsSnapshot: any = { docs: [] }
    if (deleteFinals) {
      const finalsQuery = query(
        collection(db, 'matches'),
        where('tournamentMode', '==', 'MINI_LEAGUE'),
        where('isFinal', '==', true),
        where('isTest', '==', isTest)
      )
      finalsSnapshot = await getDocs(finalsQuery)
    }

    const allMatches = [
      ...qualificationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...finalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ]

    if (allMatches.length === 0) {
      return NextResponse.json({ 
        message: 'Aucun match Mini-League trouvé à supprimer' 
      })
    }

    // Récupérer les IDs des matchs pour supprimer les résultats associés
    const matchIds = allMatches.map(m => m.id)

    // Supprimer les résultats de matchs associés
    const resultsSnapshot = await getDocs(collection(db, 'matchResults'))
    const resultsToDelete = resultsSnapshot.docs.filter(doc => {
      const result = doc.data()
      return matchIds.includes(result.matchId)
    })

    let deletedMatches = 0
    let deletedResults = 0

    // Supprimer les matchs
    for (const matchDoc of [...qualificationSnapshot.docs, ...finalsSnapshot.docs]) {
      try {
        await deleteDoc(doc(db, 'matches', matchDoc.id))
        deletedMatches++
      } catch (error) {
        console.error(`Error deleting match ${matchDoc.id}:`, error)
      }
    }

    // Supprimer les résultats associés
    for (const resultDoc of resultsToDelete) {
      try {
        await deleteDoc(doc(db, 'matchResults', resultDoc.id))
        deletedResults++
      } catch (error) {
        console.error(`Error deleting result ${resultDoc.id}:`, error)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `${deletedMatches} match(s) et ${deletedResults} résultat(s) supprimé(s) avec succès`,
      deletedMatches,
      deletedResults,
      deletedFinals: deleteFinals
    })
  } catch (error: any) {
    console.error('Error deleting Mini-League matches:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to delete matches' 
    }, { status: 500 })
  }
}

