import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getPreseasonMatches } from '@/lib/preseason/db'

// GET - Récupérer les matchs à venir d'une équipe
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    }

    const now = new Date()

    // Récupérer les matchs réguliers
    const regularMatches = await adminDb.collection('matches')
      .where('teams', 'array-contains', teamId)
      .where('status', '==', 'upcoming')
      .get()

    const regularMatchesData = regularMatches.docs
      .map(doc => {
        const data = doc.data()
        const matchDate = data.date?.toDate() || new Date()
        if (matchDate >= now) {
          return {
            id: doc.id,
            type: 'regular' as const,
            homeTeam: data.homeTeam || '',
            awayTeam: data.awayTeam || '',
            date: matchDate,
            venue: data.venue || '',
            round: data.round || 0
          }
        }
        return null
      })
      .filter(Boolean)

    // Récupérer les matchs preseason
    const preseasonMatches = await getPreseasonMatches()
    const preseasonMatchesData = preseasonMatches
      .filter(match => 
        (match.teamAId === teamId || match.teamBId === teamId) &&
        (match.status === 'upcoming' || match.status === 'in_progress')
      )
      .map(match => {
        const matchDate = new Date(match.date)
        if (match.time) {
          const [hours, minutes] = match.time.split(':').map(Number)
          if (!isNaN(hours) && !isNaN(minutes)) {
            matchDate.setHours(hours, minutes, 0, 0)
          }
        }
        // Déterminer homeTeam et awayTeam en fonction de l'équipe sélectionnée
        // L'équipe sélectionnée est toujours affichée en premier (homeTeam)
        const isTeamA = match.teamAId === teamId
        return {
          id: match.id,
          type: 'preseason' as const,
          homeTeam: isTeamA ? (match.teamAName || '') : (match.teamBName || ''),
          awayTeam: isTeamA ? (match.teamBName || '') : (match.teamAName || ''),
          date: matchDate,
          venue: match.location || '',
          round: 0
        }
      })

    // Combiner et trier par date
    const allMatches = [...regularMatchesData, ...preseasonMatchesData]
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    return NextResponse.json(allMatches)
  } catch (error: any) {
    console.error('Error fetching team matches:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}
