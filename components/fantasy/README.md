# Fantasy Components

This directory contains all the React components for the Fantasy mode feature.

## Components

### FantasyPlayerCard

A reusable card component for displaying player information in the Fantasy mode.

#### Features

- **Photo Display**: Shows player photo or fallback with player number
- **Position Badge**: Color-coded badge based on player position (Gardien, Défenseur, Milieu, Attaquant)
- **Price Display**: Shows current Fantasy price with trend indicator
- **Fantasy Stats**: Displays points, form, and popularity
- **Selection State**: Visual feedback for selected/unselected state
- **Responsive**: Compact mode for smaller screens
- **Animations**: Smooth hover and selection animations
- **Dark Mode**: Full support for light/dark themes

#### Props

```typescript
interface FantasyPlayerCardProps {
  player: Player                      // Required: Player data
  fantasyStats?: PlayerFantasyStats   // Optional: Fantasy statistics
  selected?: boolean                  // Selection state (default: false)
  disabled?: boolean                  // Disabled state (default: false)
  onSelect?: (player: Player) => void // Callback when player is selected
  onDeselect?: (player: Player) => void // Callback when player is deselected
  index?: number                      // For staggered animations (default: 0)
  compact?: boolean                   // Compact layout (default: false)
  showStats?: boolean                 // Show fantasy stats (default: true)
}
```

#### Usage Examples

**Basic Usage**

```tsx
import { FantasyPlayerCard } from '@/components/fantasy/player-card'

<FantasyPlayerCard
  player={player}
  fantasyStats={stats}
  onSelect={handleSelect}
  onDeselect={handleDeselect}
/>
```

**With Selection State**

```tsx
const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

<FantasyPlayerCard
  player={player}
  fantasyStats={stats}
  selected={selectedPlayers.includes(player.id)}
  onSelect={(p) => setSelectedPlayers([...selectedPlayers, p.id])}
  onDeselect={(p) => setSelectedPlayers(selectedPlayers.filter(id => id !== p.id))}
/>
```

**Compact Mode**

```tsx
<FantasyPlayerCard
  player={player}
  fantasyStats={stats}
  compact={true}
/>
```

**Grid Layout with Animations**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {players.map((player, index) => (
    <FantasyPlayerCard
      key={player.id}
      player={player}
      fantasyStats={playerStats[player.id]}
      index={index}
      selected={selectedPlayers.includes(player.id)}
      onSelect={handleSelect}
      onDeselect={handleDeselect}
    />
  ))}
</div>
```

**Disabled State**

```tsx
<FantasyPlayerCard
  player={player}
  fantasyStats={stats}
  disabled={budgetExceeded || maxPlayersReached}
/>
```

#### Styling

The component uses the SofaScore theme variables for consistent styling:

- `sofa-text-primary`: Primary text color
- `sofa-text-secondary`: Secondary text color
- `sofa-text-muted`: Muted text color
- `sofa-green`: Accent color for selection
- `sofa-border`: Border color
- `sofa-bg-card`: Card background

Position colors:
- **Gardien**: Yellow
- **Défenseur**: Blue
- **Milieu**: Green
- **Attaquant**: Red

#### Accessibility

- Keyboard navigation support
- Focus states
- ARIA labels for screen readers
- Sufficient color contrast
- Touch-friendly tap targets (44px minimum)

#### Performance

- Uses `framer-motion` for smooth animations
- Optimized re-renders with React.memo (if needed)
- Lazy loading for player images
- Staggered animations for lists

## Development

To see all component variations, check the example file:

```tsx
import { FantasyPlayerCardExample } from '@/components/fantasy/player-card-example'
```

## Requirements Covered

This component addresses the following requirements from the Fantasy mode spec:

- **Requirement 2**: Sélection des joueurs - Display player info (photo, name, school, team, position, price, stats)
- **Requirement 4**: Profil Fantasy des joueurs - Show Fantasy stats (price, points, popularity, form)

### PitchView

A visual representation of a football pitch displaying the Fantasy team formation with player positions.

#### Features

- **Formation Display**: Supports all 5 formations (4-2-0, 3-3-0, 3-2-1, 2-3-1, 2-2-2)
- **Player Positioning**: Automatically positions players based on formation
- **Captain Indicator**: Shows crown badge for the team captain
- **Points Display**: Shows gameweek points for each player with captain multiplier
- **Field Markings**: Realistic pitch markings (center line, circles, penalty areas)
- **Responsive**: Adapts to mobile and desktop screens
- **Interactive**: Optional click handlers for player selection
- **Animations**: Smooth entrance animations for players
- **Photo Support**: Displays player photos or fallback avatars

#### Props

```typescript
interface PitchViewProps {
  players: FantasyPlayer[]              // Required: Array of fantasy players
  playerDetails: Map<string, Player>    // Required: Map of player details
  formation: Formation                  // Required: Team formation
  captainId: string                     // Required: ID of the captain
  compact?: boolean                     // Compact mode for mobile (default: false)
  showPoints?: boolean                  // Show points display (default: true)
  onPlayerClick?: (playerId: string) => void // Optional click handler
}
```

#### Usage Examples

**Basic Usage**

```tsx
import { PitchView } from '@/components/fantasy/pitch-view'

const playerDetailsMap = new Map<string, Player>([
  ['player1', playerData1],
  ['player2', playerData2],
  // ... more players
])

<PitchView
  players={fantasyPlayers}
  playerDetails={playerDetailsMap}
  formation="3-3-1"
  captainId="player5"
/>
```

**With Click Handler**

```tsx
const handlePlayerClick = (playerId: string) => {
  router.push(`/public/fantasy/player/${playerId}`)
}

<PitchView
  players={fantasyPlayers}
  playerDetails={playerDetailsMap}
  formation="3-3-1"
  captainId="player5"
  onPlayerClick={handlePlayerClick}
/>
```

**Compact Mode (Mobile)**

```tsx
<PitchView
  players={fantasyPlayers}
  playerDetails={playerDetailsMap}
  formation="3-3-1"
  captainId="player5"
  compact={true}
/>
```

**Without Points Display**

```tsx
<PitchView
  players={fantasyPlayers}
  playerDetails={playerDetailsMap}
  formation="3-3-1"
  captainId="player5"
  showPoints={false}
/>
```

**Responsive Example**

```tsx
const isMobile = useMediaQuery('(max-width: 768px)')

<PitchView
  players={fantasyPlayers}
  playerDetails={playerDetailsMap}
  formation="3-3-1"
  captainId="player5"
  compact={isMobile}
  showPoints={true}
/>
```

#### Formations Supported

All formations include 1 goalkeeper + 6 field players:

- **4-2-0**: 4 Defenders, 2 Midfielders, 0 Attackers (Defensive)
- **3-3-0**: 3 Defenders, 3 Midfielders, 0 Attackers (Balanced)
- **3-2-1**: 3 Defenders, 2 Midfielders, 1 Attacker (Balanced with striker)
- **2-3-1**: 2 Defenders, 3 Midfielders, 1 Attacker (Offensive)
- **2-2-2**: 2 Defenders, 2 Midfielders, 2 Attackers (Very offensive)
- **2-4-1**: 2 Defenders, 4 Midfielders, 1 Attacker (Offensive)
- **2-3-2**: 2 Defenders, 3 Midfielders, 2 Attackers (Very offensive)

#### Styling

Position colors match the FantasyPlayerCard component:
- **Gardien**: Yellow (bg-yellow-400, border-yellow-600)
- **Défenseur**: Blue (bg-blue-400, border-blue-600)
- **Milieu**: Green (bg-green-400, border-green-600)
- **Attaquant**: Red (bg-red-400, border-red-600)

The pitch uses a realistic green gradient background with white field markings.

#### Captain Display

The captain is indicated by:
- Crown icon badge (yellow) in the top-right corner of the player marker
- Points multiplier (×2) shown next to the points display
- Animated entrance for the crown badge

#### Accessibility

- Semantic HTML structure
- Keyboard navigation support (when interactive)
- Touch-friendly tap targets
- High contrast for player markers
- Clear visual hierarchy

#### Performance

- Uses `framer-motion` for smooth animations
- Percentage-based positioning for responsive layout
- Optimized re-renders
- Lazy loading for player images

## Development

To see all component variations, check the example files:

```tsx
import { FantasyPlayerCardExample } from '@/components/fantasy/player-card-example'
import { FormationSelectorExample } from '@/components/fantasy/formation-selector-example'
import { PitchViewExample } from '@/components/fantasy/pitch-view-example'
```

## Requirements Covered

These components address the following requirements from the Fantasy mode spec:

- **Requirement 2**: Sélection des joueurs - Display player info (photo, name, school, team, position, price, stats)
- **Requirement 3**: Formation et composition - Visual formation display, captain indicator
- **Requirement 4**: Profil Fantasy des joueurs - Show Fantasy stats (price, points, popularity, form)
- **Requirement 5**: Mon Équipe Fantasy - Visual team composition on pitch with points

### SquadBuilder

A comprehensive component for building and managing Fantasy teams. Integrates FormationSelector, PitchView, and FantasyPlayerCard to provide a complete squad building experience.

#### Features

- **Formation Selection**: Choose from 5 available formations
- **Player Selection**: Browse and select players with filtering and search
- **Budget Tracking**: Real-time budget display with visual progress bar
- **Squad Status**: Live composition tracking with position requirements
- **Captain Selection**: Designate team captain with visual feedback
- **Validation**: Real-time validation with error display
- **Pitch Preview**: Visual team preview with PitchView integration
- **Responsive**: Fully responsive design for all screen sizes
- **Animations**: Smooth transitions and feedback animations

#### Props

```typescript
interface SquadBuilderProps {
  availablePlayers: Player[]                    // Required: All available players
  playerFantasyStats: Map<string, PlayerFantasyStats> // Required: Fantasy stats for players
  initialFormation?: Formation                  // Initial formation (default: '4-2-0')
  initialPlayers?: FantasyPlayer[]              // Pre-selected players (default: [])
  initialBudget?: number                        // Starting budget (default: 100)
  teamName?: string                             // Team name for validation
  onSave?: (data: SaveData) => void            // Callback when squad is saved
  onCancel?: () => void                         // Callback when cancelled
  saveButtonText?: string                       // Custom save button text
  showPitchView?: boolean                       // Show pitch preview (default: true)
}

