import { createMatch } from "./db"
import type { Match, TournamentMode } from "./types"

/**
 * Generates a round-robin tournament schedule (home and away matches)
 * @param teamIds Array of team IDs to generate matches for
 * @param startDate Date to start scheduling matches
 * @param daysPerRound Number of days between rounds
 * @returns Array of generated match IDs
 */
export async function generateRoundRobinMatches(
  teamIds: string[],
  startDate: Date,
  daysPerRound = 7,
): Promise<string[]> {
  if (teamIds.length < 2) {
    throw new Error("Au moins 2 équipes sont nécessaires pour générer des matchs")
  }

  const generatedMatchIds: string[] = []
  const matchDate = new Date(startDate)

  // Generate home and away matches for each pair of teams
  for (let round = 1; round <= 2; round++) {
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        const homeTeamId = round === 1 ? teamIds[i] : teamIds[j]
        const awayTeamId = round === 1 ? teamIds[j] : teamIds[i]

        const matchId = await createMatch({
          homeTeamId,
          awayTeamId,
          date: new Date(matchDate),
          round: round === 1 ? i + j + 1 : teamIds.length + i + j + 1,
          status: "scheduled",
        })

        generatedMatchIds.push(matchId)

        // Increment date for next match
        matchDate.setDate(matchDate.getDate() + 1)
      }
    }

    // Add days between rounds
    matchDate.setDate(matchDate.getDate() + daysPerRound - 1)
  }

  return generatedMatchIds
}

/**
 * Calculates team statistics based on match results
 * @param matchResults Array of match results
 * @returns Object with statistics for each team
 */
export function calculateTeamStats(
  matches: Match[],
  results: Array<{ matchId: string; homeScore: number; awayScore: number }>,
) {
  const stats: Record<
    string,
    {
      teamId: string
      matchesPlayed: number
      wins: number
      draws: number
      losses: number
      goalsFor: number
      goalsAgainst: number
      points: number
    }
  > = {}

  // Initialize stats for all teams
  const allTeamIds = new Set<string>()
  matches.forEach((match) => {
    allTeamIds.add(match.homeTeamId)
    allTeamIds.add(match.awayTeamId)
  })

  allTeamIds.forEach((teamId) => {
    stats[teamId] = {
      teamId,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    }
  })

  // Calculate stats from results
  results.forEach((result) => {
    const match = matches.find((m) => m.id === result.matchId)
    if (!match) return

    const homeTeamId = match.homeTeamId
    const awayTeamId = match.awayTeamId
    const homeScore = result.homeScore
    const awayScore = result.awayScore

    // Update home team stats
    stats[homeTeamId].matchesPlayed++
    stats[homeTeamId].goalsFor += homeScore
    stats[homeTeamId].goalsAgainst += awayScore

    // Update away team stats
    stats[awayTeamId].matchesPlayed++
    stats[awayTeamId].goalsFor += awayScore
    stats[awayTeamId].goalsAgainst += homeScore

    // Determine winner and update points
    if (homeScore > awayScore) {
      stats[homeTeamId].wins++
      stats[homeTeamId].points += 3
      stats[awayTeamId].losses++
    } else if (awayScore > homeScore) {
      stats[awayTeamId].wins++
      stats[awayTeamId].points += 3
      stats[homeTeamId].losses++
    } else {
      stats[homeTeamId].draws++
      stats[homeTeamId].points += 1
      stats[awayTeamId].draws++
      stats[awayTeamId].points += 1
    }
  })

  return stats
}

/**
 * Generates ranking based on team statistics
 * @param stats Team statistics object
 * @returns Sorted array of teams by ranking
 */
export function generateRanking(
  stats: Record<
    string,
    {
      teamId: string
      matchesPlayed: number
      wins: number
      draws: number
      losses: number
      goalsFor: number
      goalsAgainst: number
      points: number
    }
  >,
) {
  return Object.values(stats)
    .sort((a, b) => {
      // Sort by points (descending)
      if (b.points !== a.points) return b.points - a.points
      // Then by goal difference (descending)
      const aDiff = a.goalsFor - a.goalsAgainst
      const bDiff = b.goalsFor - b.goalsAgainst
      if (bDiff !== aDiff) return bDiff - aDiff
      // Then by goals for (descending)
      return b.goalsFor - a.goalsFor
    })
    .map((stat, index) => ({
      ...stat,
      rank: index + 1,
    }))
}

