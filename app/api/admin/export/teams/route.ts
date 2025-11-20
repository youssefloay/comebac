import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function GET() {
  try {
    const teamsSnap = await getDocs(collection(db, 'teams'))
    const teams = teamsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Créer le CSV
    const headers = [
      'ID',
      'Nom',
      'École',
      'Classe',
      'Créé le',
      'Statut',
      'Coach ID',
      'Coach Email',
      'Nombre de joueurs'
    ]

    const rows = teams.map(team => [
      team.id || '',
      team.name || '',
      team.schoolName || team.school || '',
      team.teamGrade || '',
      team.createdAt?.toDate?.()?.toISOString() || team.createdAt || '',
      team.status || 'active',
      team.coachId || '',
      team.coachEmail || '',
      team.players?.length || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="equipes_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error: any) {
    console.error('Erreur export équipes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export', details: error.message },
      { status: 500 }
    )
  }
}