interface SaveData {
  formation: Formation
  players: FantasyPlayer[]
  captainId: string
  budgetRemaining: number
}
```

#### Usage Examples

**Basic Usage - Create New Squad**

```tsx
import { SquadBuilder } from '@/components/fantasy/squad-builder'

const handleSave = (data) => {
  // Save squad to database
  await createFantasyTeam({
    userId: user.id,
    teamName: 'My Team',
    ...data
  })
  router.push('/public/fantasy/my-team')
}

<SquadBuilder
  availablePlayers={players}
  playerFantasyStats={statsMap}
  teamName="My Fantasy Team"
  onSave={handleSave}
  onCancel={() => router.back()}
/>
```

**Edit Existing Squad**

```tsx
const existingPlayers: FantasyPlayer[] = [
  {
    playerId: '1',
    position: 'Gardien',
    price: 5.0,
    points: 45,
    gameweekPoints: 8,
    isCaptain: false
  },
  // ... more players
]

<SquadBuilder
  availablePlayers={players}
  playerFantasyStats={statsMap}
  initialFormation="3-3-1"
  initialPlayers={existingPlayers}
  teamName="My Fantasy Team"
  onSave={handleUpdate}
  saveButtonText="Sauvegarder les modifications"
/>
```

**Compact Mode (Without Pitch View)**

```tsx
<SquadBuilder
  availablePlayers={players}
  playerFantasyStats={statsMap}
  showPitchView={false}
  onSave={handleSave}
/>
```

**With Custom Budget**

```tsx
<SquadBuilder
  availablePlayers={players}
  playerFantasyStats={statsMap}
  initialBudget={120}
  onSave={handleSave}
/>
```

#### Features in Detail

**Budget Tracker**
- Real-time budget calculation
- Visual progress bar with color coding
- Warning when budget is exceeded
- Shows spent and remaining amounts

**Squad Status**
- Live position count tracking
- Visual indicators for each position
- Formation requirements display
- Captain designation status

**Player Filtering**
- Filter by position (All, Gardien, Défenseur, Milieu, Attaquant)
- Search by player name
- Automatic hiding of selected players

**Validation**
- Real-time validation as players are selected
- Budget validation
- Formation compliance checking
- Captain requirement validation
- Duplicate player prevention
- Clear error messages

**Captain Selection**
- Easy captain designation interface
- Visual feedback for selected captain
- Integrated with pitch view display

#### Validation Rules

The SquadBuilder enforces the following rules:

1. **Squad Size**: Exactly 7 players required
2. **Formation**: Must match selected formation requirements
3. **Budget**: Total cost cannot exceed available budget
4. **Captain**: Exactly one captain must be designated
5. **Duplicates**: Same player cannot be selected twice
6. **Position Limits**: Must respect formation position requirements

#### Styling

Uses consistent SofaScore theme:
- Cards with shadow-lg for depth
- sofa-green for primary actions
- Color-coded position badges
- Responsive grid layouts
- Smooth animations with framer-motion

#### Accessibility

- Keyboard navigation support
- Focus management
- ARIA labels for screen readers
- Clear error messages
- Touch-friendly buttons (44px minimum)

#### Performance

- Efficient filtering and search
- Optimized re-renders
- Lazy loading for player cards
- Debounced search input (if needed)

#### Integration Example

```tsx
'use client'

import { useState, useEffect } from 'react'
import { SquadBuilder } from '@/components/fantasy/squad-builder'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function CreateTeamPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [statsMap, setStatsMap] = useState(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // Load players
      const playersSnap = await getDocs(collection(db, 'players'))
      const playersData = playersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPlayers(playersData)

      // Load fantasy stats
      const statsSnap = await getDocs(collection(db, 'player_fantasy_stats'))
      const statsData = new Map()
      statsSnap.docs.forEach(doc => {
        statsData.set(doc.id, doc.data())
      })
      setStatsMap(statsData)

      setLoading(false)
    }
    loadData()
  }, [])

  const handleSave = async (data) => {
    // Save to database
    await createFantasyTeam({
      userId: user.id,
      teamName: 'My Team',
      ...data
    })
    router.push('/public/fantasy/my-team')
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Créer votre équipe</h1>
      <SquadBuilder
        availablePlayers={players}
        playerFantasyStats={statsMap}
        teamName="My Fantasy Team"
        onSave={handleSave}
        onCancel={() => router.back()}
      />
    </div>
  )
}
```

### BudgetTracker

A visual component for tracking Fantasy team budget with real-time updates, progress bar, and alerts.

#### Features

- **Budget Display**: Shows total budget and remaining amount
- **Visual Progress Bar**: Animated progress bar with color coding
- **Over Budget Alert**: Red alert when budget is exceeded
- **Near Limit Warning**: Yellow warning when approaching budget limit (>90%)
- **Responsive**: Works on all screen sizes
- **Animations**: Smooth transitions with framer-motion
- **Flexible Layout**: Can be used with or without Card wrapper
- **Dark Mode**: Full support for light/dark themes

#### Props

```typescript
interface BudgetTrackerProps {
  budget: number              // Required: Total budget available (e.g., 100)
  budgetSpent: number         // Required: Amount already spent
  budgetRemaining: number     // Required: Remaining budget (budget - budgetSpent)
  showCard?: boolean          // Wrap in Card component (default: true)
  className?: string          // Additional CSS classes
}
```

#### Usage Examples

**Basic Usage (with Card wrapper)**

```tsx
import { BudgetTracker } from '@/components/fantasy/budget-tracker'

const budget = 100
const budgetSpent = 45.5
const budgetRemaining = budget - budgetSpent

<BudgetTracker
  budget={budget}
  budgetSpent={budgetSpent}
  budgetRemaining={budgetRemaining}
/>
```

**Without Card Wrapper**

```tsx
<BudgetTracker
  budget={100}
  budgetSpent={45.5}
  budgetRemaining={54.5}
  showCard={false}
  className="p-4 border border-gray-200 rounded-lg"
/>
```

**In Squad Builder Context**

```tsx
const [selectedPlayers, setSelectedPlayers] = useState<FantasyPlayer[]>([])
const budget = 100
const budgetSpent = selectedPlayers.reduce((sum, p) => sum + p.price, 0)
const budgetRemaining = budget - budgetSpent

<BudgetTracker
  budget={budget}
  budgetSpent={budgetSpent}
  budgetRemaining={budgetRemaining}
