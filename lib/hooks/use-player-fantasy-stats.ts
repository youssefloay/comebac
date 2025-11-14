"use client"

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { PlayerFantasyStats } from '@/lib/types/fantasy'

/**
 * Response structure from the player stats API
 */
interface PlayerFantasyStatsResponse {
  success: boolean
  stats: PlayerFantasyStats
  playerInfo: {
    id: string
    name: string
    photo: string | null
    position: string
    number: number | null
    school: string | null
    isCaptain: boolean
    teamId: string | null
    teamName: string | null
    teamLogo: string | null
    teamColor: string | null
    seasonStats: {
      goals: number
      assists: number
      matches: number
      yellowCards: number
      redCards: number
      minutesPlayed: number
    }
  }
  formAverage: number
  priceDirection: 'up' | 'down' | 'stable'
  error?: string
}

/**
 * Complete player fantasy data including stats and player info
 */
export interface PlayerFantasyData {
  stats: PlayerFantasyStats
  playerInfo: PlayerFantasyStatsResponse['playerInfo']
  formAverage: number
  priceDirection: 'up' | 'down' | 'stable'
}

interface UsePlayerFantasyStatsOptions {
  enabled?: boolean
  refetchInterval?: number | false
  staleTime?: number
  cacheTime?: number
}

/**
 * Hook to fetch and cache a player's fantasy statistics
 * Uses React Query for automatic caching, refetching, and error handling
 * 
 * @param playerId - The player ID to fetch fantasy stats for
 * @param options - Optional configuration for the query
 * @returns Query result with player fantasy data, loading state, and error handling
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePlayerFantasyStats('player123')
 * 
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 * 
 * return (
 *   <div>
 *     <h2>{data.playerInfo.name}</h2>
 *     <p>Price: {data.stats.price}M€</p>
 *     <p>Points: {data.stats.totalPoints}</p>
 *     <p>Popularity: {data.stats.popularity}%</p>
 *   </div>
 * )
 * ```
 */
export function usePlayerFantasyStats(
  playerId: string | null | undefined,
  options: UsePlayerFantasyStatsOptions = {}
): UseQueryResult<PlayerFantasyData, Error> {
  const {
    enabled = true,
    refetchInterval = false,
    staleTime = 10 * 60 * 1000, // 10 minutes (longer than team since player stats change less frequently)
    cacheTime = 60 * 60 * 1000  // 60 minutes
  } = options

  return useQuery<PlayerFantasyData, Error>({
    queryKey: ['player-fantasy-stats', playerId],
    queryFn: async () => {
      if (!playerId) {
        throw new Error('Player ID is required')
      }

      const response = await fetch(`/api/fantasy/player-stats/${playerId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('PLAYER_NOT_FOUND')
        }
        throw new Error(`Failed to fetch player fantasy stats: ${response.statusText}`)
      }

      const data: PlayerFantasyStatsResponse = await response.json()
      
      if (!data.success || !data.stats) {
        throw new Error(data.error || 'Failed to load player fantasy stats')
      }

      return {
        stats: data.stats,
        playerInfo: data.playerInfo,
        formAverage: data.formAverage,
        priceDirection: data.priceDirection
      }
    },
    enabled: enabled && !!playerId,
    staleTime,
    gcTime: cacheTime,
    refetchInterval,
    retry: (failureCount, error) => {
      // Don't retry if player not found
      if (error.message === 'PLAYER_NOT_FOUND') {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}
