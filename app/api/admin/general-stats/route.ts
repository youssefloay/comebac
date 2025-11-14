import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getAuth } from 'firebase-admin/auth'

export async function GET() {
  try {
    const auth = getAuth()

    // 1. Statistiques des équipes
    const teamsSnapshot = await adminDb.collection('teams').get()
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

    // 2. Statistiques des joueurs
    const playersSnapshot = await adminDb.collection('players').get()
    const players = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

    // 3. Statistiques des comptes joueurs
    const playerAccountsSnapshot = await adminDb.collection('playerAccounts').get()
    const playerAccounts = playerAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

    // 4. Statistiques des coaches
    const coachAccountsSnapshot = await adminDb.collection('coachAccounts').get()
    const coachAccounts = coachAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

    // 5. Statistiques des matchs
    const matchesSnapshot = await adminDb.collection('matches').get()
    const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

    // 6. Statistiques des inscriptions
    const registrationsSnapshot = await adminDb.collection('teamRegistrations').get()
    const registrations = registrationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

    // 7. Statistiques Firebase Auth
    let totalAuthUsers = 0
    let verifiedUsers = 0
    let usersWithLastSignIn = 0
    
    try {
      const listUsersResult = await auth.listUsers(1000)
      totalAuthUsers = listUsersResult.users.length
      verifiedUsers = listUsersResult.users.filter(u => u.emailVerified).length
      usersWithLastSignIn = listUsersResult.users.filter(u => u.metadata.lastSignInTime).length
    } catch (authError) {
      console.error('Erreur récupération users Auth:', authError)
    }

    // Calculs
    const pendingRegistrations = registrations.filter(r => r.status === 'pending').length
    const approvedRegistrations = registrations.filter(r => r.status === 'approved').length
    const rejectedRegistrations = registrations.filter(r => r.status === 'rejected').length

    const playedMatches = matches.filter(m => m.status === 'completed').length
    const upcomingMatches = matches.filter(m => m.status === 'scheduled').length

    const captains = players.filter(p => p.isCaptain).length
    const actingCoaches = playerAccounts.filter(p => p.isActingCoach).length

    // Statistiques par équipe
    const teamStats = teams.map(team => {
      const teamPlayers = players.filter(p => p.teamId === team.id)
      const teamMatches = matches.filter(m => 
        m.homeTeamId === team.id || m.awayTeamId === team.id
      )
      const teamCoach = coachAccounts.find(c => c.teamId === team.id)

      return {
        id: team.id,
        name: team.name,
        playersCount: teamPlayers.length,
        matchesCount: teamMatches.length,
        hasCoach: !!teamCoach,
        captain: teamPlayers.find(p => p.isCaptain)?.name || 'N/A'
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        teams: {
          total: teams.length,
          withCoach: teams.filter(t => coachAccounts.some(c => c.teamId === t.id)).length,
          withoutCoach: teams.filter(t => !coachAccounts.some(c => c.teamId === t.id)).length
        },
        players: {
          total: players.length,
          captains,
          actingCoaches,
          withAccounts: playerAccounts.length
        },
        coaches: {
          total: coachAccounts.length
        },
        matches: {
          total: matches.length,
          played: playedMatches,
          upcoming: upcomingMatches
        },
        registrations: {
          total: registrations.length,
          pending: pendingRegistrations,
          approved: approvedRegistrations,
          rejected: rejectedRegistrations
        },
        auth: {
          totalUsers: totalAuthUsers,
          verified: verifiedUsers,
          withLastSignIn: usersWithLastSignIn,
          neverLoggedIn: totalAuthUsers - usersWithLastSignIn
        }
      },
      teamStats
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
