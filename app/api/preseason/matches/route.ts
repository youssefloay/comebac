import { NextRequest, NextResponse } from 'next/server'
import {
  createPreseasonMatch,
  getPreseasonMatches,
  updatePreseasonMatch,
  deletePreseasonMatch,
} from '@/lib/preseason/db'
import { adminDb } from '@/lib/firebase-admin'

// GET - List all preseason matches
export async function GET() {
  try {
    const matches = await getPreseasonMatches()
    
    // Enrichir avec les logos des équipes
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        try {
          const [teamADoc, teamBDoc] = await Promise.all([
            adminDb!.collection('teams').doc(match.teamAId).get(),
            adminDb!.collection('teams').doc(match.teamBId).get(),
          ])
          
          const teamAData = teamADoc.exists ? teamADoc.data() : null
          const teamBData = teamBDoc.exists ? teamBDoc.data() : null
          
          return {
            ...match,
            teamALogo: teamAData?.logo && teamAData.logo.trim() !== '' ? teamAData.logo : null,
            teamBLogo: teamBData?.logo && teamBData.logo.trim() !== '' ? teamBData.logo : null,
          }
        } catch (error) {
          console.error(`Error fetching team logos for match ${match.id}:`, error)
          return {
            ...match,
            teamALogo: null,
            teamBLogo: null,
          }
        }
      })
    )
    
    return NextResponse.json({ matches: enrichedMatches })
  } catch (error) {
    console.error('Error fetching preseason matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preseason matches' },
      { status: 500 }
    )
  }
}

// POST - Create a new preseason match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamAId, teamBId, date, time, location } = body

    if (!teamAId || !teamBId || !date || !time || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (teamAId === teamBId) {
      return NextResponse.json(
        { error: 'teamA cannot equal teamB' },
        { status: 400 }
      )
    }

    // Get team names
    const teamADoc = await adminDb!.collection('teams').doc(teamAId).get()
    const teamBDoc = await adminDb!.collection('teams').doc(teamBId).get()

    if (!teamADoc.exists || !teamBDoc.exists) {
      return NextResponse.json(
        { error: 'One or both teams not found' },
        { status: 404 }
      )
    }

    const teamAData = teamADoc.data()!
    const teamBData = teamBDoc.data()!
    const teamAName = teamAData.name
    const teamBName = teamBData.name

    const matchId = await createPreseasonMatch({
      teamAId,
      teamBId,
      teamAName,
      teamBName,
      date: new Date(date),
      time,
      location,
      status: 'upcoming',
    })

    return NextResponse.json({ id: matchId, success: true })
  } catch (error: any) {
    console.error('Error creating preseason match:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create preseason match' },
      { status: 500 }
    )
  }
}

// PUT - Update a preseason match
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = { ...updates }
    if (updateData.date) {
      updateData.date = new Date(updateData.date)
    }

    await updatePreseasonMatch(id, updateData)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating preseason match:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update preseason match' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a preseason match
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      )
    }

    await deletePreseasonMatch(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting preseason match:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete preseason match' },
      { status: 500 }
    )
  }
}

