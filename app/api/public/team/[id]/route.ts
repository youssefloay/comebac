import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// Cache simple en mémoire
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 60 * 1000 // 1 minute

async function getCachedData(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key)
  const now = Date.now()
  
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  const data = await fetcher()
  cache.set(key, { data, timestamp: now })
  return data
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!adminDb) {
      console.error('❌ adminDb is not initialized')
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    // Gérer params qui peut être une Promise dans Next.js 16
    const resolvedParams = params instanceof Promise ? await params : params
    const teamId = resolvedParams.id

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const data = await getCachedData(`team-${teamId}`, async () => {
      if (!adminDb) {
        throw new Error('Database not initialized')
      }
      
      // Charger uniquement les données nécessaires pour cette équipe
      const [teamDoc, playersSnap, playerAccountsSnap, coachAccountsSnap, homeMatchesSnap, awayMatchesSnap, resultsSnap, statsSnap] = await Promise.all([
        adminDb.collection('teams').doc(teamId).get(),
        adminDb.collection('players')
          .where('teamId', '==', teamId)
          .limit(50) // Limiter à 50 joueurs
          .get(),
        adminDb.collection('playerAccounts')
          .where('teamId', '==', teamId)
          .limit(50)
          .get(),
        adminDb.collection('coachAccounts')
          .where('teamId', '==', teamId)
          .get(),
        adminDb.collection('matches')
          .where('homeTeamId', '==', teamId)
          .limit(50)
          .get(),
        adminDb.collection('matches')
          .where('awayTeamId', '==', teamId)
          .limit(50)
          .get(),
        adminDb.collection('matchResults')
          .limit(200) // Limiter les résultats
          .get(),
        adminDb.collection('teamStatistics')
          .where('teamId', '==', teamId)
          .limit(1)
          .get()
      ])
      
      // Combiner les matchs home et away
      const matchesSnap = [...homeMatchesSnap.docs, ...awayMatchesSnap.docs]

      if (!teamDoc.exists) {
        return null
      }

      const teamData = { id: teamDoc.id, ...teamDoc.data() }

      // Si le coach n'est pas rempli, chercher dans coachAccounts
      if (!teamData.coach || !teamData.coach.firstName) {
        const coachSnap = coachAccountsSnap.docs[0]
        if (coachSnap) {
          const coachData = coachSnap.data()
          teamData.coach = {
            firstName: coachData.firstName || '',
            lastName: coachData.lastName || '',
            birthDate: coachData.birthDate || '',
            email: coachData.email || '',
            phone: coachData.phone || ''
          }
        }
      }

      // Charger uniquement les équipes nécessaires pour les matchs
      const teamIds = new Set<string>()
      matchesSnap.forEach(doc => {
        const data = doc.data()
        if (data.homeTeamId) teamIds.add(data.homeTeamId)
        if (data.awayTeamId) teamIds.add(data.awayTeamId)
      })

      const teamsSnap = await Promise.all(
        Array.from(teamIds).map(id => adminDb.collection('teams').doc(id).get())
      )

      const teamsMap = new Map()
      teamsSnap.forEach(doc => {
        if (doc.exists) {
          teamsMap.set(doc.id, { id: doc.id, ...doc.data() })
        }
      })

      // Filtrer les joueurs (exclure les entraîneurs)
      const allPlayersData = playersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const allPlayerAccounts = playerAccountsSnap.docs.map(doc => doc.data())
      const allCoachAccounts = coachAccountsSnap.docs.map(doc => doc.data())
      const coachEmails = new Set(allCoachAccounts.map((coach: any) => coach.email))
      const actingCoachEmails = new Set(
        allPlayerAccounts
          .filter((account: any) => account.isActingCoach === true)
          .map((account: any) => account.email)
      )

      const playersData = allPlayersData
        .filter((player: any) => {
          const playerEmail = player.email
          const isCoach = 
            player.isCoach === true || 
            player.position?.toLowerCase().includes('entraîneur') ||
            player.position?.toLowerCase().includes('entraineur') ||
            player.position?.toLowerCase().includes('coach') ||
            (playerEmail && coachEmails.has(playerEmail)) ||
            (playerEmail && actingCoachEmails.has(playerEmail))
          return !isCoach
        })
        .sort((a: any, b: any) => (a.number || 0) - (b.number || 0))

      // Traiter les matchs
      const teamMatches = matchesSnap.map((doc: any) => {
        const data = doc.data()
        const dateValue = data.date
        let dateISO: string
        if (dateValue?.toDate) {
          dateISO = dateValue.toDate().toISOString()
        } else if (dateValue instanceof Date) {
          dateISO = dateValue.toISOString()
        } else if (typeof dateValue === 'string') {
          dateISO = dateValue
        } else {
          dateISO = new Date().toISOString()
        }
        return {
          id: doc.id,
          ...data,
          date: dateISO,
          homeTeam: teamsMap.get(data.homeTeamId),
          awayTeam: teamsMap.get(data.awayTeamId)
        }
      })

      const resultsMap = new Map()
      resultsSnap.docs.forEach(doc => {
        const result = doc.data()
        resultsMap.set(result.matchId, result)
      })

      const matchesWithResults = teamMatches.map(match => ({
        ...match,
        result: resultsMap.get(match.id)
      }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const teamStats = statsSnap.docs.length > 0
        ? { id: statsSnap.docs[0].id, ...statsSnap.docs[0].data() }
        : null

      return {
        team: teamData,
        players: playersData,
        matches: matchesWithResults,
        teamStats
      }
    })

    if (!data) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60'
      }
    })
  } catch (error: any) {
    console.error('❌ Erreur API public/team:', error)
    console.error('Détails:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch team data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

