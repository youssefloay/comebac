import { NextRequest, NextResponse } from 'next/server'
import { processPreseasonResult, getPreseasonMatches } from '@/lib/preseason/db'

// POST - Submit match result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      matchId, 
      scoreA, 
      scoreB, 
      penaltiesA, 
      penaltiesB,
      teamAGoalScorers,
      teamBGoalScorers,
      teamAYellowCards,
      teamBYellowCards,
      teamARedCards,
      teamBRedCards,
      penaltyShootout
    } = body

    if (!matchId || scoreA === undefined || scoreB === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: matchId, scoreA, scoreB' },
        { status: 400 }
      )
    }

    const resultData = {
      teamAGoalScorers,
      teamBGoalScorers,
      teamAYellowCards,
      teamBYellowCards,
      teamARedCards,
      teamBRedCards,
      penaltyShootout,
    }

    await processPreseasonResult(matchId, scoreA, scoreB, penaltiesA, penaltiesB, resultData)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error processing preseason result:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process result' },
      { status: 500 }
    )
  }
}

// GET - Get matches available for results entry (upcoming or in_progress)
export async function GET() {
  try {
    const allMatches = await getPreseasonMatches()
    const availableMatches = allMatches.filter(
      match => match.status === 'upcoming' || match.status === 'in_progress'
    )
    return NextResponse.json({ matches: availableMatches })
  } catch (error) {
    console.error('Error fetching matches for results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

