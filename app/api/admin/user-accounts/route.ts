import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getAuth } from 'firebase-admin/auth'

export async function GET() {
  try {
    const auth = getAuth()

    // Récupérer tous les utilisateurs Firebase Auth
    const listUsersResult = await auth.listUsers(1000)
    const authUsers = listUsersResult.users

    // Récupérer les données Firestore
    const [playersSnap, playerAccountsSnap, coachAccountsSnap, teamsSnap] = await Promise.all([
      adminDb.collection('players').get(),
      adminDb.collection('playerAccounts').get(),
      adminDb.collection('coachAccounts').get(),
      adminDb.collection('teams').get()
    ])

    const players = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
    const playerAccounts = playerAccountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
    const coachAccounts = coachAccountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
    const teams = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

    // Construire la liste complète des comptes
    const accounts = authUsers.map(authUser => {
      const email = authUser.email || ''
      
      // Chercher dans playerAccounts
      const playerAccount = playerAccounts.find(pa => pa.email === email)
      const player = players.find(p => p.email === email)
      
      // Chercher dans coachAccounts
      const coachAccount = coachAccounts.find(ca => ca.email === email)
      
      // Déterminer le type et les infos
      let type = 'unknown'
      let name = email
      let teamId: string | null = null
      let teamName = 'N/A'
      let role = 'Utilisateur'
      
      if (playerAccount) {
        type = 'player'
        name = `${playerAccount.firstName} ${playerAccount.lastName}`
        teamId = playerAccount.teamId
        const team = teams.find(t => t.id === teamId)
        teamName = team?.name || 'N/A'
        
        if (playerAccount.isActingCoach) {
          role = 'Joueur / Coach intérimaire'
        } else if (player?.isCaptain) {
          role = 'Joueur / Capitaine'
        } else {
          role = 'Joueur'
        }
      } else if (coachAccount) {
        type = 'coach'
        name = `${coachAccount.firstName} ${coachAccount.lastName}`
        teamId = coachAccount.teamId
        const team = teams.find(t => t.id === teamId)
        teamName = team?.name || 'N/A'
        role = 'Coach'
      } else if (email.includes('admin')) {
        type = 'admin'
        role = 'Admin'
      }

      return {
        uid: authUser.uid,
        email,
        name,
        type,
        role,
        teamId,
        teamName,
        emailVerified: authUser.emailVerified,
        disabled: authUser.disabled,
        createdAt: authUser.metadata.creationTime,
        lastSignIn: authUser.metadata.lastSignInTime || null,
        neverLoggedIn: !authUser.metadata.lastSignInTime,
        photoURL: authUser.photoURL || null
      }
    })

    // Trier par dernière connexion (jamais connectés en premier)
    accounts.sort((a, b) => {
      if (a.neverLoggedIn && !b.neverLoggedIn) return -1
      if (!a.neverLoggedIn && b.neverLoggedIn) return 1
      if (!a.lastSignIn) return 1
      if (!b.lastSignIn) return -1
      return new Date(b.lastSignIn).getTime() - new Date(a.lastSignIn).getTime()
    })

    return NextResponse.json({
      success: true,
      accounts,
      stats: {
        total: accounts.length,
        players: accounts.filter(a => a.type === 'player').length,
        coaches: accounts.filter(a => a.type === 'coach').length,
        admins: accounts.filter(a => a.type === 'admin').length,
        unknown: accounts.filter(a => a.type === 'unknown').length,
        neverLoggedIn: accounts.filter(a => a.neverLoggedIn).length,
        verified: accounts.filter(a => a.emailVerified).length,
        disabled: accounts.filter(a => a.disabled).length
      }
    })
  } catch (error: any) {
    console.error('Erreur récupération comptes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
