import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { syncAllTeamPlayersToCollections } from '../sync-player-to-collections'

export async function POST(request: NextRequest) {
  try {
    const { teamId, teamName, players, schoolName, teamGrade, createPlayerAccounts = true } = await request.json()

    if (!teamId || !teamName || !players || !Array.isArray(players)) {
      return NextResponse.json({ 
        error: 'teamId, teamName et players (array) requis' 
      }, { status: 400 })
    }

    await syncAllTeamPlayersToCollections(
      players,
      teamId,
      teamName,
      schoolName,
      teamGrade,
      createPlayerAccounts
    )

    return NextResponse.json({
      success: true,
      message: `${players.length} joueur(s) synchronisé(s) pour l'équipe "${teamName}"`
    })
  } catch (error: any) {
    console.error('❌ Erreur synchronisation:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

