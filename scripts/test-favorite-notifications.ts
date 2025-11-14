/**
 * Script de test pour les notifications de favoris
 * 
 * Usage:
 * 1. Ajouter une équipe en favoris
 * 2. Exécuter ce script pour tester différents types de notifications
 */

import {
  notifyUpcomingMatch,
  notifyMatchResult,
  notifyNewCaptain,
  notifyNewPlayer,
  notifyRankingChange,
  notifyBadgeUnlocked,
  notifyTeamAnnouncement
} from '../lib/favorite-notifications'

async function testNotifications() {
  const teamId = 'TEAM_ID_HERE' // Remplacer par un vrai ID
  const teamName = 'Road To Glory'

  console.log('🧪 Test des notifications de favoris...\n')

  // Test 1: Match à venir
  console.log('1️⃣ Test: Match à venir')
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(15, 0, 0, 0)
  
  await notifyUpcomingMatch(
    teamId,
    teamName,
    'Saints',
    tomorrow,
    'Stade de Road To Glory'
  )
  console.log('✅ Notification envoyée\n')

  // Test 2: Résultat de match (victoire)
  console.log('2️⃣ Test: Résultat de match (victoire)')
  await notifyMatchResult(
    teamId,
    teamName,
    'Blues',
    '3-1',
    true
  )
  console.log('✅ Notification envoyée\n')

  // Test 3: Résultat de match (défaite)
  console.log('3️⃣ Test: Résultat de match (défaite)')
  await notifyMatchResult(
    teamId,
    teamName,
    'Se7en',
    '1-2',
    false
  )
  console.log('✅ Notification envoyée\n')

  // Test 4: Nouveau capitaine
  console.log('4️⃣ Test: Nouveau capitaine')
  await notifyNewCaptain(
    teamId,
    teamName,
    'Ali Sabry'
  )
  console.log('✅ Notification envoyée\n')

  // Test 5: Nouveau joueur
  console.log('5️⃣ Test: Nouveau joueur')
  await notifyNewPlayer(
    teamId,
    teamName,
    'Karim Benzema',
    'Attaquant'
  )
  console.log('✅ Notification envoyée\n')

  // Test 6: Changement de classement (montée)
  console.log('6️⃣ Test: Changement de classement (montée)')
  await notifyRankingChange(
    teamId,
    teamName,
    2,
    4
  )
  console.log('✅ Notification envoyée\n')

  // Test 7: Badge débloqué
  console.log('7️⃣ Test: Badge débloqué')
  await notifyBadgeUnlocked(
    teamId,
    teamName,
    'Série de victoires',
    '5 victoires consécutives'
  )
  console.log('✅ Notification envoyée\n')

  // Test 8: Annonce de l'équipe
  console.log('8️⃣ Test: Annonce de l\'équipe')
  await notifyTeamAnnouncement(
    teamId,
    teamName,
    'Entraînement annulé demain en raison de la pluie. Reprise mercredi à 18h.'
  )
  console.log('✅ Notification envoyée\n')

  console.log('✨ Tous les tests terminés !')
}

// Exécuter les tests
testNotifications().catch(console.error)
