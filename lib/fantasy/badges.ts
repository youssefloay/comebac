import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { BadgeType, BadgeInfo, FantasyTeam, GameweekHistory, FantasyBadge } from '../types/fantasy'

/**
 * Définition de tous les badges Fantasy disponibles
 * Requirement 15: Récompenses et badges Fantasy
 */
export const FANTASY_BADGES: Record<BadgeType, BadgeInfo> = {
  top_10_week: {
    name: 'Top 10 de la semaine',
    description: 'Terminer dans le top 10 d\'une gameweek',
    icon: '🏆',
    color: 'gold'
  },
  podium: {
    name: 'Podium',
    description: 'Terminer dans le top 3 du classement général',
    icon: '🥇',
    color: 'gold'
  },
  century: {
    name: 'Century',
    description: 'Marquer 100+ points en une gameweek',
    icon: '💯',
    color: 'purple'
  },
  wildcard_master: {
    name: 'Wildcard Master',
    description: 'Utiliser son Wildcard efficacement (+50 points)',
    icon: '🃏',
    color: 'blue'
  },
  perfect_captain: {
    name: 'Captain Parfait',
    description: 'Avoir le meilleur Captain de la gameweek',
    icon: '👑',
    color: 'yellow'
  },
  champion: {
    name: 'Champion Fantasy',
    description: 'Terminer 1er du classement général',
    icon: '🏅',
    color: 'platinum'
  },
  winning_streak: {
    name: 'Série Gagnante',
    description: 'Gagner 5 gameweeks consécutives',
    icon: '🔥',
    color: 'orange'
  }
}

/**
 * Vérifie si un utilisateur possède déjà un badge
 */
