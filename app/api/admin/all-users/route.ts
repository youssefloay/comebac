import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export interface UserListItem {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  type: 'player' | 'coach' | 'user'
  teamName?: string
  teamId?: string
}

export async function GET() {
  try {
    const users: UserListItem[] = []

    // Récupérer tous les joueurs
    const playersSnap = await adminDb.collection('playerAccounts').get()
    playersSnap.docs.forEach(doc => {
      const data = doc.data()
      if (data.email) {
        users.push({
          id: doc.id,
          email: data.email,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
          type: 'player',
          teamName: data.teamName,
          teamId: data.teamId
        })
      }
    })

    // Récupérer tous les coaches
    const coachesSnap = await adminDb.collection('coachAccounts').get()
    coachesSnap.docs.forEach(doc => {
      const data = doc.data()
      if (data.email) {
        users.push({
          id: doc.id,
          email: data.email,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
          type: 'coach',
          teamName: data.teamName,
          teamId: data.teamId
        })
      }
    })

    // Récupérer tous les utilisateurs basiques
    const usersSnap = await adminDb.collection('users').get()
    usersSnap.docs.forEach(doc => {
      const data = doc.data()
      if (data.email) {
        const displayName = data.displayName || data.name || data.email
        const nameParts = displayName.split(' ')
        users.push({
          id: doc.id,
          email: data.email,
          firstName: nameParts[0] || data.email,
          lastName: nameParts.slice(1).join(' ') || '',
          name: displayName,
          type: 'user',
          teamName: undefined,
          teamId: undefined
        })
      }
    })

    // Trier par nom
    users.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      success: true,
      users,
      count: users.length
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

