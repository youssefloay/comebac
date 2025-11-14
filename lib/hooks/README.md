# Hooks

Custom React hooks for the ComeBac League application.

## Fantasy Hooks

### `useFantasyTeam`

A React Query hook for fetching and caching a user's fantasy team data.

#### Features

- **Automatic caching**: Data is cached for 5 minutes by default
- **Smart refetching**: Configurable refetch intervals
- **Error handling**: Built-in retry logic and error states
- **Loading states**: Automatic loading state management
- **Type-safe**: Full TypeScript support

#### Basic Usage

```tsx
import { useFantasyTeam } from '@/lib/hooks/use-fantasy-team'
import { useAuth } from '@/lib/auth-context'

function MyTeamPage() {
  const { user } = useAuth()
  const { data: team, isLoading, error } = useFantasyTeam(user?.uid)

  if (isLoading) return <LoadingSpinner />
  if (error) return <div>Error: {error.message}</div>
  if (!team) return null

  return (
    <div>
      <h1>{team.teamName}</h1>
      <p>Points: {team.totalPoints}</p>
    </div>
  )
}
```

#### Advanced Usage

```tsx
// With custom options
const { data: team, isLoading, error, refetch } = useFantasyTeam(user?.uid, {
  refetchInterval: 30000, // Refetch every 30 seconds
  staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  cacheTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  enabled: !!user, // Only fetch when user is available
})

// Manual refetch
<button onClick={() => refetch()}>Refresh</button>
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable the query |
| `refetchInterval` | `number \| false` | `false` | Auto-refetch interval in ms |
| `staleTime` | `number` | `300000` (5 min) | Time before data is considered stale |
| `cacheTime` | `number` | `1800000` (30 min) | Time to keep data in cache |

#### Error Handling

The hook provides specific error messages:

- `TEAM_NOT_FOUND`: User hasn't created a fantasy team yet
- Other errors: Network or server errors

```tsx
if (error) {
  if (error.message === 'TEAM_NOT_FOUND') {
    // Redirect to team creation
    router.push('/public/fantasy/create')
  } else {
    // Show error message
    toast.error(error.message)
  }
}
```

#### Return Value

The hook returns a `UseQueryResult` object with:

- `data`: The fantasy team data (or `undefined` if loading/error)
- `isLoading`: `true` while fetching for the first time
- `isFetching`: `true` while fetching (including background refetches)
- `error`: Error object if the request failed
- `refetch`: Function to manually trigger a refetch
- `isSuccess`: `true` if the query succeeded
- `isError`: `true` if the query failed

### `usePlayerFantasyStats`

A React Query hook for fetching and caching player fantasy statistics.

#### Features

- **Automatic caching**: Data is cached for 10 minutes by default (longer than team data)
- **Smart refetching**: Configurable refetch intervals
- **Error handling**: Built-in retry logic and error states
- **Loading states**: Automatic loading state management
- **Type-safe**: Full TypeScript support
- **Complete data**: Includes stats, player info, form average, and price direction

#### Basic Usage

```tsx
import { usePlayerFantasyStats } from '@/lib/hooks/use-player-fantasy-stats'

function PlayerProfile({ playerId }: { playerId: string }) {
  const { data, isLoading, error } = usePlayerFantasyStats(playerId)

  if (isLoading) return <LoadingSpinner />
  if (error) return <div>Error: {error.message}</div>
  if (!data) return null

  return (
    <div>
      <h1>{data.playerInfo.name}</h1>
      <p>Price: {data.stats.price}M€</p>
      <p>Total Points: {data.stats.totalPoints}</p>
      <p>Popularity: {data.stats.popularity}%</p>
      <p>Form: {data.formAverage.toFixed(1)} pts/game</p>
    </div>
  )
}
```

#### Advanced Usage

```tsx
// With custom options
const { data, isLoading, error, refetch } = usePlayerFantasyStats(playerId, {
  refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  cacheTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  enabled: isModalOpen, // Only fetch when modal is open
})

// Conditional fetching
const { data } = usePlayerFantasyStats(playerId, {
  enabled: !!playerId && isVisible
})
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable the query |
| `refetchInterval` | `number \| false` | `false` | Auto-refetch interval in ms |
| `staleTime` | `number` | `600000` (10 min) | Time before data is considered stale |
| `cacheTime` | `number` | `3600000` (60 min) | Time to keep data in cache |

#### Error Handling

The hook provides specific error messages:

- `PLAYER_NOT_FOUND`: Player doesn't exist
- Other errors: Network or server errors

```tsx
if (error) {
  if (error.message === 'PLAYER_NOT_FOUND') {
    // Show not found message
    return <div>Player not found</div>
  } else {
    // Show error with retry
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    )
  }
}
```

#### Return Value

The hook returns a `UseQueryResult` object with:

- `data`: Object containing:
  - `stats`: Player fantasy statistics (price, points, popularity, form, etc.)
  - `playerInfo`: Player details (name, photo, position, team, season stats)
  - `formAverage`: Average points from last 5 matches
  - `priceDirection`: 'up', 'down', or 'stable'
- `isLoading`: `true` while fetching for the first time
- `isFetching`: `true` while fetching (including background refetches)
- `error`: Error object if the request failed
- `refetch`: Function to manually trigger a refetch
- `isSuccess`: `true` if the query succeeded
- `isError`: `true` if the query failed
- `dataUpdatedAt`: Timestamp of last successful fetch

#### Data Structure

```typescript
interface PlayerFantasyData {
  stats: {
    playerId: string
    price: number
    totalPoints: number
    gameweekPoints: number
    popularity: number
    form: number[]
    priceChange: number
    selectedBy: number
    updatedAt: Timestamp
  }
  playerInfo: {
    id: string
    name: string
    photo: string | null
    position: string
    teamName: string | null
    seasonStats: {
      goals: number
      assists: number
      matches: number
      // ... more stats
    }
  }
  formAverage: number
  priceDirection: 'up' | 'down' | 'stable'
}
```

#### Examples

See `use-player-fantasy-stats.example.tsx` for more usage examples including:
- Price direction indicators
- Auto-refresh functionality
- Conditional fetching
- Multiple players comparison
- Error handling with fallback

## Other Hooks

### `useDomainCheck`

Hook for checking the current domain and Firebase configuration.

See `use-domain-check.ts` for usage.
