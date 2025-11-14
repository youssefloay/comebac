#!/usr/bin/env ts-node

/**
 * Script de démarrage d'une nouvelle gameweek
 * 
 * Ce script:
 * 1. Clôture la gameweek actuelle
 * 2. Réinitialise les transferts gratuits (2 par équipe)
 * 3. Réinitialise les points hebdomadaires
 * 4. Crée une nouvelle gameweek
 * 5. Envoie des notifications de deadline aux utilisateurs
 * 
 * Usage:
 *   ts-node scripts/start-new-gameweek.ts
 *   ts-node scripts/start-new-gameweek.ts --date "2024-12-01"  # Spécifier une date de début
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

/**
 * Récupère la gameweek active actuelle
 */
async function getCurrentGameweek(): Promise<any | null> {
  const gameweeksSnapshot = await db.collection('fantasy_gameweeks')
    .where('isActive', '==', true)
    .get()

  if (gameweeksSnapshot.empty) {
    return null
  }

  const doc = gameweeksSnapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

/**
 * Clôture la gameweek actuelle
 */
async function closeCurrentGameweek(gameweekId: string): Promise<void> {
  console.log(`📅 Clôture de la gameweek actuelle...`)
  
  await db.collection('fantasy_gameweeks').doc(gameweekId).update({
    isActive: false,
    isCompleted: true,
    updatedAt: Timestamp.now()
  })
  
  console.log(`✅ Gameweek clôturée`)
}

/**
 * Réinitialise les transferts gratuits pour toutes les équipes
 */
async function resetFreeTransfers(): Promise<number> {
  console.log(`\n🔄 Réinitialisation des transferts gratuits...`)
  
  const teamsSnapshot = await db.collection('fantasy_teams').get()
  
  if (teamsSnapshot.empty) {
    console.log(`ℹ️  Aucune équipe Fantasy trouvée`)
    return 0
  }
  
  const updatePromises = teamsSnapshot.docs.map(doc => {
    return db.collection('fantasy_teams').doc(doc.id).update({
      transfers: 2, // 2 transferts gratuits par gameweek
      updatedAt: Timestamp.now()
    })
  })
  
  await Promise.all(updatePromises)
  
  console.log(`✅ ${teamsSnapshot.size} équipes mises à jour avec 2 transferts gratuits`)
  return teamsSnapshot.size
}

/**
 * Réinitialise les points hebdomadaires pour toutes les équipes
 */
async function resetWeeklyPoints(): Promise<number> {
  console.log(`\n🔄 Réinitialisation des points hebdomadaires...`)
  
  const teamsSnapshot = await db.collection('fantasy_teams').get()
  
  if (teamsSnapshot.empty) {
    console.log(`ℹ️  Aucune équipe Fantasy trouvée`)
    return 0
  }
  
  const updatePromises = teamsSnapshot.docs.map(doc => {
    const team = doc.data()
    
    // Réinitialiser les points hebdomadaires de l'équipe et des joueurs
    const updatedPlayers = (team.players || []).map((player: any) => ({
      ...player,
      gameweekPoints: 0
    }))
    
    return db.collection('fantasy_teams').doc(doc.id).update({
      gameweekPoints: 0,
      players: updatedPlayers,
      updatedAt: Timestamp.now()
    })
  })
  
  await Promise.all(updatePromises)
  
  console.log(`✅ ${teamsSnapshot.size} équipes réinitialisées`)
  return teamsSnapshot.size
}

/**
 * Réinitialise les points hebdomadaires des joueurs dans les stats Fantasy
 */
async function resetPlayerWeeklyStats(): Promise<number> {
  console.log(`\n🔄 Réinitialisation des stats hebdomadaires des joueurs...`)
  
  const statsSnapshot = await db.collection('player_fantasy_stats').get()
  
  if (statsSnapshot.empty) {
    console.log(`ℹ️  Aucune stat Fantasy trouvée`)
    return 0
  }
  
  const updatePromises = statsSnapshot.docs.map(doc => {
    return db.collection('player_fantasy_stats').doc(doc.id).update({
      gameweekPoints: 0,
      updatedAt: Timestamp.now()
    })
  })
  
  await Promise.all(updatePromises)
  
  console.log(`✅ ${statsSnapshot.size} joueurs réinitialisés`)
  return statsSnapshot.size
}

/**
 * Crée une nouvelle gameweek
 */
async function createNewGameweek(
  gameweekNumber: number,
  startDate: Date
): Promise<string> {
  console.log(`\n📅 Création de la gameweek ${gameweekNumber}...`)
  
  // Calculer les dates
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 7) // 7 jours plus tard
  
  const deadline = new Date(startDate)
  deadline.setHours(deadline.getHours() - 2) // 2 heures avant le début
  
  const gameweekDoc = await db.collection('fantasy_gameweeks').add({
    number: gameweekNumber,
    startDate: Timestamp.fromDate(startDate),
    endDate: Timestamp.fromDate(endDate),
    deadline: Timestamp.fromDate(deadline),
    isActive: true,
    isCompleted: false,
    createdAt: Timestamp.now()
  })
  
  console.log(`✅ Gameweek ${gameweekNumber} créée`)
  console.log(`   📅 Début: ${startDate.toLocaleString('fr-FR')}`)
  console.log(`   📅 Fin: ${endDate.toLocaleString('fr-FR')}`)
  console.log(`   ⏰ Deadline: ${deadline.toLocaleString('fr-FR')}`)
  
  return gameweekDoc.id
}

/**
 * Envoie des notifications de deadline à tous les utilisateurs
 */
