export interface Team {
  id: string
  name: string
  logo: string
  color: string
  school?: string // Nom de l'école/établissement
  schoolName?: string // Alias pour school (pour compatibilité)
  teamGrade?: string // Classe/Niveau (ex: "1ère", "Terminale")
  coach?: {
    firstName: string
    lastName: string
    birthDate: string
    email: string
    phone: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Player {
  id: string
  name: string
  number: number
  position: "Gardien" | "Défenseur" | "Milieu" | "Attaquant"
  teamId: string
  photo?: string // URL de la photo du joueur
  isCaptain?: boolean // Si le joueur est capitaine
  isCoach?: boolean // Si c'est un entraîneur
  
  // Informations personnelles
  birthDate?: string // Date de naissance (YYYY-MM-DD)
  age?: number // Calculé automatiquement
  nationality?: string
  height?: number // en cm
  weight?: number // en kg
  birthPlace?: string // Ville de naissance
  
  // Informations scolaires/académiques
  school?: string // École/Institution
  grade?: string // Classe/Niveau (ex: "Terminale S")
  favoriteSubject?: string // Matière préférée
  languages?: string[] // Langues parlées
  
  // Informations sportives
  alternativePositions?: string[] // Positions alternatives
  strongFoot?: "Droit" | "Gauche" | "Ambidextre"
  experienceYears?: number // Années d'expérience
  preferredNumber?: number // Numéro de maillot préféré
  
  // Note générale pour le tri/affichage (remplace overall)
  overall?: number // Note générale (0-99) - optionnel pour compatibilité
  
  // Statistiques de saison (gardées séparément)
  seasonStats?: {
    goals: number
    assists: number
    matches: number
    yellowCards: number
    redCards: number
    minutesPlayed: number
  }
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
  homeTeamGoalScorers: Array<{ 
    playerId?: string
    playerName: string
    assists?: string
    isPenalty?: boolean
    isPenaltyMissed?: boolean
    isOwnGoal?: boolean
  }>
  awayTeamGoalScorers: Array<{ 
    playerId?: string
    playerName: string
    assists?: string
    isPenalty?: boolean
    isPenaltyMissed?: boolean
    isOwnGoal?: boolean
  }>
  // Cards for each team
  homeTeamYellowCards?: Array<{ playerId?: string; playerName: string }>
  awayTeamYellowCards?: Array<{ playerId?: string; playerName: string }>
  homeTeamRedCards?: Array<{ playerId?: string; playerName: string }>
  awayTeamRedCards?: Array<{ playerId?: string; playerName: string }>
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
  phone: string
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