/>
```

**Real-time Updates**

```tsx
function TeamBuilder() {
  const [players, setPlayers] = useState<FantasyPlayer[]>([])
  const BUDGET = 100
  
  const budgetSpent = players.reduce((sum, p) => sum + p.price, 0)
  const budgetRemaining = BUDGET - budgetSpent

  const addPlayer = (player: FantasyPlayer) => {
    if (budgetRemaining >= player.price) {
      setPlayers([...players, player])
    }
  }

  return (
    <div>
      <BudgetTracker
        budget={BUDGET}
        budgetSpent={budgetSpent}
        budgetRemaining={budgetRemaining}
      />
      {/* Player selection UI */}
    </div>
  )
}
```

#### Visual States

**Normal State (< 90% spent)**
- Green progress bar
- No alerts
- Standard display

**Near Limit Warning (90-100% spent)**
- Yellow progress bar
- Warning message: "Attention: il ne vous reste que X.XM€"
- Yellow alert box

**Over Budget (> 100% spent)**
- Red progress bar
- Error message: "Budget dépassé de X.XM€"
- Red alert box
- Negative remaining amount shown in red

#### Styling

The component uses SofaScore theme variables:

**Colors:**
- Normal: `bg-sofa-green` (green progress bar)
- Warning: `bg-yellow-500` (yellow progress bar)
- Error: `bg-red-500` (red progress bar)
- Text: `text-sofa-text-primary`, `text-sofa-text-muted`

**Progress Bar:**
- Height: 16px (h-4)
- Rounded corners
- Smooth animation (0.5s ease-out)
- Percentage-based width

**Alerts:**
- Rounded corners (rounded-lg)
- Border with matching color
- Icon with AlertCircle from lucide-react
- Animated entrance (fade + slide)

#### Accessibility

- Clear visual hierarchy
- High contrast for readability
- Color-blind friendly (uses icons + text)
- Semantic HTML structure
- ARIA labels for screen readers
- Sufficient color contrast ratios

#### Performance

- Uses `framer-motion` for smooth animations
- Optimized re-renders (only updates when props change)
- Lightweight component (< 100 lines)
- No external API calls

#### Integration with SquadBuilder

The BudgetTracker is already integrated into the SquadBuilder component:

```tsx
// In SquadBuilder component
const budgetSpent = selectedPlayers.reduce((sum, p) => sum + p.price, 0)
const budgetRemaining = budget - budgetSpent

<BudgetTracker
  budget={budget}
  budgetSpent={budgetSpent}
  budgetRemaining={budgetRemaining}
/>
```

#### Example Scenarios

**Scenario 1: Starting Fresh**
```tsx
<BudgetTracker budget={100} budgetSpent={0} budgetRemaining={100} />
// Shows: 100.0M€ remaining, 0% progress bar (green)
```

**Scenario 2: Half Spent**
```tsx
<BudgetTracker budget={100} budgetSpent={50} budgetRemaining={50} />
// Shows: 50.0M€ remaining, 50% progress bar (green)
```

**Scenario 3: Near Limit**
```tsx
<BudgetTracker budget={100} budgetSpent={95} budgetRemaining={5} />
// Shows: 5.0M€ remaining, 95% progress bar (yellow), warning alert
```

**Scenario 4: Over Budget**
```tsx
<BudgetTracker budget={100} budgetSpent={105} budgetRemaining={-5} />
// Shows: -5.0M€ remaining (red), 100% progress bar (red), error alert
```

## Requirements Covered

These components address the following requirements from the Fantasy mode spec:

- **Requirement 2**: Sélection des joueurs - Complete player selection interface with filtering and search, budget tracking
- **Requirement 3**: Formation et composition - Formation selection and visual composition display
- **Requirement 4**: Profil Fantasy des joueurs - Display Fantasy stats for all players
- **Requirement 5**: Mon Équipe Fantasy - Visual team preview with PitchView

### TransferPanel

A comprehensive component for managing player transfers in Fantasy teams. Allows users to replace players while respecting budget constraints, transfer limits, and position requirements.

#### Features

- **Transfer Status Display**: Shows remaining free transfers, budget, and wildcard availability
- **Player Selection**: Two-panel interface for selecting player out and player in
- **Position Filtering**: Automatically filters available players by position
- **Budget Validation**: Real-time validation of transfer affordability
- **Price Comparison**: Shows price difference between players
- **Transfer Penalties**: Clear warning when exceeding free transfers (-4 points)
- **Wildcard Support**: Option to activate wildcard for unlimited free transfers
- **Search Functionality**: Search available players by name
- **Responsive Design**: Works on all screen sizes
- **Animations**: Smooth transitions and feedback animations

#### Props

```typescript
interface TransferPanelProps {
  currentPlayers: FantasyPlayer[]                    // Required: Current squad
  playerDetails: Map<string, Player>                 // Required: Player details map
  playerFantasyStats: Map<string, PlayerFantasyStats> // Required: Fantasy stats map
  availablePlayers: Player[]                         // Required: All available players
  budgetRemaining: number                            // Required: Remaining budget
  transfersRemaining: number                         // Required: Free transfers left
  wildcardAvailable: boolean                         // Required: Wildcard availability
  onTransfer: (playerOutId: string, playerInId: string) => void // Transfer callback
  onWildcard?: () => void                            // Wildcard activation callback
  onCancel?: () => void                              // Cancel callback
}
```

#### Usage Examples

**Basic Usage**

```tsx
import { TransferPanel } from '@/components/fantasy/transfer-panel'

const handleTransfer = async (playerOutId: string, playerInId: string) => {
  await makeTransfer({
    teamId: fantasyTeam.id,
    playerOutId,
    playerInId
  })
  // Refresh team data
  await refreshTeam()
}

<TransferPanel
  currentPlayers={fantasyTeam.players}
  playerDetails={playerDetailsMap}
  playerFantasyStats={statsMap}
  availablePlayers={allPlayers}
  budgetRemaining={fantasyTeam.budgetRemaining}
  transfersRemaining={fantasyTeam.transfers}
  wildcardAvailable={!fantasyTeam.wildcardUsed}
  onTransfer={handleTransfer}
/>
```

**With Wildcard Support**

```tsx
const handleWildcard = async () => {
  await activateWildcard(fantasyTeam.id)
  router.push('/public/fantasy/squad') // Redirect to squad builder
}

<TransferPanel
  currentPlayers={fantasyTeam.players}
  playerDetails={playerDetailsMap}
  playerFantasyStats={statsMap}
  availablePlayers={allPlayers}
  budgetRemaining={fantasyTeam.budgetRemaining}
  transfersRemaining={fantasyTeam.transfers}
  wildcardAvailable={!fantasyTeam.wildcardUsed}
  onTransfer={handleTransfer}
  onWildcard={handleWildcard}
  onCancel={() => router.back()}
/>
```

**In Transfer Page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { TransferPanel } from '@/components/fantasy/transfer-panel'
import { useAuth } from '@/lib/auth-context'

export default function TransfersPage() {
  const { user } = useAuth()
  const [fantasyTeam, setFantasyTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // Load fantasy team
      const team = await getFantasyTeam(user.id)
      setFantasyTeam(team)

      // Load all players
      const allPlayers = await getAllPlayers()
      setPlayers(allPlayers)

      setLoading(false)
    }
    loadData()
  }, [user])

  const handleTransfer = async (playerOutId, playerInId) => {
    try {
      await fetch('/api/fantasy/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: fantasyTeam.id,
          playerOutId,
          playerInId
        })
      })
      
      // Refresh team
      const updatedTeam = await getFantasyTeam(user.id)
      setFantasyTeam(updatedTeam)
      
      toast.success('Transfert effectué avec succès!')
    } catch (error) {
      toast.error('Erreur lors du transfert')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Transferts</h1>
      <TransferPanel
        currentPlayers={fantasyTeam.players}
        playerDetails={playerDetailsMap}
        playerFantasyStats={statsMap}
        availablePlayers={players}
        budgetRemaining={fantasyTeam.budgetRemaining}
        transfersRemaining={fantasyTeam.transfers}
        wildcardAvailable={!fantasyTeam.wildcardUsed}
        onTransfer={handleTransfer}
        onWildcard={handleWildcard}
        onCancel={() => router.push('/public/fantasy/my-team')}
      />
    </div>
  )
}
```

#### Features in Detail

**Transfer Status Cards**
- **Free Transfers**: Shows remaining free transfers (resets to 2 each gameweek)
- **Budget Remaining**: Displays available budget for transfers
- **Wildcard**: Shows if wildcard is available or already used

**Player Selection Flow**
1. User selects a player from their current squad to replace
2. System automatically filters available players by the same position
3. User selects a replacement player
4. System validates the transfer (budget, position match)
5. User confirms the transfer

**Price Comparison**
When both players are selected, shows:
- Price of player being removed
- Price of new player
- Difference (with up/down indicator)
- Impact on budget

**Transfer Penalties**
- First 2 transfers per gameweek are free
- Additional transfers cost 4 points each
- Clear warning displayed when penalty will be applied
- Penalty shown in confirmation button

**Wildcard Feature**
- One-time use per season
- Allows unlimited free transfers
- Confirmation modal before activation
- Typically redirects to squad builder for full team rebuild

**Validation**
- Position matching (can only replace with same position)
- Budget checking (must have sufficient budget for price difference)
- Real-time error display
- Prevents invalid transfers

#### Visual States

**Normal State**
- Green status cards
- No warnings
- Standard transfer flow

**No Free Transfers**
- Orange warning banner
- Shows penalty (-4 points)
- Penalty included in confirm button text

**Budget Exceeded**
- Red error message
- Transfer button disabled
- Clear explanation of budget issue

**Wildcard Available**
- Purple wildcard card
- Prominent activation button
- Confirmation modal on click

