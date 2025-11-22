import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { isTest = false } = body

    // Récupérer les finales non publiées
    const finalsQuery = query(
      collection(db, 'matches'),
      where('tournamentMode', '==', 'MINI_LEAGUE'),
      where('isFinal', '==', true),
      where('isTest', '==', isTest)
    )
    const finalsSnapshot = await getDocs(finalsQuery)

    if (finalsSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Aucune finale trouvée en attente de publication' 
      }, { status: 400 })
    }

    const finals = finalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isPublished: doc.data().isPublished || false
    }))

    // Filtrer les finales non publiées
    const unpublishedFinals = finals.filter(f => !f.isPublished)

    if (unpublishedFinals.length === 0) {
      return NextResponse.json({ 
        message: 'Toutes les finales sont déjà publiées' 
      })
    }

    // Publier toutes les finales en attente
    const updatePromises = unpublishedFinals.map(final =>
      updateDoc(doc(db, 'matches', final.id), {
        isPublished: true,
        updatedAt: Timestamp.now()
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ 
      success: true,
      message: `${unpublishedFinals.length} finale(s) publiée(s) avec succès`,
      publishedCount: unpublishedFinals.length,
      finals: unpublishedFinals.map(f => ({
        id: f.id,
        finalType: f.finalType,
        homeTeamId: f.homeTeamId,
        awayTeamId: f.awayTeamId
      }))
    })
  } catch (error: any) {
    console.error('Error publishing finals:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to publish finals' 
    }, { status: 500 })
  }
}

