import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamName = searchParams.get('teamName') || 'Icons'

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    // Trouver l'équipe
    const teamsQuery = await adminDb
      .collection('teams')
      .where('name', '==', teamName)
      .get()

    if (teamsQuery.empty) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const teamDoc = teamsQuery.docs[0]
    const teamId = teamDoc.id
    const teamData = teamDoc.data()

    // Récupérer tous les playerAccounts pour cette équipe
    const playerAccountsSnap = await adminDb
      .collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()

    // Récupérer les coaches
    const coachAccountsSnap = await adminDb
      .collection('coachAccounts')
      .where('teamId', '==', teamId)
      .get()

    const allPlayerAccounts = playerAccountsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    const allCoachAccounts = coachAccountsSnap.docs.map(doc => doc.data())
    
    const coachEmails = new Set(
      allCoachAccounts
        .map((coach: any) => coach.email?.toLowerCase().trim())
        .filter((email: string) => email)
    )
    
    const actingCoachEmails = new Set(
      allPlayerAccounts
        .filter((account: any) => account.isActingCoach === true)
        .map((account: any) => account.email?.toLowerCase().trim())
        .filter((email: string) => email)
    )

    // Analyser chaque joueur
    const playersAnalysis = allPlayerAccounts.map((account: any) => {
      const email = account.email?.toLowerCase().trim()
      const playerEmail = email || ''
      
      const isActingCoach = account.isActingCoach === true
      const isInCoachEmails = playerEmail && coachEmails.has(playerEmail)
      const isInActingCoachEmails = playerEmail && actingCoachEmails.has(playerEmail)
      const isInactive = account.status === 'inactive'
      
      const isCoach = isActingCoach || isInCoachEmails || isInActingCoachEmails
      const shouldBeIncluded = !isCoach && !isInactive

      return {
        id: account.id,
        name: `${account.firstName} ${account.lastName}`,
        nickname: account.nickname,
        email: account.email,
        teamId: account.teamId,
        isActingCoach,
        status: account.status,
        isCaptain: account.isCaptain,
        isInCoachEmails,
        isInActingCoachEmails,
        isCoach,
        isInactive,
        shouldBeIncluded,
        position: account.position,
        jerseyNumber: account.jerseyNumber
      }
    })

    const includedPlayers = playersAnalysis.filter(p => p.shouldBeIncluded)
    const excludedPlayers = playersAnalysis.filter(p => !p.shouldBeIncluded)

    // Chercher spécifiquement Omar Sa3id
    const omarSa3id = allPlayerAccounts.find((p: any) => 
      p.email?.toLowerCase() === 'omarhichamsaied96@gmail.com' ||
      (p.firstName === 'Omar' && p.lastName === 'Sa3id')
    )

    return NextResponse.json({
      team: {
        id: teamId,
        name: teamData.name,
        category: teamData.category
      },
      stats: {
        totalPlayerAccounts: allPlayerAccounts.length,
        totalCoaches: allCoachAccounts.length,
        includedPlayers: includedPlayers.length,
        excludedPlayers: excludedPlayers.length
      },
      coachEmails: Array.from(coachEmails),
      actingCoachEmails: Array.from(actingCoachEmails),
      omarSa3id: omarSa3id ? {
        id: omarSa3id.id,
        name: `${omarSa3id.firstName} ${omarSa3id.lastName}`,
        email: omarSa3id.email,
        teamId: omarSa3id.teamId,
        isActingCoach: omarSa3id.isActingCoach,
        status: omarSa3id.status,
        isCaptain: omarSa3id.isCaptain,
        analysis: playersAnalysis.find(p => p.id === omarSa3id.id)
      } : null,
      includedPlayers: includedPlayers.map(p => ({
        name: p.name,
        nickname: p.nickname,
        email: p.email,
        position: p.position,
        jerseyNumber: p.jerseyNumber
      })),
      excludedPlayers: excludedPlayers.map(p => ({
        name: p.name,
        email: p.email,
        reason: p.isCoach ? 'coach' : p.isInactive ? 'inactive' : 'unknown'
      }))
    })
  } catch (error: any) {
    console.error('❌ Erreur debug:', error)
    return NextResponse.json(
      { 
        error: 'Failed to debug team players',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

