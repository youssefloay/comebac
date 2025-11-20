import { NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

interface AuthMeta {
  lastSignIn: string | null
  createdAt: string | null
  emailVerified: boolean
}

async function getAllAuthUsers() {
  const users = []
  let pageToken: string | undefined

  do {
    const result = await adminAuth.listUsers(1000, pageToken)
    users.push(...result.users)
    pageToken = result.pageToken
  } while (pageToken)

  return users
}

export async function GET() {
  try {
    // Récupérer toutes les équipes
    const teamsSnap = await adminDb.collection('teams').get()
    
    // Récupérer tous les utilisateurs Auth avec pagination
    const authUsers = await getAllAuthUsers()
    const authByEmail = new Map<string, AuthMeta>()
    const authByUid = new Map<string, AuthMeta>()

    authUsers.forEach(user => {
      const meta: AuthMeta = {
        lastSignIn: user.metadata.lastSignInTime || null,
        createdAt: user.metadata.creationTime || null,
        emailVerified: user.emailVerified
      }
      const normalizedEmail = user.email?.trim().toLowerCase()
      if (normalizedEmail) {
        authByEmail.set(normalizedEmail, meta)
      }
      authByUid.set(user.uid, meta)
    })

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
        const normalizedEmail = data.email?.trim().toLowerCase()
        const authData = (data.uid ? authByUid.get(data.uid) : undefined) 
          || (normalizedEmail ? authByEmail.get(normalizedEmail) : undefined)

        return {
          id: doc.id,
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          hasAccount: !!authData,
          lastSignIn: authData?.lastSignIn || null,
          emailVerified: authData?.emailVerified || false,
          createdAt: authData?.createdAt || null,
          lastResendDate: data.lastResendDate || null,
          isActingCoach: data.isActingCoach || false
        }
      })

      const coachesSnap = await adminDb
        .collection('coachAccounts')
        .where('teamId', '==', teamDoc.id)
        .get()

      const coaches = coachesSnap.docs.map(doc => {
        const data = doc.data()
        const normalizedEmail = data.email?.trim().toLowerCase()
        const authData = (data.uid ? authByUid.get(data.uid) : undefined)
          || (normalizedEmail ? authByEmail.get(normalizedEmail) : undefined)

        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email

        return {
          id: doc.id,
          uid: data.uid || null,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          name: fullName,
          hasAccount: !!authData,
          lastSignIn: authData?.lastSignIn || null,
          emailVerified: authData?.emailVerified ?? false,
          createdAt: authData?.createdAt || null,
          lastResendDate: data.lastResendDate || null
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
        coaches,
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