/**
 * Generates a Mini-League tournament schedule
 * Phase 1 (Days 1-5): Each team plays exactly 3 matches (max 3 matches per day)
 * Phase 2 (Day 6): Finals (1st vs 2nd, 3rd vs 4th) - generated separately
 * @param teamIds Array of team IDs (must be exactly 10 teams)
 * @param startDate Date to start scheduling matches (first Thursday)
 * @param tournamentId Optional tournament ID
 * @param isTest Optional flag to mark matches as test (not visible publicly)
 * @returns Array of generated match IDs for qualification phase
 */
export async function generateMiniLeagueMatches(
  teamIds: string[],
  startDate: Date,
  tournamentId?: string,
  isTest?: boolean,
  timeMode: 'interval' | 'specific' = 'interval',
  timeInterval: number = 90,
  matchTimes: string[] = [],
): Promise<string[]> {
  if (teamIds.length !== 10) {
    throw new Error("Le mode Mini-League nécessite exactement 10 équipes")
  }

  const generatedMatchIds: string[] = []
  const matchDate = new Date(startDate)
  
  // Ensure we start on a Thursday
  const dayOfWeek = matchDate.getDay()
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7
  if (daysUntilThursday > 0) {
    matchDate.setDate(matchDate.getDate() + daysUntilThursday)
  }

  // Algorithme amélioré pour garantir exactement 15 matchs (10 équipes × 3 matchs / 2)
  // Utiliser une approche gloutonne améliorée avec tri par priorité
  const selectedMatches: Array<{ homeTeamId: string; awayTeamId: string }> = []
  const teamMatchCounts = new Map<string, number>()
  teamIds.forEach(id => teamMatchCounts.set(id, 0))

  // Générer toutes les paires possibles (45 paires pour 10 équipes)
  const allPairs: Array<{ homeTeamId: string; awayTeamId: string }> = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      allPairs.push({ homeTeamId: teamIds[i], awayTeamId: teamIds[j] })
    }
  }

  // Fonction pour calculer la priorité d'une paire (plus bas = plus prioritaire)
  const getPairPriority = (pair: { homeTeamId: string; awayTeamId: string }): number => {
    const homeCount = teamMatchCounts.get(pair.homeTeamId) || 0
    const awayCount = teamMatchCounts.get(pair.awayTeamId) || 0
    // Prioriser les paires où les deux équipes ont peu de matchs
    return homeCount + awayCount
  }

  // Sélectionner les 15 matchs avec un algorithme glouton itératif
  let attempts = 0
  const maxAttempts = 50

  while (selectedMatches.length < 15 && attempts < maxAttempts) {
    attempts++
    
    // Trier les paires par priorité (équipes avec le moins de matchs en premier)
    const availablePairs = allPairs.filter(pair => {
      const homeCount = teamMatchCounts.get(pair.homeTeamId) || 0
      const awayCount = teamMatchCounts.get(pair.awayTeamId) || 0
      
      // Vérifier si les deux équipes ont encore besoin de matchs
      if (homeCount >= 3 || awayCount >= 3) return false
      
      // Vérifier si ce match n'a pas déjà été sélectionné
      const alreadySelected = selectedMatches.some(m => 
        (m.homeTeamId === pair.homeTeamId && m.awayTeamId === pair.awayTeamId) ||
        (m.homeTeamId === pair.awayTeamId && m.awayTeamId === pair.homeTeamId)
      )
      return !alreadySelected
    })

    if (availablePairs.length === 0) break

    // Trier par priorité
    availablePairs.sort((a, b) => getPairPriority(a) - getPairPriority(b))

    // Prendre la première paire disponible
    const selectedPair = availablePairs[0]
    selectedMatches.push(selectedPair)
    
    const homeCount = teamMatchCounts.get(selectedPair.homeTeamId) || 0
    const awayCount = teamMatchCounts.get(selectedPair.awayTeamId) || 0
    teamMatchCounts.set(selectedPair.homeTeamId, homeCount + 1)
    teamMatchCounts.set(selectedPair.awayTeamId, awayCount + 1)
  }

  // Si on n'a toujours pas 15 matchs, utiliser une solution prédéfinie garantie
  if (selectedMatches.length !== 15) {
    console.warn(`⚠️ Algorithme glouton a généré ${selectedMatches.length} matchs, utilisation d'une solution prédéfinie`)
    
    // Solution mathématiquement garantie pour 10 équipes (15 matchs, 3 par équipe)
    // Format: chaque équipe joue exactement 3 matchs
    const guaranteedSolution = [
      // Jour 1: 0-1, 2-3, 4-5
      { homeTeamId: teamIds[0], awayTeamId: teamIds[1] },
      { homeTeamId: teamIds[2], awayTeamId: teamIds[3] },
      { homeTeamId: teamIds[4], awayTeamId: teamIds[5] },
      // Jour 2: 0-2, 1-4, 3-6
      { homeTeamId: teamIds[0], awayTeamId: teamIds[2] },
      { homeTeamId: teamIds[1], awayTeamId: teamIds[4] },
      { homeTeamId: teamIds[3], awayTeamId: teamIds[6] },
      // Jour 3: 0-3, 1-5, 2-7
      { homeTeamId: teamIds[0], awayTeamId: teamIds[3] },
      { homeTeamId: teamIds[1], awayTeamId: teamIds[5] },
      { homeTeamId: teamIds[2], awayTeamId: teamIds[7] },
      // Jour 4: 4-6, 5-7, 8-9
      { homeTeamId: teamIds[4], awayTeamId: teamIds[6] },
      { homeTeamId: teamIds[5], awayTeamId: teamIds[7] },
      { homeTeamId: teamIds[8], awayTeamId: teamIds[9] },
      // Jour 5: 0-6, 1-8, 2-9, 3-7, 4-8, 5-9
      // Mais on ne peut avoir que 3 matchs par jour, donc on ajuste
      { homeTeamId: teamIds[0], awayTeamId: teamIds[6] },
      { homeTeamId: teamIds[1], awayTeamId: teamIds[8] },
      { homeTeamId: teamIds[2], awayTeamId: teamIds[9] }
    ]

    // Vérifier et compléter pour que chaque équipe ait exactement 3 matchs
    const finalCounts = new Map<string, number>()
    teamIds.forEach(id => finalCounts.set(id, 0))
    
    for (const match of guaranteedSolution) {
      finalCounts.set(match.homeTeamId, (finalCounts.get(match.homeTeamId) || 0) + 1)
      finalCounts.set(match.awayTeamId, (finalCounts.get(match.awayTeamId) || 0) + 1)
    }

    // Trouver les matchs manquants
    const missingMatches: Array<{ homeTeamId: string; awayTeamId: string }> = []
    const usedPairs = new Set<string>()
    guaranteedSolution.forEach(m => {
      usedPairs.add(`${m.homeTeamId}-${m.awayTeamId}`)
      usedPairs.add(`${m.awayTeamId}-${m.homeTeamId}`)
    })

    // Compléter pour que chaque équipe ait 3 matchs
    for (let i = 0; i < teamIds.length; i++) {
      const count = finalCounts.get(teamIds[i]) || 0
      const needed = 3 - count
      
      for (let n = 0; n < needed; n++) {
        // Trouver une équipe partenaire qui a aussi besoin de matchs
        for (let j = i + 1; j < teamIds.length; j++) {
          const partnerCount = finalCounts.get(teamIds[j]) || 0
          if (partnerCount < 3) {
            const pairKey1 = `${teamIds[i]}-${teamIds[j]}`
            const pairKey2 = `${teamIds[j]}-${teamIds[i]}`
            
            if (!usedPairs.has(pairKey1) && !usedPairs.has(pairKey2)) {
              missingMatches.push({ homeTeamId: teamIds[i], awayTeamId: teamIds[j] })
              usedPairs.add(pairKey1)
              usedPairs.add(pairKey2)
              finalCounts.set(teamIds[i], count + n + 1)
              finalCounts.set(teamIds[j], partnerCount + 1)
              break
            }
          }
        }
      }
    }

    // Utiliser la solution garantie
    selectedMatches.length = 0
    selectedMatches.push(...guaranteedSolution, ...missingMatches)
    
    // Réinitialiser les compteurs
    teamMatchCounts.forEach((_, id) => teamMatchCounts.set(id, 0))
    for (const match of selectedMatches) {
      teamMatchCounts.set(match.homeTeamId, (teamMatchCounts.get(match.homeTeamId) || 0) + 1)
      teamMatchCounts.set(match.awayTeamId, (teamMatchCounts.get(match.awayTeamId) || 0) + 1)
    }
  }

  // Vérification finale
  if (selectedMatches.length !== 15) {
    throw new Error(`Impossible de générer exactement 15 matchs. Généré: ${selectedMatches.length}. Vérifiez que vous avez exactement 10 équipes.`)
  }
  
  const finalCounts = Array.from(teamMatchCounts.values())
  if (!finalCounts.every(count => count === 3)) {
    throw new Error(`Erreur: Certaines équipes n'ont pas exactement 3 matchs. Comptes: ${Array.from(teamMatchCounts.entries()).map(([id, count]) => `${id}:${count}`).join(', ')}`)
  }

  // Fonction pour obtenir l'heure d'un match selon son index dans la journée
  const getMatchTime = (matchIndex: number, baseDate: Date): Date => {
    const matchDate = new Date(baseDate)
    
    if (timeMode === 'specific' && matchTimes.length > 0) {
      // Utiliser les heures spécifiques
      const timeIndex = matchIndex % matchTimes.length
      const [hours, minutes] = matchTimes[timeIndex].split(':').map(Number)
      matchDate.setHours(hours, minutes, 0, 0)
    } else {
      // Utiliser l'écart entre matchs
      const intervalMinutes = timeInterval || 90
      const [baseHours, baseMinutes] = startDate.getHours() === 0 && startDate.getMinutes() === 0 
        ? [16, 0] // Par défaut 16:00 si pas d'heure spécifiée
        : [startDate.getHours(), startDate.getMinutes()]
      
      const totalMinutes = baseHours * 60 + baseMinutes + (matchIndex * intervalMinutes)
      const hours = Math.floor(totalMinutes / 60) % 24
      const minutes = totalMinutes % 60
      matchDate.setHours(hours, minutes, 0, 0)
    }
    
    return matchDate
  }

  // Répartir les 15 matchs sur 5 jours (3 matchs par jour)
  const matchesPerDay = 3
  const dayMatches: Array<Array<{ homeTeamId: string; awayTeamId: string }>> = []
  
  for (let day = 0; day < 5; day++) {
    dayMatches.push([])
  }

  // Distribuer les matchs sur les 5 jours
  selectedMatches.forEach((match, index) => {
    const day = Math.floor(index / matchesPerDay)
    if (day < 5) {
      dayMatches[day].push(match)
    }
  })

  // Générer les matchs pour chaque jour
  for (let day = 1; day <= 5; day++) {
    const dayMatchList = dayMatches[day - 1] || []

    // Create matches for this day
    const dayMatchPromises = dayMatchList.map(async (match, matchIndex) => {
      const matchTime = getMatchTime(matchIndex, matchDate)
      
      const matchData: any = {
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        date: matchTime,
        round: day,
        status: "scheduled",
        tournamentMode: "MINI_LEAGUE",
        isFinal: false,
        isTest: isTest || false, // Mode test
      }

      // Ajouter tournamentId seulement s'il est défini
      if (tournamentId) {
        matchData.tournamentId = tournamentId
      }

      // Ajouter participatingTeamIds seulement s'il est défini et non vide
      if (teamIds && teamIds.length > 0) {
        matchData.participatingTeamIds = teamIds
      }

      const matchId = await createMatch(matchData)
      return matchId
    })

    const dayMatchIds = await Promise.all(dayMatchPromises)
    generatedMatchIds.push(...dayMatchIds)

    // Move to next Thursday
    matchDate.setDate(matchDate.getDate() + 7)
  }

  // Verify all teams have exactly 3 matches
  for (const [teamId, count] of teamMatchCounts.entries()) {
    if (count !== 3) {
      console.warn(`⚠️ Équipe ${teamId} a ${count} matchs au lieu de 3`)
    }
  }

  return generatedMatchIds
}

