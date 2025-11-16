import { NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

export async function GET() {
  try {
    // Récupérer toutes les équipes
    const teamsSnap = await adminDb.collection('teams').get()
    
    // Récupérer tous les utilisateurs Auth
    const authUsers = await adminAuth.listUsers()
    const authUsersMap = new Map(
      authUsers.users.map(u => [u.email?.toLowerCase(), {
        lastSignIn: u.metadata.lastSignInTime,
        createdAt: u.metadata.creationTime,
        emailVerified: u.emailVerified
      }])
    )

    const teams = []

    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      
      // Récupérer les joueurs de cette équipe
      const playersSnap = await adminDb
        .collection('playerAccounts')
        .where('teamId', '==', teamDoc.id)
        .get()

      const players = playersSnap.docs.map(doc => {
        const data = doc.data()
        const email = data.email?.toLowerCase()
        const authData = authUsersMap.get(email)

        return {
          id: doc.id,
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          hasAccount: !!authData,
          lastSignIn: authData?.lastSignIn || null,
          emailVerified: authData?.emailVerified || false,
          createdAt: authData?.createdAt || null
        }
      })

      // Trier: jamais connectés d'abord, puis par nom
      players.sort((a, b) => {
        if (!a.hasAccount && b.hasAccount) return -1
        if (a.hasAccount && !b.hasAccount) return 1
        if (a.hasAccount && !a.lastSignIn && b.lastSignIn) return -1
        if (a.lastSignIn && b.hasAccount && !b.lastSignIn) return 1
        return a.name.localeCompare(b.name)
      })

      const connectedCount = players.filter(p => p.hasAccount && p.lastSignIn).length
      const neverConnectedCount = players.filter(p => p.hasAccount && !p.lastSignIn).length
      const noAccountCount = players.filter(p => !p.hasAccount).length

      teams.push({
        id: teamDoc.id,
        name: teamData.name,
        players,
        connectedCount,
        neverConnectedCount,
        noAccountCount
      })
    }

    // Trier les équipes par nombre de jamais connectés (décroissant)
    teams.sort((a, b) => b.neverConnectedCount - a.neverConnectedCount)

    return NextResponse.json({ teams })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