async function sendDeadlineNotifications(
  gameweekNumber: number,
  deadline: Date
): Promise<number> {
  console.log(`\n📬 Envoi des notifications de deadline...`)
  
  const teamsSnapshot = await db.collection('fantasy_teams').get()
  
  if (teamsSnapshot.empty) {
    console.log(`ℹ️  Aucune équipe Fantasy trouvée`)
    return 0
  }
  
  // Calculer les heures restantes jusqu'à la deadline
  const now = new Date()
  const hoursRemaining = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
  
  const notificationPromises = teamsSnapshot.docs.map(doc => {
    const team = doc.data()
    
    return db.collection('notifications').add({
      userId: team.userId,
      type: 'fantasy_update',
      subType: 'transfer_deadline',
      title: 'Fantasy ComeBac',
      message: `⏰ Nouvelle gameweek ${gameweekNumber} ! Deadline de transferts dans ${hoursRemaining}h`,
      link: '/public/fantasy/transfers',
      read: false,
      metadata: {
        gameweek: gameweekNumber,
        hoursRemaining,
        deadline: deadline.toISOString()
      },
      createdAt: Timestamp.now()
    })
  })
  
  await Promise.all(notificationPromises)
  
  console.log(`✅ ${teamsSnapshot.size} notifications envoyées`)
  return teamsSnapshot.size
}

/**
 * Calcule le classement hebdomadaire basé sur les points de la gameweek précédente
 */
async function calculateWeeklyRanking(previousGameweek: number): Promise<void> {
  console.log(`\n🏆 Calcul du classement hebdomadaire (Gameweek ${previousGameweek})...`)
  
  const teamsSnapshot = await db.collection('fantasy_teams').get()
  
  if (teamsSnapshot.empty) {
    console.log(`ℹ️  Aucune équipe Fantasy trouvée`)
    return
  }
  
  // Récupérer les équipes avec leurs points hebdomadaires
  const teams = teamsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  
  // Trier par points hebdomadaires
  teams.sort((a: any, b: any) => (b.gameweekPoints || 0) - (a.gameweekPoints || 0))
  
  // Mettre à jour les rangs hebdomadaires
  const updatePromises = teams.map((team: any, index: number) => {
    return db.collection('fantasy_teams').doc(team.id).update({
      weeklyRank: index + 1,
      updatedAt: Timestamp.now()
    })
  })
  
  await Promise.all(updatePromises)
  
  console.log(`✅ Classement hebdomadaire calculé`)
  
  // Afficher le top 3
  if (teams.length > 0) {
    console.log(`\n🏆 Top 3 de la gameweek ${previousGameweek}:`)
    teams.slice(0, 3).forEach((team: any, index: number) => {
      console.log(`   ${index + 1}. ${team.teamName}: ${team.gameweekPoints || 0} points`)
    })
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🎮 Démarrage d'une nouvelle gameweek Fantasy`)
  console.log('='.repeat(60))
  
  try {
    // 1. Récupérer la gameweek actuelle
    const currentGameweek = await getCurrentGameweek()
    
    let nextGameweekNumber = 1
    let startDate = new Date()
    
    if (currentGameweek) {
      console.log(`\n📊 Gameweek actuelle: ${currentGameweek.number}`)
      nextGameweekNumber = currentGameweek.number + 1
      
      // Calculer le classement hebdomadaire avant de clôturer
      await calculateWeeklyRanking(currentGameweek.number)
      
      // Clôturer la gameweek actuelle
      await closeCurrentGameweek(currentGameweek.id)
      
      // La nouvelle gameweek commence à la fin de l'ancienne
      startDate = currentGameweek.endDate.toDate()
    } else {
      console.log(`\nℹ️  Aucune gameweek active trouvée`)
      console.log(`   Création de la première gameweek`)
    }
    
    // Vérifier si une date de début personnalisée est fournie
    const args = process.argv.slice(2)
    const dateIndex = args.indexOf('--date')
    if (dateIndex !== -1 && args[dateIndex + 1]) {
      startDate = new Date(args[dateIndex + 1])
      console.log(`\n📅 Date de début personnalisée: ${startDate.toLocaleString('fr-FR')}`)
    }
    
    // 2. Réinitialiser les transferts gratuits
    const teamsUpdated = await resetFreeTransfers()
    
    // 3. Réinitialiser les points hebdomadaires
    await resetWeeklyPoints()
    
    // 4. Réinitialiser les stats hebdomadaires des joueurs
    await resetPlayerWeeklyStats()
    
    // 5. Créer la nouvelle gameweek
    const newGameweekId = await createNewGameweek(nextGameweekNumber, startDate)
    
    // 6. Envoyer les notifications de deadline
    const notificationsSent = await sendDeadlineNotifications(
      nextGameweekNumber,
      new Date(startDate.getTime() - 2 * 60 * 60 * 1000) // deadline = 2h avant
    )
    
    // 7. Résumé
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Nouvelle gameweek ${nextGameweekNumber} démarrée avec succès!`)
    console.log('='.repeat(60))
    console.log(`\n📊 Résumé:`)
    console.log(`   • Gameweek: ${nextGameweekNumber}`)
    console.log(`   • Équipes mises à jour: ${teamsUpdated}`)
    console.log(`   • Notifications envoyées: ${notificationsSent}`)
    console.log(`   • Date de début: ${startDate.toLocaleString('fr-FR')}`)
    console.log(`\n📋 Prochaines étapes:`)
    console.log(`   1. Les utilisateurs peuvent effectuer leurs transferts`)
    console.log(`   2. Après chaque match, exécutez le script de mise à jour des points`)
    console.log(`   3. À la fin de la gameweek, exécutez à nouveau ce script`)
    console.log('')
    
    process.exit(0)
  } catch (error) {
    console.error(`\n❌ Erreur lors du démarrage de la nouvelle gameweek:`, error)
    process.exit(1)
  }
}

// Exécuter le script
main()