#### Styling

Uses consistent SofaScore theme:
- Status cards with gradient backgrounds
- Color-coded by type (blue=transfers, green=budget, purple=wildcard)
- sofa-green for confirm actions
- Red/orange for warnings and errors
- Smooth animations with framer-motion

#### Accessibility

- Keyboard navigation support
- Focus management
- ARIA labels for screen readers
- Clear error messages
- Touch-friendly buttons (44px minimum)
- High contrast for readability

#### Performance

- Efficient filtering (only shows relevant players)
- Optimized re-renders
- Lazy loading for player cards
- Debounced search input
- Lightweight validation

#### Validation Rules

The TransferPanel enforces:

1. **Position Match**: New player must have same position as replaced player
2. **Budget**: Price difference must not exceed remaining budget
3. **No Duplicates**: Cannot select a player already in squad
4. **Transfer Limit**: Warns about penalty when exceeding free transfers

#### Integration with API

```tsx
// API Route: /api/fantasy/transfers/route.ts
export async function POST(request: NextRequest) {
  const { teamId, playerOutId, playerInId } = await request.json()
  
  // Validate transfer
  const validation = await validateTransfer(teamId, playerOutId, playerInId)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors }, { status: 400 })
  }
  
  // Execute transfer
  await executeTransfer(teamId, playerOutId, playerInId)
  
  // Apply penalty if needed
  if (team.transfers === 0) {
    await deductPoints(teamId, 4)
  }
  
  // Decrement free transfers
  await decrementTransfers(teamId)
  
  return NextResponse.json({ success: true })
}
```

#### Example Scenarios

**Scenario 1: Free Transfer**
```tsx
// User has 2 free transfers remaining
<TransferPanel
  transfersRemaining={2}
  // ... other props
/>
// No penalty warning shown
```

**Scenario 2: Penalty Transfer**
```tsx
// User has 0 free transfers remaining
<TransferPanel
  transfersRemaining={0}
  // ... other props
/>
// Orange warning: "Ce transfert vous coûtera 4 points"
```

**Scenario 3: Budget Constraint**
```tsx
// User wants expensive player but lacks budget
// System shows error: "Budget insuffisant pour ce transfert"
// Transfer button is disabled
```

**Scenario 4: Wildcard Available**
```tsx
<TransferPanel
  wildcardAvailable={true}
  // ... other props
/>
// Purple wildcard card shown with activation button
```

## Requirements Covered

These components address the following requirements from the Fantasy mode spec:

- **Requirement 2**: Sélection des joueurs - Complete player selection interface with filtering and search, budget tracking
- **Requirement 3**: Formation et composition - Formation selection and visual composition display
- **Requirement 4**: Profil Fantasy des joueurs - Display Fantasy stats for all players
- **Requirement 5**: Mon Équipe Fantasy - Visual team preview with PitchView
- **Requirement 6**: Transferts - Complete transfer management with validation and penalties

### LeaderboardTable

A comprehensive table component for displaying Fantasy league rankings with search, pagination, and user highlighting.

#### Features

- **Rank Display**: Shows rank with special icons for top 3 positions (🏆 🥈 🥉)
- **User Highlighting**: Highlights current user's team with green background
- **Pagination**: Full pagination controls with page numbers and navigation
- **Search**: Real-time search functionality for team names
- **Badge Display**: Shows earned badges with icons
- **Points Display**: Total points and optional gameweek points
- **Responsive Design**: Works on all screen sizes
- **Animations**: Smooth entrance animations with framer-motion
- **Empty State**: Friendly empty state when no teams exist
- **Dark Mode**: Full support for light/dark themes

#### Props

```typescript
interface LeaderboardTableProps {
  entries: LeaderboardEntry[]           // Required: Array of leaderboard entries
  currentUserId?: string                // Optional: Current user ID
  currentUserTeamId?: string            // Optional: Current user's team ID (for highlighting)
  totalEntries: number                  // Required: Total number of entries (for pagination)
  currentPage: number                   // Required: Current page number
  pageSize?: number                     // Optional: Entries per page (default: 50)
  onPageChange: (page: number) => void  // Required: Page change callback
  onSearch?: (query: string) => void    // Optional: Search callback
  showGameweekPoints?: boolean          // Optional: Show gameweek points column (default: false)
  title?: string                        // Optional: Custom title (default: 'Classement Fantasy')
  emptyMessage?: string                 // Optional: Custom empty message
}
```

#### Usage Examples

**Basic Usage**

```tsx
import { LeaderboardTable } from '@/components/fantasy/leaderboard-table'

const [currentPage, setCurrentPage] = useState(1)

<LeaderboardTable
  entries={leaderboardEntries}
  currentUserTeamId={userTeamId}
  totalEntries={150}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
/>
```

**With Search**

```tsx
const [currentPage, setCurrentPage] = useState(1)
const [searchQuery, setSearchQuery] = useState('')

const handleSearch = async (query: string) => {
  setSearchQuery(query)
  setCurrentPage(1) // Reset to first page
  // Fetch filtered results
  const results = await searchLeaderboard(query)
  setEntries(results)
}

<LeaderboardTable
  entries={entries}
  currentUserTeamId={userTeamId}
  totalEntries={totalCount}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
  onSearch={handleSearch}
/>
```

**With Gameweek Points**

```tsx
<LeaderboardTable
  entries={entries}
  currentUserTeamId={userTeamId}
  totalEntries={150}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
  showGameweekPoints={true}
  title="Classement de la semaine"
/>
```

**Custom Page Size**

```tsx
<LeaderboardTable
  entries={entries}
  currentUserTeamId={userTeamId}
  totalEntries={150}
  currentPage={currentPage}
  pageSize={25}
  onPageChange={setCurrentPage}
/>
```

**In Leaderboard Page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { LeaderboardTable } from '@/components/fantasy/leaderboard-table'
import { useAuth } from '@/lib/auth-context'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [totalEntries, setTotalEntries] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [userTeamId, setUserTeamId] = useState<string>()

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true)
      
      // Fetch leaderboard data
      const response = await fetch(
        `/api/fantasy/leaderboard?page=${currentPage}&limit=50`
      )
      const data = await response.json()
      
      setEntries(data.entries)
      setTotalEntries(data.total)
      
      // Get user's team ID
      if (user) {
        const team = await getFantasyTeam(user.id)
        setUserTeamId(team?.id)
      }
      
      setLoading(false)
    }
    
    loadLeaderboard()
  }, [currentPage, user])

  const handleSearch = async (query: string) => {
    if (!query) {
      // Reset to full leaderboard
      setCurrentPage(1)
      return
    }
    
    // Search leaderboard
    const response = await fetch(
      `/api/fantasy/leaderboard?search=${encodeURIComponent(query)}`
    )
    const data = await response.json()
    setEntries(data.entries)
    setTotalEntries(data.total)
    setCurrentPage(1)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Classement Fantasy</h1>
      <LeaderboardTable
        entries={entries}
        currentUserTeamId={userTeamId}
        totalEntries={totalEntries}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearch={handleSearch}
        showGameweekPoints={true}
      />
    </div>
  )
}
```

#### Features in Detail

**Rank Display**
- Top 3 ranks get special icons (🏆 gold, 🥈 silver, 🥉 bronze)
- Top 10 ranks get green badge
- Gradient backgrounds for podium positions
- Clear visual hierarchy

**User Highlighting**
- Current user's team has green gradient background
- "Vous" badge next to team name
- Stands out clearly in the table
- Works across all pages

**Pagination**
- Shows current range (e.g., "Affichage 1 - 50 sur 150")
- Page numbers with ellipsis for large ranges
- First/Last page buttons
- Previous/Next buttons
- Disabled states for boundary pages
- Responsive (hides some buttons on mobile)

**Search**
- Real-time search input
- Search icon indicator
- Callback to parent for API integration
- Clears on empty input

**Badge Display**
- Shows up to 3 badges with icons
- "+X" indicator for additional badges
- Tooltip with badge name on hover
- Supports all badge types

**Points Display**
- Total points (always shown)
- Gameweek points (optional column)
- Trending up icon for gameweek points
- Clear formatting with "pts" suffix

**Empty State**
- Friendly message when no teams exist
- Users icon illustration
- Customizable message
- Centered layout

#### Visual States

**Normal Row**
- White background (light mode)
- Gray background on hover
- Standard text colors

**User's Team Row**
- Green gradient background
- "Vous" badge
- Green team name
- Stands out clearly

**Top 3 Ranks**
- Special gradient badges
- Trophy/medal icons
- Enhanced visual prominence

**Top 10 Ranks**
- Green rank badge
- Special recognition

#### Styling

Uses consistent SofaScore theme:
- Trophy icon in header
- sofa-green for user highlighting
- Gradient badges for top ranks
- Smooth hover transitions
- Responsive table layout
- Clean typography

#### Pagination Logic

The component includes smart pagination:
- Shows up to 5 page numbers
- Uses ellipsis (...) for gaps
- Always shows first and last page
- Shows pages around current page
- Example: `1 ... 5 6 7 ... 20`

#### Accessibility

- Semantic table structure
- Keyboard navigation support
- Focus management
- ARIA labels for screen readers
- Clear visual hierarchy
- High contrast for readability
- Touch-friendly buttons (44px minimum)

#### Performance

- Efficient rendering with framer-motion
- Staggered animations for rows
- Optimized re-renders
- Lightweight component
- Server-side pagination support

#### Integration with API

```tsx
// API Route: /api/fantasy/leaderboard/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''

  // Build query
  let query = collection(db, 'fantasy_teams')
  
  if (search) {
    query = query.where('teamName', '>=', search)
                 .where('teamName', '<=', search + '\uf8ff')
  }
  
  query = query.orderBy('totalPoints', 'desc')
               .limit(limit)
               .offset((page - 1) * limit)

  // Fetch data
  const snapshot = await getDocs(query)
  const entries = snapshot.docs.map((doc, index) => ({
    rank: (page - 1) * limit + index + 1,
    teamId: doc.id,
    ...doc.data()
  }))

  // Get total count
  const totalSnapshot = await getCountFromServer(
    search ? query : collection(db, 'fantasy_teams')
  )
  const total = totalSnapshot.data().count

  return NextResponse.json({ entries, total })
}
```

#### Example Scenarios

**Scenario 1: First Page**
```tsx
<LeaderboardTable
  entries={entries}
  currentPage={1}
  totalEntries={150}
  onPageChange={setPage}
