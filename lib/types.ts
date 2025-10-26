export interface Team {
  id: string
  name: string
  logo: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface Player {
  id: string
  name: string
  number: number
  position: "Gardien" | "Défenseur" | "Milieu" | "Attaquant"
  teamId: string
  createdAt: Date
  updatedAt: Date
}

export interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  date: Date
  round: number
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  createdAt: Date
  updatedAt: Date
}

export interface MatchResult {
  id: string
  matchId: string
  homeTeamScore: number
  awayTeamScore: number
  // Each scorer can reference a player document (playerId) and include a display name and optional assists
  homeTeamGoalScorers: Array<{ playerId?: string; playerName: string; assists?: string }>
  awayTeamGoalScorers: Array<{ playerId?: string; playerName: string; assists?: string }>
  createdAt: Date
  updatedAt: Date
}

export interface TeamStatistics {
  id: string
  teamId: string
  matchesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  points: number
  updatedAt: Date
}

export interface UserProfile {
  id: string
  uid: string
  email: string
  username: string
  fullName: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  role: "admin" | "viewer"
  createdAt: Date
  updatedAt: Date
}
