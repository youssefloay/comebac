import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { generateFinals, calculateTeamStats, generateRanking } from '@/lib/match-generation'
import type { Match, MatchResult } from '@/lib/types'

/**
 * Vérifie si tous les matchs de qualification (Jours 1-5) sont terminés
 * et génère automatiquement les finales si c'est le cas
 * @param isTest Si true, génère les finales en mode test
 * @returns true si les finales ont été générées, false sinon
 */
export async function checkAndGenerateFinals(isTest: boolean = false): Promise<{
  generated: boolean
  message: string
  finalMatchIds?: string[]
}> {
  try {
    // Récupérer tous les matchs de qualification (Jours 1-5) pour MINI_LEAGUE
    const matchesQuery = query(
      collection(db, 'matches'),
      where('tournamentMode', '==', 'MINI_LEAGUE'),
      where('isFinal', '==', false)
    )
    const matchesSnapshot = await getDocs(matchesQuery)

    if (matchesSnapshot.empty) {
      return {
        generated: false,
        message: 'Aucun match de qualification trouvé'
      }
    }

    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      isTest: doc.data().isTest || false
    })) as Match[]

    // Filtrer par isTest si nécessaire
    const relevantMatches = matches.filter(m => m.isTest === isTest)

    // Vérifier que nous avons des matchs de qualification (Jours 1-5)
    const qualificationMatches = relevantMatches.filter(m => m.round <= 5)
    
    if (qualificationMatches.length === 0) {
      return {
        generated: false,
        message: 'Aucun match de qualification trouvé'
      }
    }

    // Vérifier si des finales existent déjà
    const finalsQuery = query(
      collection(db, 'matches'),
      where('tournamentMode', '==', 'MINI_LEAGUE'),
      where('isFinal', '==', true)
    )
    const finalsSnapshot = await getDocs(finalsQuery)
    const existingFinals = finalsSnapshot.docs
      .map(doc => ({ ...doc.data(), isTest: doc.data().isTest || false }))
      .filter(m => m.isTest === isTest)

    if (existingFinals.length > 0) {
      return {
        generated: false,
        message: 'Les finales ont déjà été générées'
      }
    }

    // Récupérer tous les résultats
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

    // Vérifier que tous les matchs de qualification ont des résultats
    const qualificationMatchIds = new Set(qualificationMatches.map(m => m.id))
    const qualificationResults = results.filter(r => qualificationMatchIds.has(r.matchId))

    if (qualificationResults.length !== qualificationMatches.length) {
      const missingCount = qualificationMatches.length - qualificationResults.length
      return {
        generated: false,
        message: `${missingCount} match(s) de qualification sans résultat. Tous les matchs doivent être terminés.`
      }
    }

    // Vérifier que tous les matchs sont terminés (status === 'completed')
    const incompleteMatches = qualificationMatches.filter(m => m.status !== 'completed')
    if (incompleteMatches.length > 0) {
      return {
        generated: false,
        message: `${incompleteMatches.length} match(s) de qualification non terminés. Tous les matchs doivent être terminés.`
      }
    }

    // Calculer le classement
    const matchResults = qualificationResults.map(r => ({
      matchId: r.matchId,
      homeScore: r.homeTeamScore,
      awayScore: r.awayTeamScore
    }))

    const stats = calculateTeamStats(qualificationMatches, matchResults)
    const ranking = generateRanking(stats)

    if (ranking.length < 4) {
      return {
        generated: false,
        message: 'Il faut au moins 4 équipes classées pour générer les finales'
      }
    }

    // Générer les finales pour le prochain jeudi (Jour 6)
    // Calculer la date du Jour 6 (jeudi suivant le dernier match de qualification)
    const lastMatchDate = qualificationMatches
      .map(m => m.date instanceof Date ? m.date : new Date(m.date))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    // Trouver le prochain jeudi
    const finalDate = new Date(lastMatchDate)
    finalDate.setDate(finalDate.getDate() + ((4 - finalDate.getDay() + 7) % 7) || 7) // Prochain jeudi
    finalDate.setHours(16, 0, 0, 0) // 16h00 par défaut

    // Générer les finales (non publiées par défaut, en attente de validation)
    const finalMatchIds = await generateFinals(ranking, finalDate, undefined, isTest, false)

    return {
      generated: true,
      message: `Finales générées automatiquement et en attente de publication: Grande Finale (1er vs 2ème) et Petite Finale (3ème vs 4ème) pour le ${finalDate.toLocaleDateString('fr-FR')}. Allez dans l'onglet "Finales" pour les publier.`,
      finalMatchIds
    }
  } catch (error: any) {
    console.error('Error checking and generating finals:', error)
    return {
      generated: false,
      message: `Erreur lors de la génération automatique des finales: ${error.message}`
    }
  }
}

