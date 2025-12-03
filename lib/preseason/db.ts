import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { PreseasonMatch, PreseasonStats, Team } from '@/lib/types'

if (!adminDb) {
  throw new Error('Firebase Admin DB not initialized')
}

// ========== PRESEASON MATCHES ==========

export async function createPreseasonMatch(matchData: Omit<PreseasonMatch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (matchData.teamAId === matchData.teamBId) {
    throw new Error('teamA cannot equal teamB')
  }

  const now = Timestamp.now()
  const docRef = await adminDb!.collection('preseasonMatches').add({
    ...matchData,
    date: Timestamp.fromDate(matchData.date),
    createdAt: now,
    updatedAt: now,
  })

  return docRef.id
}

export async function getPreseasonMatches(): Promise<PreseasonMatch[]> {
  const snapshot = await adminDb!.collection('preseasonMatches')
    .orderBy('date', 'asc')
    .orderBy('time', 'asc')
    .get()

  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as PreseasonMatch
  })
}

export async function getPreseasonMatchById(id: string): Promise<PreseasonMatch | null> {
  const doc = await adminDb!.collection('preseasonMatches').doc(id).get()
  if (!doc.exists) return null

  const data = doc.data()!
  return {
    id: doc.id,
    ...data,
    date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
  } as PreseasonMatch
}

export async function updatePreseasonMatch(id: string, updates: Partial<PreseasonMatch>): Promise<void> {
  const updateData: any = {
    updatedAt: Timestamp.now(),
  }

  // If team IDs are being updated, fetch team names
  if (updates.teamAId || updates.teamBId) {
    const matchDoc = await adminDb!.collection('preseasonMatches').doc(id).get()
    if (!matchDoc.exists) {
      throw new Error('Match not found')
    }

    const currentData = matchDoc.data()!
    const teamAId = updates.teamAId || currentData.teamAId
    const teamBId = updates.teamBId || currentData.teamBId

    // Fetch team names
    const [teamADoc, teamBDoc] = await Promise.all([
      adminDb!.collection('teams').doc(teamAId).get(),
      adminDb!.collection('teams').doc(teamBId).get(),
    ])

    if (!teamADoc.exists || !teamBDoc.exists) {
      throw new Error('One or both teams not found')
    }

    updateData.teamAId = teamAId
    updateData.teamBId = teamBId
    updateData.teamAName = teamADoc.data()!.name
    updateData.teamBName = teamBDoc.data()!.name
  }

  // Add other updates
  if (updates.date) {
    updateData.date = Timestamp.fromDate(updates.date)
  }
  if (updates.time !== undefined) {
    updateData.time = updates.time
  }
  if (updates.location !== undefined) {
    updateData.location = updates.location
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status
  }
  if (updates.scoreA !== undefined) {
    updateData.scoreA = updates.scoreA
  }
  if (updates.scoreB !== undefined) {
    updateData.scoreB = updates.scoreB
  }
  if (updates.penaltiesA !== undefined) {
    updateData.penaltiesA = updates.penaltiesA
  }
  if (updates.penaltiesB !== undefined) {
    updateData.penaltiesB = updates.penaltiesB
  }

  await adminDb!.collection('preseasonMatches').doc(id).update(updateData)
}

export async function deletePreseasonMatch(id: string): Promise<void> {
  await adminDb!.collection('preseasonMatches').doc(id).delete()
}

// ========== PRESEASON STATS ==========

export async function getPreseasonStats(): Promise<PreseasonStats[]> {
  const snapshot = await adminDb!.collection('preseasonStats').get()

  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as PreseasonStats
  })
}

export async function getPreseasonStatsByTeamId(teamId: string): Promise<PreseasonStats | null> {
  const snapshot = await adminDb!.collection('preseasonStats')
    .where('teamId', '==', teamId)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
  } as PreseasonStats
}

export async function getOrCreatePreseasonStats(teamId: string, teamName: string): Promise<PreseasonStats> {
  const existing = await getPreseasonStatsByTeamId(teamId)
  if (existing) return existing

  // Create new stats
  const now = Timestamp.now()
  const docRef = await adminDb!.collection('preseasonStats').add({
    teamId,
    teamName,
    played: 0,
    wins: 0,
    losses: 0,
    penaltyWins: 0,
    penaltyLosses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    updatedAt: now,
  })

  const doc = await docRef.get()
  const data = doc.data()!
  return {
    id: doc.id,
    ...data,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
  } as PreseasonStats
}

export async function updatePreseasonStats(teamId: string, stats: Partial<PreseasonStats>): Promise<void> {
  const existing = await getPreseasonStatsByTeamId(teamId)
  
  if (!existing) {
    throw new Error(`Preseason stats not found for team ${teamId}`)
  }

  const updateData: any = {
    ...stats,
    updatedAt: Timestamp.now(),
  }

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key]
    }
  })

  await adminDb!.collection('preseasonStats').doc(existing.id).update(updateData)
}

