import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function GET() {
  try {
    const resultsSnap = await getDocs(collection(db, 'matchResults'))
    const results = resultsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Créer le CSV
    const headers = [
      'ID',
      'Match ID',
      'Équipe Domicile',
      'Équipe Extérieur',
      'Score Domicile',
      'Score Extérieur',
      'Buts Domicile',
      'Buts Extérieur',
      'Date',
      'Statut'
    ]

    const rows = results.map(result => {
      const homeGoalScorers = result.homeGoalScorers?.map((g: any) => g.playerName || g).join('; ') || ''
      const awayGoalScorers = result.awayGoalScorers?.map((g: any) => g.playerName || g).join('; ') || ''
      
      return [
        result.id || '',
        result.matchId || '',
        result.homeTeamName || '',
        result.awayTeamName || '',
        result.homeTeamScore || result.homeScore || '',
        result.awayTeamScore || result.awayScore || '',
        homeGoalScorers,
        awayGoalScorers,
        result.date?.toDate?.()?.toISOString() || result.date || '',
        result.status || 'completed'
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="resultats_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error: any) {
    console.error('Erreur export résultats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export', details: error.message },
      { status: 500 }
    )
  }
}

