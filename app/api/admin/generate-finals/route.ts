import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { generateFinals, calculateTeamStats, generateRanking } from '@/lib/match-generation'
import type { Match, MatchResult } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { finalDate, time } = body

    if (!finalDate || !time) {
      return NextResponse.json({ 
        error: 'Date et heure requises pour les finales' 
      }, { status: 400 })
    }

    // Récupérer tous les matchs de qualification (Jours 1-5) pour MINI_LEAGUE
    // Si isTest est true, récupérer aussi les matchs de test
    const matchesQuery = query(
      collection(db, 'matches'),
      where('tournamentMode', '==', 'MINI_LEAGUE'),
      where('isFinal', '==', false)
    )
    const matchesSnapshot = await getDocs(matchesQuery)
    
    if (matchesSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Aucun match de qualification trouvé. Veuillez d\'abord générer les matchs de qualification.' 
      }, { status: 400 })
    }

    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date()
    })) as Match[]

    // Vérifier que tous les matchs de qualification sont terminés (Jour 5)
    const qualificationMatches = matches.filter(m => m.round <= 5)
    const day5Matches = qualificationMatches.filter(m => m.round === 5)
    
    if (day5Matches.length === 0) {
      return NextResponse.json({ 
        error: 'Aucun match du Jour 5 trouvé. Les finales ne peuvent être générées qu\'après le Jour 5.' 
      }, { status: 400 })
    }

    // Récupérer les résultats des matchs de qualification
    const resultsSnapshot = await getDocs(collection(db, 'matchResults'))
    const results = resultsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        matchId: data.matchId || '',
        homeTeamScore: data.homeTeamScore || data.homeScore || 0,
        awayTeamScore: data.awayTeamScore || data.awayScore || 0,
        ...data
      }
    }) as MatchResult[]

    // Calculer les statistiques et le classement
    const matchResults = results
      .filter(r => qualificationMatches.some(m => m.id === r.matchId))
      .map(r => ({
        matchId: r.matchId,
        homeScore: r.homeTeamScore,
        awayScore: r.awayTeamScore
      }))

    const stats = calculateTeamStats(qualificationMatches, matchResults)
    const ranking = generateRanking(stats)

    if (ranking.length < 4) {
      return NextResponse.json({ 
        error: 'Il faut au moins 4 équipes classées pour générer les finales' 
      }, { status: 400 })
    }

    // Générer les finales
    const finalDateObj = new Date(finalDate)
    const [hours, minutes] = time.split(':').map(Number)
    finalDateObj.setHours(hours, minutes, 0, 0)

    // Récupérer le flag isTest depuis les matchs de qualification
    const isTest = matches.length > 0 ? (matches[0] as any).isTest === true : false
    
    // Si généré manuellement via l'API, publier directement (isPublished: true)
    const isPublished = true
    
    const finalMatchIds = await generateFinals(ranking, finalDateObj, undefined, isTest, isPublished)

    return NextResponse.json({ 
      success: true, 
      message: `Finales générées avec succès: Grande Finale (1er vs 2ème) et Petite Finale (3ème vs 4ème)`,
      matchesCount: finalMatchIds.length,
      ranking: ranking.slice(0, 4).map(r => ({
        rank: r.rank,
        teamId: r.teamId
      }))
    })
  } catch (error: any) {
    console.error('Error generating finals:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to generate finals' 
    }, { status: 500 })
  }
}