/>
// Shows: "Affichage 1 - 50 sur 150"
// Pagination: [<< <] 1 2 3 ... 3 [> >>]
```

**Scenario 2: Middle Page**
```tsx
<LeaderboardTable
  entries={entries}
  currentPage={5}
  totalEntries={500}
  onPageChange={setPage}
/>
// Shows: "Affichage 201 - 250 sur 500"
// Pagination: [<< <] 1 ... 4 5 6 ... 10 [> >>]
```

**Scenario 3: User in Top 3**
```tsx
<LeaderboardTable
  entries={entries}
  currentUserTeamId="team-123"
  // ... other props
/>
// User's row has green background + "Vous" badge
// Rank badge has special gradient (gold/silver/bronze)
```

**Scenario 4: Search Results**
```tsx
const handleSearch = (query) => {
  // Fetch filtered results
  fetchLeaderboard({ search: query })
}

<LeaderboardTable
  entries={filteredEntries}
  totalEntries={filteredCount}
  onSearch={handleSearch}
  // ... other props
/>
// Shows only matching teams
// Pagination adjusts to filtered count
```

## Requirements Covered

This component addresses the following requirements from the Fantasy mode spec:

- **Requirement 9**: Classement Fantasy - Display leaderboard with ranks, teams, points, search, and paginationue}
  // ... other props
/>
// Purple wildcard card shown with activation button
```

## Requirements Covered

These components address the following requirements from the Fantasy mode spec:

- **Requirement 2**: Sélection des joueurs - Complete player selection interface with filtering and search, budget tracking
- **Requirement 3**: Formation et composition - Formation selection and visual composition display
- **Requirement 4**: Profil Fantasy des joueurs - Display Fantasy stats for all players
- **Requirement 5**: Mon Équipe Fantasy - Visual team preview with PitchView
- **Requirement 7**: Transferts - Complete transfer management with validation and penalties
- **Requirement 8**: Wildcard - Wildcard activation with confirmation

### LeaderboardTable

A comprehensive table component for displaying Fantasy league rankings with search, pagination, and detailed statistics.

#### Features

- **Ranking Display**: Shows rank, team name, points with visual hierarchy
- **Badge Icons**: Displays earned badges for each team
- **User Highlight**: Highlights current user's team with special styling
- **Search**: Search teams by name
- **Pagination**: Efficient pagination for large datasets
- **Gameweek Points**: Optional column for weekly points
- **Rank Icons**: Special icons for top 3 positions (trophy, medal, award)
- **Responsive**: Adapts to mobile and desktop screens
- **Animations**: Smooth entrance animations for rows
- **Dark Mode**: Full support for light/dark themes

#### Props

```typescript
interface LeaderboardTableProps {
  entries: LeaderboardEntry[]           // Required: Array of leaderboard entries
  currentUserId?: string                // Optional: Current user ID
  currentUserTeamId?: string            // Optional: Current user's team ID
  totalEntries: number                  // Required: Total number of entries
  currentPage: number                   // Required: Current page number
  pageSize?: number                     // Page size (default: 50)
  onPageChange: (page: number) => void  // Required: Page change callback
  onSearch?: (query: string) => void    // Optional: Search callback
  showGameweekPoints?: boolean          // Show weekly points (default: false)
  title?: string                        // Custom title (default: 'Classement Fantasy')
  emptyMessage?: string                 // Custom empty message
}
```

#### Usage Examples

**Basic Usage**

```tsx
import { LeaderboardTable } from '@/components/fantasy/leaderboard-table'

const [entries, setEntries] = useState<LeaderboardEntry[]>([])
const [currentPage, setCurrentPage] = useState(1)
const [totalEntries, setTotalEntries] = useState(0)

<LeaderboardTable
  entries={entries}
  currentUserTeamId={userTeamId}
  totalEntries={totalEntries}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
/>
```

**With Search**

```tsx
const handleSearch = async (query: string) => {
  const results = await searchFantasyTeams(query)
  setEntries(results)
}

<LeaderboardTable
  entries={entries}
  currentUserTeamId={userTeamId}
  totalEntries={totalEntries}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
  onSearch={handleSearch}
/>
```

**With Gameweek Points**

```tsx
<LeaderboardTable
  entries={entries}
  currentUserTeamId={userTeamId}
  totalEntries={totalEntries}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
  showGameweekPoints={true}
  title="Classement de la semaine"
/>
```

