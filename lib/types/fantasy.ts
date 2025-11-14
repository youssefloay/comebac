import { Timestamp } from 'firebase/firestore'

/**
 * Formation tactique disponible pour une équipe Fantasy
 * Format: 1 Gardien + 6 joueurs de champ = 7 joueurs total
 */
export type Formation = '4-2-0' | '3-3-0' | '3-2-1' | '2-3-1' | '2-2-2'

/**
 * Position d'un joueur
 */
export type Position = 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant'

/**
 * Types de badges Fantasy disponibles
 */
export type BadgeType =
  | 'top_10_week'
  | 'podium'
  | 'century'
  | 'wildcard_master'
  | 'perfect_captain'
  | 'champion'
  | 'winning_streak'

/**
 * Types de notifications Fantasy
 */
export type FantasyNotificationSubType =
  | 'points_earned'
  | 'captain_scored'
  | 'badge_earned'
  | 'rank_improved'
  | 'player_performance'
  | 'transfer_deadline'
  | 'player_alert'

/**
 * Joueur dans une équipe Fantasy
 */
export interface FantasyPlayer {
  playerId: string
  position: Position
  price: number
  points: number
  gameweekPoints: number
  isCaptain: boolean
}

/**
 * Équipe Fantasy d'un utilisateur
 */
export interface FantasyTeam {
  id: string
  userId: string
  teamName: string
  budget: number
  budgetRemaining: number
  formation: Formation
  players: FantasyPlayer[]
  captainId: string
  totalPoints: number
  gameweekPoints: number
  rank: number
  weeklyRank: number
  transfers: number
  wildcardUsed: boolean
  badges: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Statistiques Fantasy d'un joueur réel
 */
export interface PlayerFantasyStats {
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

/**
 * Historique d'une gameweek pour une équipe Fantasy
 */
export interface GameweekHistory {
  id: string
  teamId: string
  gameweek: number
  points: number
  rank: number
  transfers: number
  pointsDeducted: number
  players: {
    playerId: string
    points: number
    isCaptain: boolean
  }[]
  createdAt: Timestamp
}

/**
 * Badge Fantasy gagné par un utilisateur
 */
export interface FantasyBadge {
  id: string
  userId: string
  badgeType: BadgeType
  earnedAt: Timestamp
  gameweek?: number
  metadata?: {
    points?: number
    rank?: number
  }
}

/**
 * Notification Fantasy
 */
export interface FantasyNotification {
  type: 'fantasy_update'
  subType: FantasyNotificationSubType
  fantasyTeamId: string
  metadata: {
    points?: number
    badgeType?: string
    newRank?: number
    playerId?: string
    playerName?: string
  }
}

/**
 * Données pour envoyer une notification Fantasy
 */
export interface FantasyNotificationData {
  type: FantasyNotificationSubType
  points?: number
  badgeType?: string
  newRank?: number
  playerId?: string
  playerName?: string
  metadata?: Record<string, any>
}

/**
 * Information sur une gameweek
 */
export interface GameweekInfo {
  number: number
  startDate: Timestamp
  endDate: Timestamp
  deadline: Timestamp
  isActive: boolean
  isCompleted: boolean
}

/**
 * Résultat de validation d'une équipe
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Statistiques d'un match pour le calcul de points Fantasy
 */
export interface MatchStats {
  playerId: string
  position: Position
  minutesPlayed: number
  goals: number
  assists: number
  cleanSheet: boolean
  teamWon: boolean
  teamDraw: boolean
  yellowCards: number
  redCards: number
  goalsConceded: number
  penaltySaved: boolean
  penaltyMissed: boolean
}

/**
 * Informations de badge avec métadonnées
 */
export interface BadgeInfo {
  name: string
  description: string
  icon: string
  color: string
}

/**
 * Données pour créer une équipe Fantasy
 */
export interface CreateFantasyTeamData {
  userId: string
  teamName: string
  formation: Formation
  players: FantasyPlayer[]
  captainId: string
}

/**
 * Données pour effectuer un transfert
 */
export interface TransferData {
  teamId: string
  playerOutId: string
  playerInId: string
  useWildcard?: boolean
}

/**
 * Entrée du classement Fantasy
 */
export interface LeaderboardEntry {
  rank: number
  teamId: string
  teamName: string
  userId: string
  userName?: string
  totalPoints: number
  gameweekPoints: number
  badges: string[]
}

/**
 * Options de pagination pour le classement
 */
export interface LeaderboardOptions {
  page?: number
  limit?: number
  searchQuery?: string
  gameweek?: number
}