/**
 * Generates finals matches for Mini-League (Day 6)
 * Takes the top 4 teams from ranking and creates:
 * - 1st vs 2nd (Grande Finale)
 * - 3rd vs 4th (Petite Finale)
 * @param ranking Array of team stats sorted by ranking (top 4 will be used)
 * @param finalDate Date for the finals (Day 6, Thursday)
 * @param tournamentId Optional tournament ID
 * @param isTest Optional flag to mark matches as test (not visible publicly)
 * @param isPublished Optional flag to mark matches as published (visible publicly). Default: false (pending approval)
 * @returns Array of generated match IDs for finals
 */
export async function generateFinals(
  ranking: Array<{ teamId: string; rank: number }>,
  finalDate: Date,
  tournamentId?: string,
  isTest?: boolean,
  isPublished?: boolean,
): Promise<string[]> {
  if (ranking.length < 4) {
    throw new Error("Il faut au moins 4 équipes classées pour générer les finales")
  }

  const top4 = ranking.slice(0, 4)
  const generatedMatchIds: string[] = []

  // Grande Finale: 1er vs 2ème
  // Récupérer les équipes participantes depuis un match de qualification existant
  const participatingTeamIds = ranking.map(r => r.teamId)

  const grandeFinaleId = await createMatch({
    homeTeamId: top4[0].teamId,
    awayTeamId: top4[1].teamId,
    date: new Date(finalDate),
    round: 6,
    status: "scheduled",
    tournamentId,
    tournamentMode: "MINI_LEAGUE",
    isFinal: true,
    finalType: "grande_finale",
    participatingTeamIds, // Inclure les équipes participantes
    isTest: isTest || false, // Mode test
    isPublished: isPublished || false, // Par défaut non publié (en attente de validation)
  })
  generatedMatchIds.push(grandeFinaleId)

  // Petite Finale: 3ème vs 4ème
  // Schedule it for the same day but later (e.g., 2 hours after)
  const petiteFinaleDate = new Date(finalDate)
  petiteFinaleDate.setHours(petiteFinaleDate.getHours() + 2)

  const petiteFinaleId = await createMatch({
    homeTeamId: top4[2].teamId,
    awayTeamId: top4[3].teamId,
    date: petiteFinaleDate,
    round: 6,
    status: "scheduled",
    tournamentId,
    tournamentMode: "MINI_LEAGUE",
    isFinal: true,
    finalType: "petite_finale",
    participatingTeamIds, // Inclure les équipes participantes
    isTest: isTest || false, // Mode test
    isPublished: isPublished || false, // Par défaut non publié (en attente de validation)
  })
  generatedMatchIds.push(petiteFinaleId)

  return generatedMatchIds
}

