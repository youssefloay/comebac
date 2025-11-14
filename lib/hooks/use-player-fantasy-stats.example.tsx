"use client"

import { usePlayerFantasyStats } from './use-player-fantasy-stats'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * Example 1: Basic usage - Display player fantasy stats
 */
export function PlayerFantasyStatsBasic({ playerId }: { playerId: string }) {
  const { data, isLoading, error } = usePlayerFantasyStats(playerId)

  if (isLoading) {
    return <div className="animate-pulse">Loading player stats...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>
  }

  if (!data) {
    return <div>No data available</div>
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {data.playerInfo.photo && (
          <img
            src={data.playerInfo.photo}
            alt={data.playerInfo.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="font-bold text-lg">{data.playerInfo.name}</h3>
          <p className="text-sm text-gray-600">
            {data.playerInfo.position} - {data.playerInfo.teamName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-sm text-gray-600">Price</p>
          <p className="text-xl font-bold">{data.stats.price}M€</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Points</p>
          <p className="text-xl font-bold">{data.stats.totalPoints}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Popularity</p>
          <p className="text-xl font-bold">{data.stats.popularity}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Form</p>
          <p className="text-xl font-bold">{data.formAverage.toFixed(1)}</p>
        </div>
      </div>
    </Card>
  )
}

/**
 * Example 2: With price direction indicator
 */
export function PlayerFantasyStatsWithPriceDirection({ playerId }: { playerId: string }) {
  const { data, isLoading } = usePlayerFantasyStats(playerId)

  if (isLoading || !data) return null

  const PriceIcon = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus
  }[data.priceDirection]

  const priceColor = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  }[data.priceDirection]

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold">{data.stats.price}M€</span>
      <PriceIcon className={`w-5 h-5 ${priceColor}`} />
      {data.stats.priceChange !== 0 && (
        <span className={`text-sm ${priceColor}`}>
          {data.stats.priceChange > 0 ? '+' : ''}{data.stats.priceChange}M€
        </span>
      )}
    </div>
  )
}

/**
 * Example 3: With custom options - Auto-refresh every 5 minutes
 */
export function PlayerFantasyStatsAutoRefresh({ playerId }: { playerId: string }) {
  const { data, isLoading, dataUpdatedAt } = usePlayerFantasyStats(playerId, {
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000 // Consider stale after 2 minutes
  })

  if (isLoading || !data) return null

  return (
    <div>
      <h3>{data.playerInfo.name}</h3>
      <p>Points: {data.stats.totalPoints}</p>
      <p className="text-xs text-gray-500">
        Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
      </p>
    </div>
  )
}

/**
 * Example 4: Conditional fetching - Only fetch when modal is open
 */
export function PlayerFantasyStatsModal({ 
  playerId, 
  isOpen 
}: { 
  playerId: string
  isOpen: boolean 
}) {
  const { data, isLoading } = usePlayerFantasyStats(playerId, {
    enabled: isOpen // Only fetch when modal is open
  })

  if (!isOpen) return null

  return (
    <div className="modal">
      {isLoading ? (
        <div>Loading...</div>
      ) : data ? (
        <div>
          <h2>{data.playerInfo.name}</h2>
          <div className="stats-grid">
            <div>
              <label>Price</label>
              <span>{data.stats.price}M€</span>
            </div>
            <div>
              <label>Points</label>
              <span>{data.stats.totalPoints}</span>
            </div>
            <div>
              <label>Selected by</label>
              <span>{data.stats.selectedBy} teams ({data.stats.popularity}%)</span>
            </div>
            <div>
              <label>Form (last 5)</label>
              <span>{data.formAverage.toFixed(1)} pts/game</span>
            </div>
          </div>
          
          <div className="season-stats">
            <h3>Season Stats</h3>
            <p>Goals: {data.playerInfo.seasonStats.goals}</p>
            <p>Assists: {data.playerInfo.seasonStats.assists}</p>
            <p>Matches: {data.playerInfo.seasonStats.matches}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Example 5: Multiple players comparison
 */
export function PlayerFantasyStatsComparison({ 
  playerIds 
}: { 
  playerIds: string[] 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {playerIds.map(playerId => (
        <PlayerComparisonCard key={playerId} playerId={playerId} />
      ))}
    </div>
  )
}

function PlayerComparisonCard({ playerId }: { playerId: string }) {
  const { data, isLoading } = usePlayerFantasyStats(playerId)

  if (isLoading) {
    return <Card className="p-4 animate-pulse h-48" />
  }

  if (!data) return null

  return (
    <Card className="p-4">
      <h4 className="font-bold">{data.playerInfo.name}</h4>
      <p className="text-sm text-gray-600">{data.playerInfo.position}</p>
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Price:</span>
          <span className="font-semibold">{data.stats.price}M€</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Points:</span>
          <span className="font-semibold">{data.stats.totalPoints}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Form:</span>
          <span className="font-semibold">{data.formAverage.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Popularity:</span>
          <span className="font-semibold">{data.stats.popularity}%</span>
        </div>
      </div>
    </Card>
  )
}

/**
 * Example 6: Error handling with fallback
 */
export function PlayerFantasyStatsWithFallback({ playerId }: { playerId: string }) {
  const { data, isLoading, error, refetch } = usePlayerFantasyStats(playerId)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-800 mb-2">Failed to load player stats</p>
        <button 
          onClick={() => refetch()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return <div>No data available</div>
  }

  return (
    <div>
      <h3>{data.playerInfo.name}</h3>
      <p>Price: {data.stats.price}M€</p>
      <p>Points: {data.stats.totalPoints}</p>
    </div>
  )
}
