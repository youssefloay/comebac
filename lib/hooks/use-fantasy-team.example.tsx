"use client"

import { useFantasyTeam } from './use-fantasy-team'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * Example component demonstrating how to use the useFantasyTeam hook
 */
export function FantasyTeamExample() {
  const { user } = useAuth()
  
  // Basic usage
  const { data: team, isLoading, error, refetch } = useFantasyTeam(user?.uid)

  // Usage with custom options
  const {
    data: teamWithRefetch,
    isLoading: isLoadingWithRefetch,
    error: errorWithRefetch
  } = useFantasyTeam(user?.uid, {
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  })

  // Usage with conditional fetching
  const {
    data: conditionalTeam,
    isLoading: isLoadingConditional,
    error: errorConditional
  } = useFantasyTeam(user?.uid, {
    enabled: !!user, // Only fetch if user is authenticated
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    // Handle specific error cases
    if (error.message === 'TEAM_NOT_FOUND') {
      return (
        <div className="text-center p-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vous n'avez pas encore créé d'équipe Fantasy
          </p>
          <button
            onClick={() => window.location.href = '/public/fantasy/create'}
            className="px-4 py-2 bg-sofa-green text-white rounded-lg hover:bg-sofa-green/90"
          >
            Créer mon équipe
          </button>
        </div>
      )
    }

    return (
      <div className="text-center p-8">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Erreur: {error.message}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!team) {
    return null
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{team.teamName}</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Points totaux</p>
          <p className="text-2xl font-bold">{team.totalPoints}</p>
        </div>
        
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Rang</p>
          <p className="text-2xl font-bold">#{team.rank || '-'}</p>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Joueurs ({team.players.length})</h3>
        <ul className="space-y-2">
          {team.players.map((player) => (
            <li
              key={player.playerId}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <div>
                <span className="font-medium">{player.position}</span>
                {player.isCaptain && (
                  <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                    Capitaine
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold">{player.points} pts</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {player.price}M€
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => refetch()}
        className="w-full px-4 py-2 bg-sofa-green text-white rounded-lg hover:bg-sofa-green/90"
      >
        Actualiser
      </button>
    </div>
  )
}

/**
 * Example of using the hook in a page component
 */
export function MyTeamPageExample() {
  const { user } = useAuth()
  const { data: team, isLoading, error } = useFantasyTeam(user?.uid)

  // The hook automatically:
  // - Caches the data for 5 minutes (staleTime)
  // - Keeps the cache for 30 minutes (gcTime)
  // - Retries failed requests up to 2 times
  // - Doesn't refetch on window focus
  // - Handles loading and error states

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {error && <div>Error: {error.message}</div>}
      {team && (
        <div>
          <h1>{team.teamName}</h1>
          <p>Points: {team.totalPoints}</p>
        </div>
      )}
    </div>
  )
}
