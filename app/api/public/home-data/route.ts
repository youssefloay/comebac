import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// Cache simple en mémoire (pour le développement)
// En production, utiliser Redis ou Next.js cache
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 secondes (réduit pour tests)

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

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    // Invalider le cache pour forcer la mise à jour
    const cacheKey = 'public-home-v3'
    const data = await getCachedData(cacheKey, async () => {
      // Charger uniquement les données nécessaires avec limites
      const [
        teamsSnap,
        playerAccountsSnap,
        coachAccountsSnap,
        matchesSnap,
        statsSnap,
        resultsSnap
      ] = await Promise.all([
        adminDb.collection('teams').where('isActive', '==', true).limit(50).get(), // Limiter à 50 équipes actives
        adminDb.collection('playerAccounts').limit(500).get(), // Limiter à 500 joueurs
        adminDb.collection('coachAccounts').get(),
        adminDb.collection('matches')
          .orderBy('date', 'desc')
          .limit(100) // Limiter à 100 matchs récents
          .get(),
        adminDb.collection('teamStatistics')
          .orderBy('points', 'desc')
          .limit(20) // Top 20 seulement
          .get(),
        adminDb.collection('matchResults')
          .limit(200) // Limiter à 200 résultats
          .get()
      ])

      const teamsData = teamsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const allPlayerAccounts = playerAccountsSnap.docs.map(doc => doc.data())
      const allCoachAccounts = coachAccountsSnap.docs.map(doc => doc.data())
      const coachEmails = new Set(allCoachAccounts.map((coach: any) => coach.email))

      // Compter les joueurs par équipe (exclure les entraîneurs)
      const teamsWithPlayerCounts = teamsData.map(team => {
        const teamPlayerAccounts = allPlayerAccounts.filter((account: any) => 
          account.teamId === team.id && 
          !coachEmails.has(account.email) && 
          !account.isActingCoach
        )
        return {
          ...team,
          playerCount: teamPlayerAccounts.length
        }
      })

      const teamsMap = new Map()
      teamsData.forEach(team => {
        teamsMap.set(team.id, team)
      })

      const allMatches = matchesSnap.docs.map(doc => {
        const data = doc.data()
        const homeTeam = teamsMap.get(data.homeTeamId)
        const awayTeam = teamsMap.get(data.awayTeamId)
        return {
          id: doc.id,
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          date: data.date?.toDate?.()?.toISOString() || new Date().toISOString(),
          round: data.round || 1,
          status: data.status || 'scheduled',
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          isTest: data.isTest || false
        }
      })

      // Filtrer les matchs de test et les matchs impliquant des équipes inactives
      const publicMatches = allMatches.filter(match => {
        if (match.isTest) return false
        const homeTeam = teamsMap.get(match.homeTeamId)
        const awayTeam = teamsMap.get(match.awayTeamId)
        // Ne garder que les matchs où les deux équipes sont actives
        return homeTeam && homeTeam.isActive !== false && 
               awayTeam && awayTeam.isActive !== false
      })

      const resultsMap = new Map()
      let totalGoals = 0
      resultsSnap.docs.forEach(doc => {
        const result = doc.data()
        resultsMap.set(result.matchId, result)
        totalGoals += (result.homeTeamScore || 0) + (result.awayTeamScore || 0)
      })

      const matchesWithResults = publicMatches.map(match => ({
        ...match,
        result: resultsMap.get(match.id),
        homeTeamScore: resultsMap.get(match.id)?.homeTeamScore,
        awayTeamScore: resultsMap.get(match.id)?.awayTeamScore
      }))

      // Filtrer les matchs par date
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

      const todayMatches = matchesWithResults
        .filter(match => {
          const matchDate = new Date(match.date)
          return matchDate >= todayStart && matchDate < todayEnd
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const upcomingMatches = matchesWithResults
        .filter(match => {
          const matchDate = new Date(match.date)
          return matchDate > todayEnd && match.status === 'scheduled'
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6)

      const recentMatches = matchesWithResults
        .filter(match => match.status === 'completed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6)

      // Standings - Filtrer d'abord par équipes actives
      const activeTeamIds = new Set(teamsData.map(t => t.id))
      const teamStatsMap = new Map()
      statsSnap.docs.forEach(doc => {
        const data = doc.data()
        // Filtrer les équipes inactives AVANT d'ajouter au Map
        if (!activeTeamIds.has(data.teamId)) {
          return
        }
        const existing = teamStatsMap.get(data.teamId)
        if (!existing || (data.points || 0) > (existing.points || 0)) {
          teamStatsMap.set(data.teamId, { id: doc.id, ...data })
        }
      })

      const standings = Array.from(teamStatsMap.values())
        .map(data => {
          const team = teamsMap.get(data.teamId)
          // Double vérification (au cas où)
          if (!team || team.isActive === false) {
            return null
          }
          return {
            ...data,
            teamName: team?.name || 'Équipe inconnue',
            goalDifference: (data.goalsFor || 0) - (data.goalsAgainst || 0),
            teamLogo: team?.logo
          }
        })
        .filter((standing): standing is NonNullable<typeof standing> => standing !== null)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          return b.goalDifference - a.goalDifference
        })
        .slice(0, 6)

      return {
        teams: teamsWithPlayerCounts,
        todayMatches,
        upcomingMatches,
        recentMatches,
        standings,
        stats: {
          teams: teamsData.length,
          matches: publicMatches.length,
          goals: totalGoals,
          completed: matchesWithResults.filter(m => m.status === 'completed').length
        }
      }
    })

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60'
      }
    })
  } catch (error: any) {
    console.error('❌ Erreur API public/home-data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

