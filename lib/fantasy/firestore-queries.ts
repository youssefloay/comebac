/**
 * Optimized Firestore queries for Fantasy mode
 * 
 * This module provides efficient query functions with:
 * - Composite indexes for complex queries
 * - Efficient pagination with cursors
 * - Batch operations for bulk updates
 * - Query result caching strategies
 */

import { adminDb } from '@/lib/firebase-admin'
import type { FantasyTeam, PlayerFantasyStats } from '@/lib/types/fantasy'

/**
 * Pagination cursor for efficient pagination
 */
export interface PaginationCursor {
  lastDoc: FirebaseFirestore.DocumentSnapshot | null
  hasMore: boolean
}

/**
 * Leaderboard query options
 */
export interface LeaderboardQueryOptions {
  type: 'global' | 'weekly'
  limit?: number
  cursor?: FirebaseFirestore.DocumentSnapshot | null
}

/**
 * Leaderboard result with pagination
 */
export interface LeaderboardResult {
  teams: any[]
  cursor: PaginationCursor
  total?: number
}

/**
 * Fetch leaderboard with efficient cursor-based pagination
 * Uses composite index on (totalPoints DESC, createdAt ASC) or (gameweekPoints DESC, createdAt ASC)
 * 
 * @param options - Query options including type, limit, and cursor
 * @returns Leaderboard teams with pagination cursor
 */
export async function fetchLeaderboardPaginated(
  options: LeaderboardQueryOptions
): Promise<LeaderboardResult> {
  const { type, limit = 50, cursor } = options
  const sortField = type === 'global' ? 'totalPoints' : 'gameweekPoints'
  
  let query = adminDb
    .collection('fantasy_teams')
    .orderBy(sortField, 'desc')
    .orderBy('createdAt', 'asc') // Secondary sort for consistent pagination
    .limit(limit + 1) // Fetch one extra to check if there are more results

  // Apply cursor for pagination
  if (cursor) {
    query = query.startAfter(cursor)
  }

  const snapshot = await query.get()
  const docs = snapshot.docs
  
  // Check if there are more results
  const hasMore = docs.length > limit
  const teams = docs.slice(0, limit).map(doc => ({
    id: doc.id,
    ...doc.data()
  }))

  return {
    teams,
    cursor: {
      lastDoc: teams.length > 0 ? docs[limit - 1] : null,
      hasMore
    }
  }
}

/**
 * Fetch top N teams efficiently without fetching all teams
 * Useful for displaying top 10, top 100, etc.
 * 
 * @param type - 'global' or 'weekly'
 * @param limit - Number of top teams to fetch
 * @returns Top teams with calculated ranks
 */
export async function fetchTopTeams(
  type: 'global' | 'weekly',
  limit: number = 100
): Promise<any[]> {
  const sortField = type === 'global' ? 'totalPoints' : 'gameweekPoints'
  
  const snapshot = await adminDb
    .collection('fantasy_teams')
    .orderBy(sortField, 'desc')
    .orderBy('createdAt', 'asc')
    .limit(limit)
    .get()

  // Calculate ranks efficiently
  let currentRank = 1
  let previousPoints = -1
  
  return snapshot.docs.map((doc, index) => {
    const data = doc.data()
    const points = data[sortField] || 0
    
    if (points !== previousPoints) {
      currentRank = index + 1
      previousPoints = points
    }

    return {
      id: doc.id,
      ...data,
      rank: currentRank
    }
  })
}

/**
 * Find user's team rank efficiently without fetching all teams
 * Uses a count query to determine rank
 * 
 * @param userId - User ID to find rank for
 * @param type - 'global' or 'weekly'
 * @returns User's team with rank
 */
export async function findUserTeamRank(
  userId: string,
  type: 'global' | 'weekly'
): Promise<{ team: any; rank: number } | null> {
  const sortField = type === 'global' ? 'totalPoints' : 'gameweekPoints'
  
  // Get user's team
  const teamSnapshot = await adminDb
    .collection('fantasy_teams')
    .where('userId', '==', userId)
    .limit(1)
    .get()

  if (teamSnapshot.empty) {
    return null
  }

  const teamDoc = teamSnapshot.docs[0]
  const teamData = teamDoc.data()
  const userPoints = teamData[sortField] || 0

  // Count teams with more points (this is the rank - 1)
  const higherTeamsSnapshot = await adminDb
    .collection('fantasy_teams')
    .where(sortField, '>', userPoints)
    .count()
    .get()

  const rank = higherTeamsSnapshot.data().count + 1

  return {
    team: {
      id: teamDoc.id,
      ...teamData
    },
    rank
  }
}

/**
 * Batch update ranks for multiple teams efficiently
 * Uses Firestore batch writes (max 500 operations per batch)
 * 
 * @param teams - Teams with their calculated ranks
 * @param type - 'global' or 'weekly'
 */
export async function batchUpdateRanks(
  teams: Array<{ id: string; rank: number }>,
  type: 'global' | 'weekly'
): Promise<void> {
  const rankField = type === 'global' ? 'rank' : 'weeklyRank'
  const batchSize = 500
  
  for (let i = 0; i < teams.length; i += batchSize) {
    const batch = adminDb.batch()
    const batchTeams = teams.slice(i, i + batchSize)
    
    for (const team of batchTeams) {
      const teamRef = adminDb.collection('fantasy_teams').doc(team.id)
      batch.update(teamRef, {
        [rankField]: team.rank,
        updatedAt: new Date()
      })
    }
    
    await batch.commit()
  }
}

/**
 * Fetch player fantasy stats with efficient filtering
 * Uses composite index on (price ASC, totalPoints DESC)
 * 
 * @param filters - Optional filters for price range, position, etc.
 * @param limit - Maximum number of results
 * @returns Player fantasy stats
 */
