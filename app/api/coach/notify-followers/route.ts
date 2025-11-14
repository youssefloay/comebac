import { NextRequest, NextResponse } from 'next/server'
import { notifyTeamAnnouncement } from '@/lib/favorite-notifications'

export async function POST(request: NextRequest) {
  try {
    const { teamId, teamName, announcement } = await request.json()

    if (!teamId || !teamName || !announcement) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const result = await notifyTeamAnnouncement(teamId, teamName, announcement)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
