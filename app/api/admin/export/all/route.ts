import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function GET() {
  try {
    const [teamsSnap, playersSnap, matchesSnap, resultsSnap] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'players')),
      getDocs(collection(db, 'matches')),
      getDocs(collection(db, 'matchResults'))
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      teams: teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      players: playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      matches: matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      results: resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      summary: {
        totalTeams: teamsSnap.size,
        totalPlayers: playersSnap.size,
        totalMatches: matchesSnap.size,
        totalResults: resultsSnap.size
      }
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_complet_${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error: any) {
    console.error('Erreur export complet:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export', details: error.message },
      { status: 500 }
    )
  }
}

