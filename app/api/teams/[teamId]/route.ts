import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET - Récupérer une équipe spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { teamId } = await params
    const teamDoc = await adminDb.collection('teams').doc(teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { error: 'Équipe non trouvée' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()
    return NextResponse.json({
      id: teamDoc.id,
      ...teamData
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'équipe' },
      { status: 500 }
    )
  }
}
