import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function GET() {
  try {
    const matchesSnap = await getDocs(collection(db, 'matches'))
    const matches = matchesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Créer le CSV
    const headers = [
      'ID',
      'Équipe Domicile',
      'Équipe Extérieur',
      'Date',
      'Heure',
      'Statut',
      'Lieu',
      'Score Domicile',
      'Score Extérieur'
    ]

    const rows = matches.map(match => {
      const date = match.date?.toDate?.() || match.date
      return [
        match.id || '',
        match.homeTeamName || '',
        match.awayTeamName || '',
        date ? (date instanceof Date ? date.toISOString().split('T')[0] : date) : '',
        date ? (date instanceof Date ? date.toTimeString().split(' ')[0] : '') : '',
        match.status || 'scheduled',
        match.location || match.venue || '',
        match.homeScore || '',
        match.awayScore || ''
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="matchs_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error: any) {
    console.error('Erreur export matchs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export', details: error.message },
      { status: 500 }
    )
  }
}

