import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Types de notifications Fantasy
 */
export type FantasyNotificationType = 
  | 'points_earned'
  | 'captain_scored'
  | 'badge_earned'
  | 'rank_improved'
  | 'player_performance'
  | 'transfer_deadline'
  | 'player_alert'

/**
 * Métadonnées pour les notifications Fantasy
 */
export interface FantasyNotificationMetadata {
  points?: number
  badgeType?: string
  badgeName?: string
  newRank?: number
  oldRank?: number
  playerId?: string
  playerName?: string
  gameweek?: number
  teamId?: string
  teamName?: string
  hoursRemaining?: number
  alertType?: 'injury' | 'suspension' | 'unavailable'
}

/**
 * Paramètres pour créer une notification Fantasy
 */
export interface FantasyNotificationParams {
  userId: string
  type: FantasyNotificationType
  metadata?: FantasyNotificationMetadata
  link?: string
}

/**
 * Messages de notification selon le type
 */
const NOTIFICATION_MESSAGES: Record<FantasyNotificationType, (metadata: FantasyNotificationMetadata) => { title: string; message: string }> = {
  points_earned: (metadata) => ({
    title: 'Fantasy ComeBac',
    message: `⚽ Votre équipe a marqué ${metadata.points || 0} points !`
  }),
  
  captain_scored: (metadata) => ({
    title: 'Fantasy ComeBac',
    message: `👑 Votre capitaine ${metadata.playerName || ''} a marqué ${metadata.points || 0} points (x2) !`
  }),
  
  badge_earned: (metadata) => ({
    title: 'Fantasy ComeBac',
    message: `🏆 Nouveau badge débloqué : ${metadata.badgeName || metadata.badgeType || 'Badge'}`
  }),
  
  rank_improved: (metadata) => ({
    title: 'Fantasy ComeBac',
    message: `📈 Vous êtes maintenant ${metadata.newRank}${metadata.newRank === 1 ? 'er' : 'ème'} !`
  }),
  
  player_performance: (metadata) => ({
    title: 'Fantasy ComeBac',
    message: `⭐ ${metadata.playerName || 'Un joueur'} a marqué ${metadata.points || 0} points !`
  }),
  
  transfer_deadline: (metadata) => ({
    title: 'Fantasy ComeBac',
    message: `⏰ Deadline de transferts dans ${metadata.hoursRemaining || 24}h`
  }),
  
  player_alert: (metadata) => {
    const alertMessages = {
      injury: 'est blessé',
      suspension: 'est suspendu',
      unavailable: 'est indisponible'
    }
    const status = alertMessages[metadata.alertType || 'unavailable']
    return {
      title: 'Fantasy ComeBac',
      message: `⚠️ ${metadata.playerName || 'Un joueur'} ${status}`
    }
  }
}

/**
 * Envoie une notification Fantasy à un utilisateur
 */
export async function sendFantasyNotification({
  userId,
  type,
  metadata = {},
  link
}: FantasyNotificationParams): Promise<{ success: boolean; notificationId?: string; error?: any }> {
  try {
    const { title, message } = NOTIFICATION_MESSAGES[type](metadata)
    
    const notificationsRef = collection(db, 'notifications')
    const notificationDoc = await addDoc(notificationsRef, {
      userId,
      type: 'fantasy_update',
      subType: type,
      title,
      message,
      link: link || '/public/fantasy/my-team',
      read: false,
      metadata,
      createdAt: serverTimestamp()
    })

    console.log(`✅ Notification Fantasy envoyée à ${userId}: ${type}`)
    return { success: true, notificationId: notificationDoc.id }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification Fantasy:', error)
    return { success: false, error }
  }
}

/**
 * Notifie l'utilisateur des points gagnés après un match
 */
export async function notifyPointsEarned(
  userId: string,
  points: number,
  gameweek: number
): Promise<{ success: boolean; notificationId?: string }> {
  return sendFantasyNotification({
    userId,
    type: 'points_earned',
    metadata: { points, gameweek }
  })
}

/**
 * Notifie l'utilisateur que son capitaine a marqué des points
 */
export async function notifyCaptainScored(
  userId: string,
  playerName: string,
  points: number,
  gameweek: number
): Promise<{ success: boolean; notificationId?: string }> {
  return sendFantasyNotification({
    userId,
    type: 'captain_scored',
    metadata: { playerName, points, gameweek }
  })
}

/**
 * Notifie l'utilisateur qu'il a gagné un badge
 */
export async function notifyBadgeEarned(
  userId: string,
  badgeType: string,
  badgeName: string,
  gameweek?: number
): Promise<{ success: boolean; notificationId?: string }> {
  return sendFantasyNotification({
    userId,
    type: 'badge_earned',
    metadata: { badgeType, badgeName, gameweek },
    link: '/public/fantasy/rewards'
  })
}

/**
 * Notifie l'utilisateur que son classement s'est amélioré
 */
export async function notifyRankImproved(
  userId: string,
  newRank: number,
  oldRank: number,
  gameweek: number
): Promise<{ success: boolean; notificationId?: string }> {
  return sendFantasyNotification({
    userId,
    type: 'rank_improved',
    metadata: { newRank, oldRank, gameweek },
    link: '/public/fantasy/leaderboard'
  })
}

/**
 * Notifie l'utilisateur qu'un de ses joueurs a eu une excellente performance
 */
export async function notifyPlayerPerformance(
  userId: string,
  playerId: string,
  playerName: string,
  points: number,
  gameweek: number
): Promise<{ success: boolean; notificationId?: string }> {
  return sendFantasyNotification({
    userId,
    type: 'player_performance',
    metadata: { playerId, playerName, points, gameweek },
    link: `/public/fantasy/player/${playerId}`
  })
}

/**
 * Notifie l'utilisateur que la deadline de transferts approche
 */
export async function notifyTransferDeadline(
  userId: string,
  hoursRemaining: number,
  gameweek: number
): Promise<{ success: boolean; notificationId?: string }> {
  return sendFantasyNotification({
    userId,
    type: 'transfer_deadline',
    metadata: { hoursRemaining, gameweek },
    link: '/public/fantasy/transfers'
  })
}

/**
 * Notifie l'utilisateur qu'un de ses joueurs est blessé/suspendu
 */
export async function notifyPlayerAlert(
  userId: string,
  playerId: string,
  playerName: string,
  alertType: 'injury' | 'suspension' | 'unavailable'
): Promise<{ success: boolean; notificationId?: string }> {
  return sendFantasyNotification({
    userId,
    type: 'player_alert',
    metadata: { playerId, playerName, alertType },
    link: '/public/fantasy/transfers'
  })
}

/**
 * Envoie des notifications en batch à plusieurs utilisateurs
 */
export async function sendBatchFantasyNotifications(
  notifications: FantasyNotificationParams[]
): Promise<{ success: boolean; count: number; errors: any[] }> {
  const results = await Promise.allSettled(
    notifications.map(notification => sendFantasyNotification(notification))
  )
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const errors = results
    .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
    .map(r => r.status === 'rejected' ? r.reason : (r as any).value.error)
  
  console.log(`✅ ${successful}/${notifications.length} notifications Fantasy envoyées`)
  
  return {
    success: errors.length === 0,
    count: successful,
    errors
  }
}