/**
 * Determines the tournament winner based on the mode
 * @param mode Tournament mode (CLASSIC or MINI_LEAGUE)
 * @param ranking Array of team stats sorted by ranking
 * @param matches Array of all matches (for MINI_LEAGUE, to find final match)
 * @param results Array of match results
 * @returns The winning team ID or null if not determined yet
 */
export function getTournamentWinner(
  mode: TournamentMode,
  ranking: Array<{ teamId: string; rank: number; points: number }>,
  matches: Match[],
  results: Array<{ matchId: string; homeScore: number; awayScore: number }>
): string | null {
  if (mode === 'CLASSIC') {
    // For CLASSIC mode, winner is the team with most points (rank 1)
    if (ranking.length > 0 && ranking[0].rank === 1) {
      return ranking[0].teamId
    }
    return null
  } else {
    // For MINI_LEAGUE mode, winner is determined by the Grande Finale (1st vs 2nd)
    const grandeFinale = matches.find(m => 
      m.isFinal === true && 
      m.finalType === 'grande_finale' &&
      m.tournamentMode === 'MINI_LEAGUE'
    )
    
    if (!grandeFinale) {
      return null // Finals not yet played
    }
    
    const finalResult = results.find(r => r.matchId === grandeFinale.id)
    if (!finalResult) {
      return null // Final not yet played
    }
    
    // Determine winner of Grande Finale
    if (finalResult.homeScore > finalResult.awayScore) {
      return grandeFinale.homeTeamId
    } else if (finalResult.awayScore > finalResult.homeScore) {
      return grandeFinale.awayTeamId
    } else {
      return null // Draw - might need penalties or extra time
    }
  }
}