**Complete Integration Example**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { LeaderboardTable } from '@/components/fantasy/leaderboard-table'
import { useAuth } from '@/lib/auth-context'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [totalEntries, setTotalEntries] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [userTeamId, setUserTeamId] = useState(null)

  useEffect(() => {
    loadLeaderboard(currentPage)
  }, [currentPage])

  const loadLeaderboard = async (page: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/fantasy/leaderboard?page=${page}&limit=50`)
      const data = await response.json()
      
      setEntries(data.entries)
      setTotalEntries(data.total)
      setUserTeamId(data.userTeamId)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query) {
      loadLeaderboard(1)
      return
    }

    try {
      const response = await fetch(`/api/fantasy/leaderboard?search=${query}`)
      const data = await response.json()
      setEntries(data.entries)
      setTotalEntries(data.total)
      setCurrentPage(1)
    } catch (error) {
      console.error('Error searching:', error)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <LeaderboardTable
        entries={entries}
        currentUserTeamId={userTeamId}
        totalEntries={totalEntries}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearch={handleSearch}
      />
    </div>
  )
}
```

#### Features in Detail

**Rank Display**
- Top 3 get special icons (🏆 🥈 🥉)
- Top 10 get green badge
- Color-coded badges (gold, silver, bronze for podium)
- Gradient backgrounds for top positions

**User Highlight**
- Green gradient background for user's team
- "Vous" badge next to team name
- Stands out in the list

**Badge Display**
- Shows up to 3 badge icons per team
- "+X" indicator if more than 3 badges
- Hover tooltips for badge names
- Emoji icons for visual appeal

**Pagination**
- First/Previous/Next/Last buttons
- Page number buttons with ellipsis
- Shows current range (e.g., "1-50 of 234")
- Responsive (hides some buttons on mobile)

**Search**
- Real-time search input
- Debounced for performance
- Clears on empty query
- Icon indicator

#### Visual States

**Normal Row**
- White background (dark mode: gray-800)
- Hover effect
- Standard text colors

**User's Team Row**
- Green gradient background
- Green team name
- "Vous" badge
- Stands out prominently

**Top 3 Rows**
- Special rank badges (gold, silver, bronze)
- Trophy/medal icons
- Gradient badge backgrounds

#### Styling

Uses SofaScore theme:
- `sofa-text-primary` for main text
- `sofa-text-muted` for secondary text
- `sofa-green` for user highlight and top 10
- `sofa-border` for borders
- Gradient backgrounds for special ranks

**Rank Badge Colors:**
- 1st: Yellow gradient (gold)
- 2nd: Gray gradient (silver)
- 3rd: Amber gradient (bronze)
- Top 10: Green (sofa-green)
- Others: Gray

#### Accessibility

- Semantic table structure
- Keyboard navigation
- ARIA labels for screen readers
- High contrast for readability
- Touch-friendly buttons (44px minimum)
- Clear visual hierarchy

#### Performance

- Efficient pagination (only loads current page)
- Optimized re-renders
- Staggered animations (0.05s delay per row)
- Lazy loading for large datasets
- Debounced search (if implemented)

#### Pagination Logic

The component includes smart pagination:
- Shows max 5 page numbers
- Uses ellipsis (...) for gaps
- Always shows first and last page
- Shows pages around current page
- Responsive button visibility

```typescript
// Example pagination display
// Current page: 5, Total pages: 20
// Shows: [1] [...] [4] [5] [6] [...] [20]
```

#### Badge Icons

Supported badge types:
- 🏆 `top_10_week` - Top 10 de la semaine
- 🥇 `podium` - Podium
- 💯 `century` - Century
- 🃏 `wildcard_master` - Wildcard Master
- 👑 `perfect_captain` - Captain Parfait
- 🏅 `champion` - Champion
- 🔥 `winning_streak` - Série Gagnante

#### Integration with API

```tsx
// API Route: /api/fantasy/leaderboard/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search')

  let query = collection(db, 'fantasy_teams')
    .orderBy('totalPoints', 'desc')

  if (search) {
    query = query.where('teamName', '>=', search)
                 .where('teamName', '<=', search + '\uf8ff')
  }

  const snapshot = await getDocs(
    query.limit(limit).offset((page - 1) * limit)
  )

  const entries = snapshot.docs.map((doc, index) => ({
    teamId: doc.id,
    teamName: doc.data().teamName,
    userName: doc.data().userName,
    totalPoints: doc.data().totalPoints,
    gameweekPoints: doc.data().gameweekPoints,
    rank: (page - 1) * limit + index + 1,
    badges: doc.data().badges || []
  }))

  return NextResponse.json({
    entries,
    total: await getFantasyTeamsCount(),
    userTeamId: await getUserTeamId(userId)
  })
}
```

### BadgeDisplay

A visual component for displaying earned Fantasy badges and tracking progress toward unlocking new ones.

#### Features

- **Earned Badges**: Shows all badges the user has earned with animations
- **Available Badges**: Displays badges that can still be unlocked
- **Progress Tracking**: Shows progress toward earning specific badges
- **Badge Details**: Displays badge name, description, and icon
- **Animations**: Smooth entrance animations and hover effects
- **Responsive**: Grid layout adapts to screen size
- **Dark Mode**: Full support for light/dark themes
- **Visual Hierarchy**: Clear distinction between earned and locked badges

#### Props

```typescript
interface BadgeDisplayProps {
  earnedBadges: FantasyBadge[]         // Required: Badges user has earned
  availableBadges?: BadgeDefinition[]  // Optional: All possible badges
  showProgress?: boolean               // Show progress bars (default: true)
  compact?: boolean                    // Compact layout (default: false)
  onBadgeClick?: (badge: FantasyBadge) => void // Optional click handler
}
```

#### Usage Examples

**Basic Usage**

```tsx
import { BadgeDisplay } from '@/components/fantasy/badge-display'

<BadgeDisplay
  earnedBadges={userBadges}
  availableBadges={allBadges}
/>
```

**Compact Mode**

```tsx
<BadgeDisplay
  earnedBadges={userBadges}
  compact={true}
/>
```

**With Click Handler**

```tsx
const handleBadgeClick = (badge: FantasyBadge) => {
  // Show badge details modal
  showBadgeModal(badge)
}

<BadgeDisplay
  earnedBadges={userBadges}
  availableBadges={allBadges}
  onBadgeClick={handleBadgeClick}
/>
```

**Complete Integration**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { BadgeDisplay } from '@/components/fantasy/badge-display'
import { useAuth } from '@/lib/auth-context'

export default function RewardsPage() {
  const { user } = useAuth()
  const [earnedBadges, setEarnedBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBadges() {
      const badges = await getUserBadges(user.id)
      setEarnedBadges(badges)
      setLoading(false)
    }
    loadBadges()
  }, [user])

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mes Récompenses</h1>
      <BadgeDisplay
        earnedBadges={earnedBadges}
        availableBadges={ALL_BADGES}
        showProgress={true}
      />
    </div>
  )
}
```

#### Badge Types

All supported badges:

```typescript
const FANTASY_BADGES = {
  top_10_week: {
    name: "Top 10 de la semaine",
    description: "Terminer dans le top 10 d'une gameweek",
    icon: "🏆",
    color: "gold"
  },
  podium: {
    name: "Podium",
    description: "Terminer dans le top 3 du classement général",
    icon: "🥇",
    color: "gold"
  },
  century: {
    name: "Century",
    description: "Marquer 100+ points en une gameweek",
    icon: "💯",
    color: "purple"
  },
  wildcard_master: {
    name: "Wildcard Master",
    description: "Gagner 50+ points après avoir utilisé le Wildcard",
    icon: "🃏",
    color: "purple"
  },
  perfect_captain: {
    name: "Captain Parfait",
    description: "Avoir le meilleur capitaine de la gameweek",
    icon: "👑",
    color: "yellow"
  },
  champion: {
    name: "Champion Fantasy",
    description: "Terminer 1er du classement général",
    icon: "🏅",
    color: "gold"
  },
  winning_streak: {
    name: "Série Gagnante",
    description: "Gagner 5 gameweeks consécutives",
    icon: "🔥",
    color: "red"
  }
}
```

#### Visual States

**Earned Badge**
- Full color with gradient background
- Large icon (text-4xl)
- Badge name and earned date
- Shine animation on hover
- Clickable (if handler provided)

**Locked Badge**
- Grayscale with opacity
- Lock icon overlay
- Muted colors
- Progress bar (if applicable)
- "À débloquer" label

#### Styling

Uses SofaScore theme with badge-specific colors:
- Gold badges: Yellow gradient
- Purple badges: Purple gradient
- Red badges: Red gradient
- Locked: Gray with opacity

**Card Styling:**
- Rounded corners (rounded-xl)
- Shadow (shadow-lg)
- Border (border-2)
- Gradient backgrounds
- Smooth transitions

#### Accessibility

- Semantic HTML structure
- Keyboard navigation
- ARIA labels for locked/unlocked state
- High contrast for readability
- Touch-friendly cards (minimum size)
- Clear visual hierarchy

#### Performance

- Optimized re-renders
- Staggered animations (0.1s delay per badge)
- Lazy loading for badge images (if any)
- Efficient filtering of earned vs available

#### Progress Tracking

For badges with progress requirements:

```tsx
// Example: Century badge (100 points in a gameweek)
{
  badgeType: 'century',
  progress: 85,  // Current best: 85 points
  required: 100, // Need: 100 points
  progressText: '85/100 points'
}
```

Progress bar shows:
- Current progress vs required
- Percentage complete
- Visual progress bar
- Text description

#### Integration with Badge System

```tsx
// lib/fantasy/badges.ts
export async function checkAndAwardBadges(
  userId: string,
  teamId: string,
  gameweek: number
) {
  const team = await getFantasyTeam(teamId)
  const badges: string[] = []
  
  // Check for century
  if (team.gameweekPoints >= 100) {
    badges.push('century')
  }
  
  // Check for top 10
  if (team.weeklyRank <= 10) {
    badges.push('top_10_week')
  }
  
  // Award new badges
  for (const badgeType of badges) {
    const exists = await hasBadge(userId, badgeType)
    if (!exists) {
      await awardBadge(userId, badgeType, gameweek)
      await sendBadgeNotification(userId, badgeType)
    }
  }
}
```

### PointsHistory

A comprehensive component for displaying Fantasy team points history with interactive charts and detailed gameweek breakdowns.

#### Features

- **Statistics Overview**: Shows total, average, best, and worst gameweek scores
- **Interactive Chart**: Bar chart with hover tooltips and click interactions
- **List View**: Detailed list of all gameweeks with expandable details
- **Player Breakdown**: Shows points earned by each player per gameweek
- **Captain Indicator**: Highlights captain with badge and point multiplier
- **Transfer Tracking**: Displays transfers made and penalties incurred
- **View Toggle**: Switch between chart and list views
- **Responsive**: Adapts to mobile and desktop screens
- **Animations**: Smooth entrance animations with Framer Motion
- **Dark Mode**: Full support for light/dark themes

#### Props

```typescript
interface PointsHistoryProps {
  gameweekHistory: GameweekHistory[]    // Required: Array of gameweek data
  playerDetails: Map<string, Player>    // Required: Map of player details
  currentGameweek?: number              // Optional: Current gameweek number
  showChart?: boolean                   // Show chart view (default: true)
  compact?: boolean                     // Compact mode (default: false)
}
```

#### Usage Examples

**Basic Usage (Full Version)**

```tsx
import { PointsHistory } from '@/components/fantasy/points-history'

<PointsHistory
  gameweekHistory={gameweekHistory}
  playerDetails={playerDetailsMap}
  currentGameweek={5}
  showChart={true}
  compact={false}
