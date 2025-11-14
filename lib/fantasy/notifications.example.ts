/**
 * Example usage of the Fantasy notification system
 * 
 * This file demonstrates how to use the notification functions
 * in different scenarios throughout the Fantasy mode.
 */

import {
  notifyPointsEarned,
  notifyCaptainScored,
  notifyBadgeEarned,
  notifyRankImproved,
  notifyPlayerPerformance,
  notifyTransferDeadline,
  notifyPlayerAlert,
  sendBatchFantasyNotifications
} from './notifications'

/**
 * Example 1: Notify user after a match ends
 * Called from the match update script
 */
export async function exampleAfterMatchNotifications(
  userId: string,
  teamPoints: number,
  captainName: string,
  captainPoints: number,
  gameweek: number
) {
  // Notify total points earned
  await notifyPointsEarned(userId, teamPoints, gameweek)
  
  // If captain scored significant points, send special notification
  if (captainPoints >= 10) {
    await notifyCaptainScored(userId, captainName, captainPoints, gameweek)
  }
}

/**
 * Example 2: Notify user when they earn a badge
 * Called from the badge checking system
 */
export async function exampleBadgeNotification(
  userId: string,
  badgeType: string,
  gameweek: number
) {
  const badgeNames: Record<string, string> = {
    'top_10_week': 'Top 10 de la semaine',
    'podium': 'Podium',
    'century': 'Century',
    'wildcard_master': 'Wildcard Master',
    'perfect_captain': 'Captain Parfait',
    'champion': 'Champion Fantasy',
    'winning_streak': 'Série Gagnante'
  }
  
  await notifyBadgeEarned(
    userId,
    badgeType,
    badgeNames[badgeType] || badgeType,
    gameweek
  )
}

/**
 * Example 3: Notify user when rank improves
 * Called after leaderboard update
 */
export async function exampleRankNotification(
  userId: string,
  newRank: number,
  oldRank: number,
  gameweek: number
) {
  // Only notify if rank improved significantly
  if (newRank < oldRank && (oldRank - newRank >= 10 || newRank <= 10)) {
    await notifyRankImproved(userId, newRank, oldRank, gameweek)
  }
}

/**
 * Example 4: Notify user of excellent player performance
 * Called after match when a player scores 15+ points
 */
export async function examplePlayerPerformanceNotification(
  userId: string,
  playerId: string,
  playerName: string,
  points: number,
  gameweek: number
) {
  if (points >= 15) {
    await notifyPlayerPerformance(userId, playerId, playerName, points, gameweek)
  }
}

/**
 * Example 5: Send transfer deadline reminders
 * Called by a scheduled job 24h before deadline
 */
export async function exampleTransferDeadlineReminders(
  userIds: string[],
  hoursRemaining: number,
  gameweek: number
) {
  const notifications = userIds.map(userId => ({
    userId,
    type: 'transfer_deadline' as const,
    metadata: { hoursRemaining, gameweek },
    link: '/public/fantasy/transfers'
  }))
  
  await sendBatchFantasyNotifications(notifications)
}

/**
 * Example 6: Alert user about player unavailability
 * Called when a player is marked as injured/suspended
 */
export async function examplePlayerAlertNotification(
  userId: string,
  playerId: string,
  playerName: string,
  alertType: 'injury' | 'suspension' | 'unavailable'
) {
  await notifyPlayerAlert(userId, playerId, playerName, alertType)
}

/**
 * Example 7: Batch notifications after gameweek ends
 * Send multiple notifications to all users at once
 */
export async function exampleGameweekEndNotifications(
  fantasyTeams: Array<{
    userId: string
    points: number
    newRank: number
    oldRank: number
    captainName: string
    captainPoints: number
  }>,
  gameweek: number
) {
  const notifications = fantasyTeams.flatMap(team => {
    const notifs = []
    
    // Points earned notification
    notifs.push({
      userId: team.userId,
      type: 'points_earned' as const,
      metadata: { points: team.points, gameweek }
    })
    
    // Captain notification if significant
    if (team.captainPoints >= 10) {
      notifs.push({
        userId: team.userId,
        type: 'captain_scored' as const,
        metadata: {
          playerName: team.captainName,
          points: team.captainPoints,
          gameweek
        }
      })
    }
    
    // Rank improvement notification
    if (team.newRank < team.oldRank && team.newRank <= 100) {
      notifs.push({
        userId: team.userId,
        type: 'rank_improved' as const,
        metadata: {
          newRank: team.newRank,
          oldRank: team.oldRank,
          gameweek
        },
        link: '/public/fantasy/leaderboard'
      })
    }
    
    return notifs
  })
  
  const result = await sendBatchFantasyNotifications(notifications)
  console.log(`Sent ${result.count} notifications to ${fantasyTeams.length} teams`)
}
