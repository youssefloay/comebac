import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function GET() {
  try {
    const playersSnap = await getDocs(collection(db, 'players'))
    const players = playersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Créer le CSV
    const headers = [
      'ID',
      'Prénom',
      'Nom',
      'Email',
      'Téléphone',
      'Équipe ID',
      'Nom Équipe',
      'Numéro',
      'Position',
      'Date de naissance',
      'Âge',
      'Taille (cm)',
      'Pied',
      'Capitaine',
      'Coach Intérimaire',
      'École',
      'Classe',
      'Surnom',
      'Taille T-shirt'
    ]

    const rows = players.map(player => [
      player.id || '',
      player.firstName || '',
      player.lastName || '',
      player.email || '',
      player.phone || '',
      player.teamId || '',
      player.teamName || '',
      player.number || player.jerseyNumber || '',
      player.position || '',
      player.birthDate || '',
      player.age || '',
      player.height || '',
      player.strongFoot || player.foot || '',
      player.isCaptain ? 'Oui' : 'Non',
      player.isActingCoach ? 'Oui' : 'Non',
      player.school || '',
      player.grade || '',
      player.nickname || '',
      player.tshirtSize || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="joueurs_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error: any) {
    console.error('Erreur export joueurs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export', details: error.message },
      { status: 500 }
    )
  }
}

