import { db } from './firebase'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'

export type FavoriteNotificationType = 
  | 'match_upcoming'
  | 'match_result'
  | 'new_captain'
  | 'new_player'
  | 'ranking_change'
  | 'badge_unlocked'
  | 'team_announcement'

interface NotifyFavoriteFollowersParams {
  teamId: string
  teamName: string
  type: FavoriteNotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}

/**
 * Envoie une notification à tous les utilisateurs qui ont cette équipe en favoris
 */
export async function notifyFavoriteFollowers({
  teamId,
  teamName,
  type,
  title,
  message,
  link,
  metadata
}: NotifyFavoriteFollowersParams) {
  try {
    // Récupérer tous les favoris pour cette équipe
    const favoritesRef = collection(db, 'favorites')
    const q = query(
      favoritesRef,
      where('itemId', '==', teamId),
      where('type', '==', 'team')
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.log(`Aucun follower pour l'équipe ${teamName}`)
      return { success: true, count: 0 }
    }

    // Créer une notification pour chaque follower
    const notificationsRef = collection(db, 'notifications')
    const promises = snapshot.docs.map(async (doc) => {
      const favorite = doc.data()
      
      return addDoc(notificationsRef, {
        userId: favorite.userId,
        type: 'favorite_team_update',
        subType: type,
        title,
        message,
        link: link || `/public/team/${teamId}`,
        read: false,
        teamId,
        teamName,
        metadata: metadata || {},
        createdAt: serverTimestamp()
      })
    })

    await Promise.all(promises)
    
    console.log(`✅ ${promises.length} notifications envoyées pour ${teamName}`)
    return { success: true, count: promises.length }
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications:', error)
    return { success: false, error }
  }
}

/**
 * Notifie d'un match à venir (24h avant)
 */
export async function notifyUpcomingMatch(
  teamId: string,
  teamName: string,
  opponent: string,
  matchDate: Date,
  location: string
) {
  const dateStr = matchDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })

  return notifyFavoriteFollowers({
    teamId,
    teamName,
    type: 'match_upcoming',
    title: `⚽ Match demain : ${teamName}`,
    message: `${teamName} affronte ${opponent} ${dateStr} à ${location}`,
    metadata: { opponent, matchDate: matchDate.toISOString(), location }
  })
}

/**
 * Notifie d'un résultat de match
 */
export async function notifyMatchResult(
  teamId: string,
  teamName: string,
  opponent: string,
  score: string,
  won: boolean
) {
  const emoji = won ? '🎉' : '😔'
  const result = won ? 'a gagné' : 'a perdu'

  return notifyFavoriteFollowers({
    teamId,
    teamName,
    type: 'match_result',
    title: `${emoji} Résultat : ${teamName}`,
    message: `${teamName} ${result} ${score} contre ${opponent}`,
    metadata: { opponent, score, won }
  })
}

/**
 * Notifie d'un nouveau capitaine
 */
export async function notifyNewCaptain(
  teamId: string,
  teamName: string,
  captainName: string
) {
  return notifyFavoriteFollowers({
    teamId,
    teamName,
    type: 'new_captain',
    title: `👑 Nouveau capitaine : ${teamName}`,
    message: `${captainName} est maintenant capitaine de ${teamName}`,
    metadata: { captainName }
  })
}

/**
 * Notifie d'un nouveau joueur
 */
export async function notifyNewPlayer(
  teamId: string,
  teamName: string,
  playerName: string,
  position: string
) {
  return notifyFavoriteFollowers({
    teamId,
    teamName,
    type: 'new_player',
    title: `✨ Nouveau joueur : ${teamName}`,
    message: `${playerName} (${position}) rejoint ${teamName}`,
    metadata: { playerName, position }
  })
}

/**
 * Notifie d'un changement de classement
 */
export async function notifyRankingChange(
  teamId: string,
  teamName: string,
  newRank: number,
  oldRank: number
) {
  const direction = newRank < oldRank ? 'monte' : 'descend'
  const emoji = newRank < oldRank ? '📈' : '📉'

  return notifyFavoriteFollowers({
    teamId,
    teamName,
    type: 'ranking_change',
    title: `${emoji} Classement : ${teamName}`,
    message: `${teamName} ${direction} à la ${newRank}${newRank === 1 ? 'ère' : 'ème'} place !`,
    metadata: { newRank, oldRank }
  })
}

/**
 * Notifie d'un badge débloqué
 */
export async function notifyBadgeUnlocked(
  teamId: string,
  teamName: string,
  badgeName: string,
  badgeDescription: string
) {
  return notifyFavoriteFollowers({
    teamId,
    teamName,
    type: 'badge_unlocked',
    title: `🏆 Badge débloqué : ${teamName}`,
    message: `${teamName} a débloqué "${badgeName}" - ${badgeDescription}`,
    metadata: { badgeName, badgeDescription }
  })
}

/**
 * Notifie d'une annonce de l'équipe (par le coach)
 */
export async function notifyTeamAnnouncement(
  teamId: string,
  teamName: string,
  announcement: string
) {
  return notifyFavoriteFollowers({
    teamId,
    teamName,
    type: 'team_announcement',
    title: `📢 Annonce : ${teamName}`,
    message: announcement,
    metadata: { announcement }
  })
}
