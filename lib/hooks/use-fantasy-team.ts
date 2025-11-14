"use client"

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { FantasyTeam } from '@/lib/types/fantasy'

/**
 * Response structure from the get-team API
 */
interface FantasyTeamResponse {
  success: boolean
  team: FantasyTeam
  error?: string
}

interface UseFantasyTeamOptions {
  enabled?: boolean
  refetchInterval?: number | false
  staleTime?: number
  cacheTime?: number
}

/**
 * Hook to fetch and cache a user's fantasy team
 * Uses React Query for automatic caching, refetching, and error handling
 * 
 * @param userId - The user ID to fetch the fantasy team for
 * @param options - Optional configuration for the query
 * @returns Query result with fantasy team data, loading state, and error handling
 * 
 * @example
 * ```tsx
 * const { data: team, isLoading, error, refetch } = useFantasyTeam(user?.uid)
 * 
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 * 
 * return (
 *   <div>
 *     <h2>{team.teamName}</h2>
 *     <p>Total Points: {team.totalPoints}</p>
 *     <p>Rank: #{team.rank}</p>
 *   </div>
 * )
 * ```
 */
export function useFantasyTeam(
  userId: string | null | undefined,
  options: UseFantasyTeamOptions = {}
): UseQueryResult<FantasyTeam, Error> {
  const {
    enabled = true,
    refetchInterval = false,
    staleTime = 5 * 60 * 1000, // 5 minutes (team data changes frequently with matches)
    cacheTime = 30 * 60 * 1000  // 30 minutes
  } = options

  return useQuery<FantasyTeam, Error>({
    queryKey: ['fantasy-team', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required')
      }

      const response = await fetch(`/api/fantasy/get-team?userId=${userId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('TEAM_NOT_FOUND')
        }
        throw new Error(`Failed to fetch fantasy team: ${response.statusText}`)
      }

      const data: FantasyTeamResponse = await response.json()
      
      if (!data.success || !data.team) {
        throw new Error(data.error || 'Failed to load fantasy team')
      }

      return data.team
    },
    enabled: enabled && !!userId,
    staleTime,
    gcTime: cacheTime,
    refetchInterval,
    retry: (failureCount, error) => {
      // Don't retry if team not found
      if (error.message === 'TEAM_NOT_FOUND') {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}