/>
```

**Compact Mode (List Only)**

```tsx
<PointsHistory
  gameweekHistory={gameweekHistory}
  playerDetails={playerDetailsMap}
  currentGameweek={5}
  showChart={false}
  compact={true}
/>
```

**In My Team Page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { PointsHistory } from '@/components/fantasy/points-history'
import { useAuth } from '@/lib/auth-context'

export default function MyTeamPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [playerDetails, setPlayerDetails] = useState(new Map())
  const [currentGameweek, setCurrentGameweek] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // Load gameweek history
      const historyData = await getGameweekHistory(user.id)
      setHistory(historyData)

      // Load player details
      const players = await getAllPlayers()
      const detailsMap = new Map()
      players.forEach(p => detailsMap.set(p.id, p))
      setPlayerDetails(detailsMap)

      // Get current gameweek
      const current = await getCurrentGameweek()
      setCurrentGameweek(current)

      setLoading(false)
    }
    loadData()
  }, [user])

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mon Équipe</h1>
      
      {/* Current team display */}
      <PitchView {...currentTeamProps} />

      {/* Points history */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Historique des points</h2>
        <PointsHistory
          gameweekHistory={history}
          playerDetails={playerDetails}
          currentGameweek={currentGameweek}
        />
      </div>
    </div>
  )
}
```

#### Features in Detail

**Statistics Overview**
- **Total Points**: Sum of all gameweek points
- **Average Points**: Mean points per gameweek
- **Best Gameweek**: Highest scoring gameweek with number
- **Worst Gameweek**: Lowest scoring gameweek with number
- Color-coded stat cards (yellow, blue, green, red)

**Interactive Chart**
- Bar chart showing points evolution over time
- Hover tooltips with gameweek details
- Click to expand gameweek details
- Color coding:
  - Blue: Normal gameweeks
  - Green: Current gameweek
  - Yellow: Best gameweek
- Animated bar growth on load
- Responsive height scaling

**List View**
- Chronological list (most recent first)
- Expandable gameweek cards
- Shows rank, points, transfers, penalties
- Player-by-player breakdown when expanded
- Visual indicators for current/best gameweeks

**Player Breakdown**
- Player photo or avatar
- Name, position, team
- Points earned
- Captain badge with multiplier notation
- Color-coded points (green for high, gray for low)

**Transfer Information**
- Number of transfers made
- Points deducted for penalties
- Visual icons for transfers and penalties

#### Visual States

**Normal Gameweek**
- White/gray card background
- Blue bar in chart
- Standard styling

**Current Gameweek**
- Green gradient background
- Green bar in chart
- "Actuelle" badge
- Highlighted in list

**Best Gameweek**
- Yellow gradient background
- Yellow bar in chart
- "🏆 Meilleur" badge
- Trophy icon

**Expanded Gameweek**
- Shows full player breakdown
- Animated expansion
- Gray background for details section

#### Styling

Uses SofaScore theme:
- `sofa-text-primary` for main text
- `sofa-text-muted` for secondary text
- `sofa-green` for current gameweek
- `sofa-border` for borders
- Gradient backgrounds for special states

**Chart Colors:**
- Normal: Blue gradient (from-blue-400 to-blue-500)
- Current: Green gradient (from-sofa-green to-emerald-400)
- Best: Yellow gradient (from-yellow-400 to-yellow-500)

**Stat Card Colors:**
- Total: Yellow gradient
- Average: Blue gradient
- Best: Green gradient
- Worst: Red gradient

#### Accessibility

- Semantic HTML structure
- Keyboard navigation for interactive elements
- ARIA labels for chart bars
- High contrast for readability
- Touch-friendly tap targets
- Clear visual hierarchy
- Screen reader friendly

#### Performance

- Efficient sorting and filtering
- Optimized re-renders
- Staggered animations (0.05s delay per item)
- Lazy loading for expanded details
- Memoized calculations

#### Chart Scaling

The chart automatically scales based on the highest points:
- Max height: 256px (h-64)
- Bars scale proportionally to max points
- Minimum max of 100 points for consistent scaling
- Smooth animations on data changes

#### View Toggle

Users can switch between:
- **Chart View**: Visual bar chart with statistics
- **List View**: Detailed list with expandable cards

Toggle buttons styled with:
- Active: Green background (sofa-green)
- Inactive: Outline style
- Icons: BarChart3 and Calendar

#### Integration with GameweekHistory

```typescript
// Data structure expected
interface GameweekHistory {
  id: string
  teamId: string
  gameweek: number
  points: number
  rank?: number
  transfers: number
  pointsDeducted: number
  players: {
    playerId: string
    points: number
    isCaptain: boolean
  }[]
  createdAt: string | Date
}
```

#### Example Data Flow

```tsx
// 1. Fetch gameweek history from API
const response = await fetch(`/api/fantasy/history/${teamId}`)
const history = await response.json()

// 2. Load player details
const players = await getAllPlayers()
const playerMap = new Map(players.map(p => [p.id, p]))

// 3. Render component
<PointsHistory
  gameweekHistory={history}
  playerDetails={playerMap}
  currentGameweek={currentGW}
/>
```

## Requirements Covered

All Fantasy components address the following requirements from the spec:

- **Requirement 2**: Sélection des joueurs - Complete player selection with filtering, search, and budget tracking
- **Requirement 3**: Formation et composition - Formation selection and visual pitch display
- **Requirement 4**: Profil Fantasy des joueurs - Display Fantasy stats (price, points, popularity, form)
- **Requirement 5**: Mon Équipe Fantasy - Visual team composition with points display and history
- **Requirement 7**: Transferts - Complete transfer management with validation and penalties
- **Requirement 8**: Wildcard - Wildcard activation with confirmation
- **Requirement 9**: Classement Fantasy - Comprehensive leaderboard with search and pagination
- **Requirement 14**: Statistiques et historique - Points history with charts and detailed breakdowns
- **Requirement 15**: Récompenses et badges - Badge display with progress tracking

## Development

To see all component variations and examples:

```bash
# View individual component examples
/components/fantasy/player-card-example.tsx
/components/fantasy/formation-selector-example.tsx
/components/fantasy/pitch-view-example.tsx
/components/fantasy/squad-builder-example.tsx
/components/fantasy/budget-tracker-example.tsx
/components/fantasy/transfer-panel-example.tsx
/components/fantasy/leaderboard-table-example.tsx
/components/fantasy/badge-display-example.tsx
/components/fantasy/points-history-example.tsx
```

## Testing

All components should be tested for:
- Correct data display
- User interactions (clicks, selections)
- Validation logic
- Responsive behavior
- Accessibility compliance
- Performance with large datasets

## Contributing

When adding new Fantasy components:
1. Follow the established naming conventions
2. Use TypeScript for type safety
3. Include comprehensive props documentation
4. Create an example file demonstrating usage
5. Update this README with component details
6. Ensure accessibility compliance
7. Add animations with Framer Motion
8. Support dark mode
9. Make it responsiveue}
  // ... other props
/>
// Purple wildcard card shown with activation button
// Clicking shows confirmation modal
```

## Requirements Covered

These components address the following requirements from the Fantasy mode spec:

- **Requirement 2**: Sélection des joueurs - Complete player selection interface with filtering and search, budget tracking
- **Requirement 3**: Formation et composition - Formation selection and visual composition display
- **Requirement 4**: Profil Fantasy des joueurs - Display Fantasy stats for all players
- **Requirement 5**: Mon Équipe Fantasy - Visual team preview with PitchView
- **Requirement 7**: Transferts - Complete transfer management with validation, penalties, and free transfer tracking
- **Requirement 8**: Wildcard - Wildcard activation with confirmation modal

### BadgeDisplay

A comprehensive component for displaying Fantasy badges, showing earned badges with animations and locked badges with progression tracking.

#### Features

- **Earned Badges Display**: Shows all badges won by the user with animations
- **Locked Badges Display**: Shows badges yet to be unlocked with lock icon
- **Progress Tracking**: Visual progress bars showing advancement toward each badge
- **Badge Metadata**: Displays detailed information (points, rank, gameweek) when clicked
- **Animations**: Smooth entrance animations and interactive hover effects
- **Compact Mode**: Grid layout for space-efficient display
- **Empty State**: Friendly message when no badges are earned yet
- **Color-Coded**: Each badge type has unique gradient colors
- **Responsive**: Works on all screen sizes
- **Dark Mode**: Full support for light/dark themes

#### Props

```typescript
interface BadgeDisplayProps {
  userId: string                    // Required: User ID
  teamId: string                    // Required: Fantasy team ID
  earnedBadges: FantasyBadge[]      // Required: Array of earned badges
  showProgress?: boolean            // Show progress bars (default: true)
  compact?: boolean                 // Compact grid layout (default: false)
  animated?: boolean                // Enable animations (default: true)
}
```

#### Usage Examples

**Basic Usage (Full View)**

```tsx
import { BadgeDisplay } from '@/components/fantasy/badge-display'
import { getUserBadges } from '@/lib/fantasy/badges'