// ========== RANKING CALCULATION ==========

export async function calculatePreseasonRanking(): Promise<PreseasonStats[]> {
  const allStats = await getPreseasonStats()

  // Sort by:
  // 1. Points (descending)
  // 2. Goal difference (descending)
  // 3. Goals scored (descending)
  // 4. Penalty wins (descending)
  // 5. Random fallback (by team name)
  return allStats.sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) {
      return b.points - a.points
    }

    // 2. Goal difference
    const diffA = a.goalsFor - a.goalsAgainst
    const diffB = b.goalsFor - b.goalsAgainst
    if (diffB !== diffA) {
      return diffB - diffA
    }

    // 3. Goals scored
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor
    }

    // 4. Penalty wins
    if (b.penaltyWins !== a.penaltyWins) {
      return b.penaltyWins - a.penaltyWins
    }

    // 5. Random fallback (by team name)
    return a.teamName.localeCompare(b.teamName)
  })
}

// ========== RESULT PROCESSING ==========

export async function processPreseasonResult(
  matchId: string,
  scoreA: number,
  scoreB: number,
  penaltiesA?: number,
  penaltiesB?: number
): Promise<void> {
  const match = await getPreseasonMatchById(matchId)
  if (!match) {
    throw new Error('Match not found')
  }

  if (match.status === 'finished') {
    throw new Error('Match already finished')
  }

  // Determine winner and points
  let teamAWon = false
  let teamBWon = false
  let teamAPoints = 0
  let teamBPoints = 0

  if (scoreA > scoreB) {
    // Team A won in regular time
    teamAWon = true
    teamAPoints = 3
    teamBPoints = 0
  } else if (scoreB > scoreA) {
    // Team B won in regular time
    teamBWon = true
    teamAPoints = 0
    teamBPoints = 3
  } else {
    // Draw - check penalties
    if (penaltiesA !== undefined && penaltiesB !== undefined) {
      if (penaltiesA > penaltiesB) {
        // Team A won on penalties
        teamAPoints = 2
        teamBPoints = 1
      } else if (penaltiesB > penaltiesA) {
        // Team B won on penalties
        teamAPoints = 1
        teamBPoints = 2
      } else {
        // Penalties also tied (shouldn't happen, but handle it)
        teamAPoints = 1
        teamBPoints = 1
      }
    } else {
      // Draw without penalties (shouldn't happen, but handle it)
      teamAPoints = 1
      teamBPoints = 1
    }
  }

  // Get or create stats for both teams
  const statsA = await getOrCreatePreseasonStats(match.teamAId, match.teamAName)
  const statsB = await getOrCreatePreseasonStats(match.teamBId, match.teamBName)

  // Update Team A stats
  const newStatsA: Partial<PreseasonStats> = {
    played: statsA.played + 1,
    goalsFor: statsA.goalsFor + scoreA,
    goalsAgainst: statsA.goalsAgainst + scoreB,
    points: statsA.points + teamAPoints,
  }

  if (teamAWon) {
    newStatsA.wins = statsA.wins + 1
  } else if (teamBWon) {
    newStatsA.losses = statsA.losses + 1
  } else {
    // Draw
    if (penaltiesA !== undefined && penaltiesB !== undefined) {
      if (penaltiesA > penaltiesB) {
        newStatsA.penaltyWins = statsA.penaltyWins + 1
      } else if (penaltiesB > penaltiesA) {
        newStatsA.penaltyLosses = statsA.penaltyLosses + 1
      }
    }
  }

  // Update Team B stats
  const newStatsB: Partial<PreseasonStats> = {
    played: statsB.played + 1,
    goalsFor: statsB.goalsFor + scoreB,
    goalsAgainst: statsB.goalsAgainst + scoreA,
    points: statsB.points + teamBPoints,
  }

  if (teamBWon) {
    newStatsB.wins = statsB.wins + 1
  } else if (teamAWon) {
    newStatsB.losses = statsB.losses + 1
  } else {
    // Draw
    if (penaltiesA !== undefined && penaltiesB !== undefined) {
      if (penaltiesB > penaltiesA) {
        newStatsB.penaltyWins = statsB.penaltyWins + 1
      } else if (penaltiesA > penaltiesB) {
        newStatsB.penaltyLosses = statsB.penaltyLosses + 1
      }
    }
  }

  // Update stats in database
  await updatePreseasonStats(match.teamAId, newStatsA)
  await updatePreseasonStats(match.teamBId, newStatsB)

  // Update match status
  await updatePreseasonMatch(matchId, {
    status: 'finished',
    scoreA,
    scoreB,
    penaltiesA,
    penaltiesB,
  })
}