export async function hasBadge(
  userId: string,
  badgeType: BadgeType
): Promise<boolean> {
  try {
    const badgesRef = collection(db, 'fantasy_badges')
    const q = query(
      badgesRef,
      where('userId', '==', userId),
      where('badgeType', '==', badgeType)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error('[Fantasy Badges] Error checking badge:', error)
    return false
  }
}

/**
 * Attribue un badge à un utilisateur
 */
export async function awardBadge(
  userId: string,
  badgeType: BadgeType,
  gameweek?: number,
  metadata?: { points?: number; rank?: number }
): Promise<string> {
  try {
    const badgeData: Omit<FantasyBadge, 'id'> = {
      userId,
      badgeType,
      earnedAt: Timestamp.now(),
      gameweek,
      metadata
    }

    const docRef = await addDoc(collection(db, 'fantasy_badges'), badgeData)
    
    console.log(
      `[Fantasy Badges] Badge ${badgeType} awarded to user ${userId}`,
      metadata
    )

    return docRef.id
  } catch (error) {
    console.error('[Fantasy Badges] Error awarding badge:', error)
    throw error
  }
}

/**
 * Récupère tous les badges d'un utilisateur
 */
export async function getUserBadges(userId: string): Promise<FantasyBadge[]> {
  try {
    const badgesRef = collection(db, 'fantasy_badges')
    const q = query(
      badgesRef,
      where('userId', '==', userId),
      orderBy('earnedAt', 'desc')
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FantasyBadge[]
  } catch (error) {
    console.error('[Fantasy Badges] Error getting user badges:', error)
    return []
  }
}

/**
 * Récupère l'historique des gameweeks d'une équipe
 */
async function getGameweekHistory(
  teamId: string,
  count: number
): Promise<GameweekHistory[]> {
  try {
    const historyRef = collection(db, 'fantasy_gameweek_history')
    const q = query(
      historyRef,
      where('teamId', '==', teamId),
      orderBy('gameweek', 'desc'),
      limit(count)
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GameweekHistory[]
  } catch (error) {
    console.error('[Fantasy Badges] Error getting gameweek history:', error)
    return []
  }
}

/**
 * Vérifie si c'est la fin de la saison
 */
function isSeasonEnd(): boolean {
  // Cette fonction devrait vérifier la date de fin de saison
  // Pour l'instant, on retourne false
  const seasonEndDate = process.env.NEXT_PUBLIC_FANTASY_SEASON_END
  if (!seasonEndDate) return false

  const endDate = new Date(seasonEndDate)
  const now = new Date()
  
  return now >= endDate
}

/**
 * Récupère le meilleur score de capitaine de la gameweek
 */
async function getBestCaptainScore(gameweek: number): Promise<number> {
  try {
    const historyRef = collection(db, 'fantasy_gameweek_history')
    const q = query(
      historyRef,
      where('gameweek', '==', gameweek),
      orderBy('points', 'desc'),
      limit(1)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return 0

    const topTeam = snapshot.docs[0].data() as GameweekHistory
    const captainPlayer = topTeam.players.find(p => p.isCaptain)
    
    return captainPlayer?.points || 0
  } catch (error) {
    console.error('[Fantasy Badges] Error getting best captain score:', error)
    return 0
  }
}

/**
 * Vérifie et attribue les badges à un utilisateur après une gameweek
 * Requirement 15: Attribution automatique des badges
 */
export async function checkAndAwardBadges(
  userId: string,
  teamId: string,
  gameweek: number
): Promise<BadgeType[]> {
  try {
    console.log(`[Fantasy Badges] Checking badges for user ${userId}, team ${teamId}, gameweek ${gameweek}`)

    const team = await getFantasyTeam(teamId)
    if (!team) {
      console.log('[Fantasy Badges] Team not found')
      return []
    }

    const newBadges: BadgeType[] = []

    // 1. Top 10 de la semaine
    // Requirement 15.1: Badge pour top 10 d'une gameweek
    if (team.weeklyRank <= 10 && team.weeklyRank > 0) {
      const hasIt = await hasBadge(userId, 'top_10_week')
      if (!hasIt) {
        await awardBadge(userId, 'top_10_week', gameweek, {
          rank: team.weeklyRank,
          points: team.gameweekPoints
        })
        newBadges.push('top_10_week')
      }
    }

    // 2. Podium
    // Requirement 15.2: Badge pour top 3 du classement général
    if (team.rank <= 3 && team.rank > 0) {
      const hasIt = await hasBadge(userId, 'podium')
      if (!hasIt) {
        await awardBadge(userId, 'podium', gameweek, {
          rank: team.rank,
          points: team.totalPoints
        })
        newBadges.push('podium')
      }
    }

    // 3. Century
    // Requirement 15.3: Badge pour 100+ points en une gameweek
    if (team.gameweekPoints >= 100) {
      const hasIt = await hasBadge(userId, 'century')
      if (!hasIt) {
        await awardBadge(userId, 'century', gameweek, {
          points: team.gameweekPoints
        })
        newBadges.push('century')
      }
    }

    // 4. Captain Parfait
    // Requirement 15.5: Badge pour meilleur Captain de la gameweek
    const captain = team.players.find(p => p.isCaptain)
    if (captain && captain.gameweekPoints >= 20) {
      const bestCaptainScore = await getBestCaptainScore(gameweek)
      
      if (captain.gameweekPoints >= bestCaptainScore) {
        const hasIt = await hasBadge(userId, 'perfect_captain')
        if (!hasIt) {
          await awardBadge(userId, 'perfect_captain', gameweek, {
            points: captain.gameweekPoints
          })
          newBadges.push('perfect_captain')
        }
      }
    }

    // 5. Champion
    // Requirement 15.6: Badge pour 1er du classement général (fin de saison)
    if (team.rank === 1 && isSeasonEnd()) {
      const hasIt = await hasBadge(userId, 'champion')
      if (!hasIt) {
        await awardBadge(userId, 'champion', gameweek, {
          rank: 1,
          points: team.totalPoints
        })
        newBadges.push('champion')
      }
    }

    // 6. Série Gagnante
    // Requirement 15.7: Badge pour 5 gameweeks consécutives gagnées
    const history = await getGameweekHistory(teamId, 5)
    if (history.length >= 5) {
      const allWins = history.every(h => h.rank === 1)
      if (allWins) {
        const hasIt = await hasBadge(userId, 'winning_streak')
        if (!hasIt) {
          await awardBadge(userId, 'winning_streak', gameweek)
          newBadges.push('winning_streak')
        }
      }
    }

    // 7. Wildcard Master
    // Requirement 15.4: Badge pour Wildcard efficace (+50 points)
    // Ce badge sera vérifié séparément lors de l'utilisation du Wildcard
    // via la fonction checkWildcardMasterBadge()

    console.log(`[Fantasy Badges] Awarded ${newBadges.length} new badges:`, newBadges)

    return newBadges
  } catch (error) {
    console.error('[Fantasy Badges] Error checking and awarding badges:', error)
    return []
  }
}

/**
 * Vérifie le badge Wildcard Master après utilisation du Wildcard
 * Requirement 15.4: Badge pour utilisation efficace du Wildcard
 */
export async function checkWildcardMasterBadge(
  userId: string,
  teamId: string,
  gameweek: number,
  pointsBeforeWildcard: number,
  pointsAfterWildcard: number
): Promise<boolean> {
  try {
    const pointsGained = pointsAfterWildcard - pointsBeforeWildcard

    if (pointsGained >= 50) {
      const hasIt = await hasBadge(userId, 'wildcard_master')
      if (!hasIt) {
        await awardBadge(userId, 'wildcard_master', gameweek, {
          points: pointsGained
        })
        console.log(`[Fantasy Badges] Wildcard Master badge awarded to user ${userId}`)
        return true
      }
    }

    return false
  } catch (error) {
    console.error('[Fantasy Badges] Error checking Wildcard Master badge:', error)
    return false
  }
}

/**
 * Récupère une équipe Fantasy
 */
async function getFantasyTeam(teamId: string): Promise<FantasyTeam | null> {
  try {
    const teamsRef = collection(db, 'fantasy_teams')
    const q = query(teamsRef, where('__name__', '==', teamId))
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as FantasyTeam
  } catch (error) {
    console.error('[Fantasy Badges] Error getting fantasy team:', error)
    return null
  }
}

/**
 * Récupère les informations d'un badge
 */
export function getBadgeInfo(badgeType: BadgeType): BadgeInfo {
  return FANTASY_BADGES[badgeType]
}

/**
 * Récupère tous les types de badges disponibles
 */
export function getAllBadgeTypes(): BadgeType[] {
  return Object.keys(FANTASY_BADGES) as BadgeType[]
}

/**
 * Calcule la progression vers un badge
 * Retourne un pourcentage (0-100) ou null si non applicable
 */
export async function getBadgeProgress(
  userId: string,
  teamId: string,
  badgeType: BadgeType
): Promise<number | null> {
  try {
    // Si l'utilisateur a déjà le badge, retourner 100%
    const hasIt = await hasBadge(userId, badgeType)
    if (hasIt) return 100

    const team = await getFantasyTeam(teamId)
    if (!team) return null

    switch (badgeType) {
      case 'top_10_week':
        // Progression basée sur le rang hebdomadaire
        if (team.weeklyRank <= 10) return 100
        if (team.weeklyRank <= 20) return 50
        if (team.weeklyRank <= 50) return 25
        return 0

      case 'podium':
        // Progression basée sur le rang général
        if (team.rank <= 3) return 100
        if (team.rank <= 10) return 75
        if (team.rank <= 20) return 50
        if (team.rank <= 50) return 25
        return 0

      case 'century':
        // Progression basée sur les points de la gameweek
        if (team.gameweekPoints >= 100) return 100
        return Math.min((team.gameweekPoints / 100) * 100, 99)

      case 'perfect_captain':
        // Progression basée sur les points du capitaine
        const captain = team.players.find(p => p.isCaptain)
        if (!captain) return 0
        if (captain.gameweekPoints >= 20) return 100
        return Math.min((captain.gameweekPoints / 20) * 100, 99)

      case 'champion':
        // Progression basée sur le rang (seulement en fin de saison)
        if (!isSeasonEnd()) return null
        if (team.rank === 1) return 100
        if (team.rank <= 3) return 75
        if (team.rank <= 10) return 50
        return 25

      case 'winning_streak':
        // Progression basée sur les victoires consécutives
        const history = await getGameweekHistory(teamId, 5)
        const consecutiveWins = history.filter(h => h.rank === 1).length
        return Math.min((consecutiveWins / 5) * 100, 99)

      case 'wildcard_master':
        // Ce badge ne peut pas avoir de progression prédictive
        return null

      default:
        return null
    }
  } catch (error) {
    console.error('[Fantasy Badges] Error calculating badge progress:', error)
    return null
  }
}