const badges = await getUserBadges(userId)

<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={badges}
  showProgress={true}
  animated={true}
/>
```

**Compact Mode (Grid)**

```tsx
<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={badges}
  compact={true}
  showProgress={false}
/>
```

**Without Progress Tracking**

```tsx
<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={badges}
  showProgress={false}
  animated={true}
/>
```

**Without Animations**

```tsx
<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={badges}
  showProgress={true}
  animated={false}
/>
```

**In Rewards Page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { BadgeDisplay } from '@/components/fantasy/badge-display'
import { getUserBadges } from '@/lib/fantasy/badges'
import { useAuth } from '@/lib/auth-context'

export default function RewardsPage() {
  const { user } = useAuth()
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBadges() {
      const userBadges = await getUserBadges(user.id)
      setBadges(userBadges)
      setLoading(false)
    }
    loadBadges()
  }, [user])

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mes Récompenses</h1>
      <BadgeDisplay
        userId={user.id}
        teamId={fantasyTeam.id}
        earnedBadges={badges}
        showProgress={true}
        animated={true}
      />
    </div>
  )
}
```

**In Profile Summary (Compact)**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Badges</CardTitle>
  </CardHeader>
  <CardContent>
    <BadgeDisplay
      userId={userId}
      teamId={teamId}
      earnedBadges={badges}
      compact={true}
      showProgress={false}
      animated={false}
    />
  </CardContent>
</Card>
```

#### Badge Types

All 7 badge types are supported:

1. **Top 10 de la semaine** (🏆 Gold)
   - Earned: Finish in top 10 of a gameweek
   - Progress: Based on weekly rank

2. **Podium** (🥇 Gold)
   - Earned: Finish in top 3 of overall ranking
   - Progress: Based on overall rank

3. **Century** (💯 Purple)
   - Earned: Score 100+ points in one gameweek
   - Progress: Percentage of 100 points

4. **Wildcard Master** (🃏 Blue)
   - Earned: Use wildcard effectively (+50 points)
   - Progress: Not applicable (event-based)

5. **Captain Parfait** (👑 Yellow)
   - Earned: Have best captain of the gameweek
   - Progress: Based on captain points

6. **Champion Fantasy** (🏅 Platinum)
   - Earned: Finish 1st in overall ranking (season end)
   - Progress: Based on rank (only at season end)

7. **Série Gagnante** (🔥 Orange)
   - Earned: Win 5 consecutive gameweeks
   - Progress: Number of consecutive wins / 5

#### Features in Detail

**Earned Badges Section**
- Displays all badges won by the user
- Shows badge icon, name, and description
- Displays earned date
- Click to expand and see metadata (points, rank, gameweek)
- Animated entrance with stagger effect
- Gradient background matching badge color

**Locked Badges Section**
- Shows all badges not yet earned
- Lock icon overlay on badge icon
- Grayscale effect for locked state
- Progress bar showing advancement (if applicable)
- Color-coded progress bar (red < 25%, orange < 50%, yellow < 75%, green ≥ 75%)

**Progress Tracking**
- Real-time calculation of progress toward each badge
- Visual progress bar with percentage
- Color-coded by completion level
- Automatically loads on component mount
- Updates when team data changes

**Interactive Features**
- Click badge to expand/collapse metadata
- Hover effects (scale + lift)
- Smooth animations with framer-motion
- Touch-friendly on mobile

**Empty State**
- Friendly trophy icon (🏆)
- Encouraging message
- Explains how to earn badges
- Motivates user to start playing

#### Visual States

**Earned Badge**
- Full color gradient background
- White text
- Badge icon at full opacity
- Sparkles icon for earned date
- Expandable metadata section

**Locked Badge**
- Gray gradient background
- Muted text colors
- Badge icon at 30% opacity with grayscale
- Lock icon overlay
- Progress bar (if applicable)

**Selected Badge (Clicked)**
- Green ring border (ring-2 ring-sofa-green)
- Expanded metadata section
- Smooth height animation

#### Styling

Badge colors by type:
- **Gold**: `from-yellow-400 to-yellow-600`
- **Platinum**: `from-gray-300 to-gray-500`
- **Purple**: `from-purple-400 to-purple-600`
- **Blue**: `from-blue-400 to-blue-600`
- **Yellow**: `from-yellow-300 to-yellow-500`
- **Orange**: `from-orange-400 to-orange-600`

Progress bar colors:
- **Green** (≥75%): `bg-green-500`
- **Yellow** (≥50%): `bg-yellow-500`
- **Orange** (≥25%): `bg-orange-500`
- **Red** (<25%): `bg-red-500`

#### Accessibility

- Keyboard navigation support
- Focus states for interactive elements
- ARIA labels for screen readers
- High contrast for readability
- Touch-friendly tap targets (44px minimum)
- Clear visual hierarchy
- Semantic HTML structure

#### Performance

- Uses `framer-motion` for smooth animations
- Optimized re-renders with React hooks
- Lazy loading of progress data
- Efficient badge filtering
- Lightweight component

#### Integration with Badge System

The component integrates with the Fantasy badge system:

```tsx
// Load user badges
import { getUserBadges, getBadgeProgress } from '@/lib/fantasy/badges'

// Get earned badges
const badges = await getUserBadges(userId)

// Get progress for a specific badge
const progress = await getBadgeProgress(userId, teamId, 'century')

// Component automatically loads progress for all badges
<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={badges}
  showProgress={true}
/>
```

#### Example Scenarios

**Scenario 1: New User (No Badges)**
```tsx
<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={[]}
  showProgress={true}
/>
// Shows empty state with encouraging message
// All 7 badges shown as locked with progress bars
```

**Scenario 2: Active User (Some Badges)**
```tsx
const badges = [
  { badgeType: 'top_10_week', earnedAt: ..., metadata: { rank: 7 } },
  { badgeType: 'century', earnedAt: ..., metadata: { points: 105 } }
]

<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={badges}
  showProgress={true}
/>
// Shows 2 earned badges (colorful, animated)
// Shows 5 locked badges with progress bars
```

**Scenario 3: Champion (All Badges)**
```tsx
const badges = [/* all 7 badge types */]

<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={badges}
  showProgress={true}
/>
// Shows all 7 badges as earned
// No locked badges section
// Impressive display of achievement
```

**Scenario 4: Compact View in Profile**
```tsx
<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={badges}
  compact={true}
  showProgress={false}
  animated={false}
/>
// Shows small grid of badge icons
// No descriptions or progress bars
// Perfect for profile summary
```

#### Metadata Display

When a badge is clicked, additional information is shown:

```tsx
// Example metadata for different badges
{
  // Top 10 Week
  points: 85,
  rank: 7,
  gameweek: 5
}

{
  // Century
  points: 105,
  gameweek: 8
}

{
  // Champion
  rank: 1,
  points: 1250
}
```

#### Animation Details

**Entrance Animations**
- Fade in + scale up (0.9 → 1.0)
- Staggered delay (0.05s per badge)
- Spring animation for badge icons
- Smooth height transitions for metadata

**Hover Animations**
- Scale up (1.05)
- Lift effect (y: -4px)
- 0.2s duration
- Only in non-compact mode

**Progress Bar Animation**
- Width animates from 0 to percentage
- 0.5s duration with ease-out
- 0.2s delay after component mount

## Requirements Covered

These components address the following requirements from the Fantasy mode spec:

- **Requirement 2**: Sélection des joueurs - Complete player selection interface with filtering and search, budget tracking
- **Requirement 3**: Formation et composition - Formation selection and visual composition display
- **Requirement 4**: Profil Fantasy des joueurs - Display Fantasy stats for all players
- **Requirement 5**: Mon Équipe Fantasy - Visual team preview with PitchView
- **Requirement 7**: Transferts - Complete transfer management with validation, penalties, and free transfer tracking
- **Requirement 8**: Wildcard - Wildcard activation with confirmation modal
- **Requirement 15**: Récompenses et badges Fantasy - Complete badge display with earned/locked states, progress tracking, and animations

## Future Enhancements

- [ ] Add drag-and-drop support for player positioning
- [ ] Add player comparison mode
- [ ] Add detailed stats tooltip on hover
- [ ] Add injury/suspension status indicator
- [ ] Add player substitution animations
- [ ] Add formation transition animations
- [ ] Add undo/redo functionality
- [ ] Add squad templates/presets
- [ ] Add transfer history view
- [ ] Add suggested transfers based on form
- [ ] Add badge sharing functionality
- [ ] Add badge achievement notifications
- [ ] Add badge rarity indicators
- [ ] Add seasonal badge collections