export async function fetchPlayerFantasyStats(
  filters?: {
    minPrice?: number
    maxPrice?: number
    minPoints?: number
    position?: string
  },
  limit: number = 100
): Promise<PlayerFantasyStats[]> {
  let query: FirebaseFirestore.Query = adminDb.collection('player_fantasy_stats')

  // Apply filters
  if (filters?.minPrice !== undefined) {
    query = query.where('price', '>=', filters.minPrice)
  }
  if (filters?.maxPrice !== undefined) {
    query = query.where('price', '<=', filters.maxPrice)
  }
  if (filters?.minPoints !== undefined) {
    query = query.where('totalPoints', '>=', filters.minPoints)
  }

  // Order by price and points for efficient filtering
  query = query
    .orderBy('price', 'asc')
    .orderBy('totalPoints', 'desc')
    .limit(limit)

  const snapshot = await query.get()
  
  return snapshot.docs.map(doc => ({
    playerId: doc.id,
    ...doc.data()
  } as PlayerFantasyStats))
}

/**
 * Fetch teams that have a specific player
 * Useful for updating teams after a player's performance
 * 
 * @param playerId - Player ID to search for
 * @returns Teams that have this player
 */
export async function fetchTeamsWithPlayer(
  playerId: string
): Promise<FantasyTeam[]> {
  // Note: This requires an array-contains query
  // Firestore doesn't support array-contains on nested objects efficiently
  // So we fetch all teams and filter in memory (acceptable for Fantasy scale)
  
  const snapshot = await adminDb
    .collection('fantasy_teams')
    .get()

  const teams: FantasyTeam[] = []
  
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const hasPlayer = data.players?.some((p: any) => p.playerId === playerId)
    
    if (hasPlayer) {
      teams.push({
        id: doc.id,
        ...data
      } as FantasyTeam)
    }
  }

  return teams
}

/**
 * Fetch gameweek history for a team with efficient pagination
 * Uses composite index on (teamId ASC, gameweek DESC)
 * 
 * @param teamId - Team ID
 * @param limit - Number of gameweeks to fetch
 * @returns Gameweek history ordered by most recent first
 */
export async function fetchGameweekHistory(
  teamId: string,
  limit: number = 10
): Promise<any[]> {
  const snapshot = await adminDb
    .collection('fantasy_gameweek_history')
    .where('teamId', '==', teamId)
    .orderBy('gameweek', 'desc')
    .limit(limit)
    .get()

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

/**
 * Fetch user badges efficiently
 * Uses composite index on (userId ASC, earnedAt DESC)
 * 
 * @param userId - User ID
 * @param limit - Number of badges to fetch
 * @returns User's badges ordered by most recent first
 */
export async function fetchUserBadges(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const snapshot = await adminDb
    .collection('fantasy_badges')
    .where('userId', '==', userId)
    .orderBy('earnedAt', 'desc')
    .limit(limit)
    .get()

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

/**
 * Batch fetch user information for multiple user IDs
 * Efficiently handles Firestore's 'in' query limit of 10 items
 * 
 * @param userIds - Array of user IDs
 * @returns Map of userId to user data
 */
export async function batchFetchUsers(
  userIds: string[]
): Promise<Map<string, any>> {
  const usersMap = new Map()
  
  // Remove duplicates
  const uniqueUserIds = Array.from(new Set(userIds))
  
  // Batch in groups of 10 (Firestore 'in' limit)
  for (let i = 0; i < uniqueUserIds.length; i += 10) {
    const batch = uniqueUserIds.slice(i, i + 10)
    
    const snapshot = await adminDb
      .collection('users')
      .where('__name__', 'in', batch)
      .get()

    snapshot.docs.forEach(doc => {
      usersMap.set(doc.id, {
        id: doc.id,
        ...doc.data()
      })
    })
  }

  return usersMap
}

/**
 * Batch fetch player information for multiple player IDs
 * Efficiently handles Firestore's 'in' query limit of 10 items
 * 
 * @param playerIds - Array of player IDs
 * @returns Map of playerId to player data
 */
export async function batchFetchPlayers(
  playerIds: string[]
): Promise<Map<string, any>> {
  const playersMap = new Map()
  
  // Remove duplicates
  const uniquePlayerIds = Array.from(new Set(playerIds))
  
  // Batch in groups of 10 (Firestore 'in' limit)
  for (let i = 0; i < uniquePlayerIds.length; i += 10) {
    const batch = uniquePlayerIds.slice(i, i + 10)
    
    const snapshot = await adminDb
      .collection('players')
      .where('__name__', 'in', batch)
      .get()

    snapshot.docs.forEach(doc => {
      playersMap.set(doc.id, {
        id: doc.id,
        ...doc.data()
      })
    })
  }

  return playersMap
}

/**
 * Batch fetch team information for multiple team IDs
 * Efficiently handles Firestore's 'in' query limit of 10 items
 * 
 * @param teamIds - Array of team IDs
 * @returns Map of teamId to team data
 */
export async function batchFetchTeams(
  teamIds: string[]
): Promise<Map<string, any>> {
  const teamsMap = new Map()
  
  // Remove duplicates
  const uniqueTeamIds = Array.from(new Set(teamIds))
  
  // Batch in groups of 10 (Firestore 'in' limit)
  for (let i = 0; i < uniqueTeamIds.length; i += 10) {
    const batch = uniqueTeamIds.slice(i, i + 10)
    
    const snapshot = await adminDb
      .collection('teams')
      .where('__name__', 'in', batch)
      .get()

    snapshot.docs.forEach(doc => {
      teamsMap.set(doc.id, {
        id: doc.id,
        ...doc.data()
      })
    })
  }

  return teamsMap
}
