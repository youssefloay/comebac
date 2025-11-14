#!/usr/bin/env ts-node

/**
 * Script de mise à jour des prix des joueurs Fantasy
 * 
 * Ce script met à jour les prix de tous les joueurs basés sur leur forme récente.
 * Il doit être exécuté hebdomadairement, typiquement au début d'une nouvelle gameweek.
 * 
 * Règles d'ajustement:
 * - Forme excellente (>8 pts/match): +0.3M€
 * - Bonne forme (6-8 pts/match): +0.2M€
 * - Forme correcte (4-6 pts/match): +0.1M€
 * - Forme moyenne (3-4 pts/match): pas de changement
 * - Mauvaise forme (2-3 pts/match): -0.2M€
 * - Très mauvaise forme (<2 pts/match): -0.3M€
 * - Variation maximale: ±0.5M€ par gameweek
 * 
 * Usage:
 *   ts-node scripts/update-player-prices.ts
 *   ts-node scripts/update-player-prices.ts --dry-run  # Simulation sans modification
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import type { Player } from '../lib/types'
import type { Position, PlayerFantasyStats } from '../lib/types/fantasy'

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
 * Récupère tous les joueurs de la base de données
 */
async function getAllPlayers(): Promise<Player[]> {
  try {
    const playersSnapshot = await db.collection('players').get()
    return playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Player[]
  } catch (error) {
    console.error('Error getting all players:', error)
    throw error
  }
}

/**
 * Récupère les statistiques Fantasy d'un joueur
 */
async function getPlayerFantasyStats(playerId: string): Promise<PlayerFantasyStats | null> {
  try {
    const statsSnapshot = await db.collection('player_fantasy_stats')
      .where('playerId', '==', playerId)
      .get()
    
    if (statsSnapshot.empty) {
      return null
    }
    
    const doc = statsSnapshot.docs[0]
    return {
      playerId: doc.data().playerId,
      price: doc.data().price,
      totalPoints: doc.data().totalPoints,
      gameweekPoints: doc.data().gameweekPoints,
      popularity: doc.data().popularity,
      form: doc.data().form || [],
      priceChange: doc.data().priceChange,
      selectedBy: doc.data().selectedBy,
      updatedAt: doc.data().updatedAt || Timestamp.now(),
    } as PlayerFantasyStats
  } catch (error) {
    console.error(`Error getting fantasy stats for player ${playerId}:`, error)
    return null
  }
}

/**
 * Met à jour les statistiques Fantasy d'un joueur
 */
async function updatePlayerFantasyStats(
  playerId: string,
  stats: Partial<PlayerFantasyStats>,
  dryRun: boolean = false
): Promise<void> {
  if (dryRun) {
    return // Ne pas modifier en mode dry-run
  }

  try {
    const statsSnapshot = await db.collection('player_fantasy_stats')
      .where('playerId', '==', playerId)
      .get()
    
    if (statsSnapshot.empty) {
      console.warn(`No fantasy stats found for player ${playerId}`)
      return
    }
    
    const docRef = statsSnapshot.docs[0].ref
    await docRef.update({
      ...stats,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error(`Error updating fantasy stats for player ${playerId}:`, error)
    throw error
  }
}

/**
 * Calcule le changement de prix recommandé basé sur la forme
 */
function calculatePriceChange(form: number[]): number {
  if (form.length === 0) {
    return 0
  }
  
  const recentForm = form.slice(-5)
  const avgPoints = recentForm.reduce((sum, points) => sum + points, 0) / recentForm.length
  
  let priceChange = 0
  
  if (avgPoints > 8) {
    priceChange = 0.3
  } else if (avgPoints > 6) {
    priceChange = 0.2
  } else if (avgPoints > 4) {
    priceChange = 0.1
  } else if (avgPoints < 2) {
    priceChange = -0.3
  } else if (avgPoints < 3) {
    priceChange = -0.2
  }
  
  // Limiter à ±0.5M€
  return Math.max(-0.5, Math.min(0.5, priceChange))
}

/**
 * Formate le changement de prix avec des flèches
 */
function formatPriceChange(change: number): string {
  if (change > 0) {
    return `📈 +${change.toFixed(1)}M€`
  } else if (change < 0) {
    return `📉 ${change.toFixed(1)}M€`
  } else {
    return `➖ 0.0M€`
  }
}

/**
 * Formate la forme avec des emojis
 */
function formatForm(avgPoints: number): string {
  if (avgPoints > 8) {
    return `🔥 Excellente (${avgPoints.toFixed(1)} pts/match)`
  } else if (avgPoints > 6) {
    return `✅ Bonne (${avgPoints.toFixed(1)} pts/match)`
  } else if (avgPoints > 4) {
    return `👍 Correcte (${avgPoints.toFixed(1)} pts/match)`
  } else if (avgPoints > 3) {
    return `😐 Moyenne (${avgPoints.toFixed(1)} pts/match)`
  } else if (avgPoints > 2) {
    return `👎 Mauvaise (${avgPoints.toFixed(1)} pts/match)`
  } else {
    return `❌ Très mauvaise (${avgPoints.toFixed(1)} pts/match)`
  }
}

/**
 * Met à jour les prix de tous les joueurs
 */
async function updatePlayerPrices(dryRun: boolean = false): Promise<void> {
  console.log('\n' + '='.repeat(70))
  console.log('💰 MISE À JOUR DES PRIX DES JOUEURS FANTASY')
  console.log('='.repeat(70))
  
  if (dryRun) {
    console.log('\n⚠️  MODE SIMULATION - Aucune modification ne sera effectuée\n')
  }
  
  try {
    const players = await getAllPlayers()
    console.log(`\n📊 ${players.length} joueurs à traiter\n`)
    
    let updatedCount = 0
    let stableCount = 0
    let noFormCount = 0
    let increasedCount = 0
    let decreasedCount = 0
    
    const priceChanges: Array<{
      name: string
      position: Position
      oldPrice: number
      newPrice: number
      change: number
      form: number
    }> = []
    
    for (const player of players) {
      const stats = await getPlayerFantasyStats(player.id)
      
      if (!stats) {
        console.log(`⚠️  ${player.name} - Pas de stats Fantasy`)
        continue
      }
      
      // Calculer la forme récente (moyenne des 5 derniers matchs)
      const recentForm = stats.form.slice(-5)
      
      if (recentForm.length === 0) {
        console.log(`⏭️  ${player.name} - Pas de forme récente (prix: ${stats.price.toFixed(1)}M€)`)
        noFormCount++
        continue
      }
      
      const avgPoints = recentForm.reduce((sum, points) => sum + points, 0) / recentForm.length
      
      // Calculer le changement de prix
      let priceChange = calculatePriceChange(recentForm)
      
      // Arrondir à 0.1M€ près
      priceChange = Math.round(priceChange * 10) / 10
      
      if (priceChange !== 0) {
        const newPrice = Math.max(4.0, Math.min(15.0, stats.price + priceChange))
        const actualChange = newPrice - stats.price
        
        // Mettre à jour les stats
        await updatePlayerFantasyStats(player.id, {
          price: newPrice,
          priceChange: actualChange,
        }, dryRun)
        
        priceChanges.push({
          name: player.name,
          position: player.position as Position,
          oldPrice: stats.price,
          newPrice: newPrice,
          change: actualChange,
          form: avgPoints
        })
        
        console.log(
          `${formatPriceChange(actualChange)} ${player.name} (${player.position}): ` +
          `${stats.price.toFixed(1)}M€ → ${newPrice.toFixed(1)}M€ - ${formatForm(avgPoints)}`
        )
        
        updatedCount++
        if (actualChange > 0) increasedCount++
        if (actualChange < 0) decreasedCount++
      } else {
        console.log(
          `➖ ${player.name} (${player.position}): ` +
          `${stats.price.toFixed(1)}M€ (stable) - ${formatForm(avgPoints)}`
        )
        stableCount++
      }
    }
    
    // Résumé
    console.log('\n' + '='.repeat(70))
    console.log('📊 RÉSUMÉ DE LA MISE À JOUR')
    console.log('='.repeat(70))
    console.log(`\n✅ Joueurs traités: ${players.length}`)
    console.log(`   📈 Prix augmentés: ${increasedCount}`)
    console.log(`   📉 Prix diminués: ${decreasedCount}`)
    console.log(`   ➖ Prix stables: ${stableCount}`)
    console.log(`   ⏭️  Sans forme: ${noFormCount}`)
    console.log(`   🔄 Total modifiés: ${updatedCount}`)
    
    // Top 5 des plus grandes augmentations
    if (priceChanges.length > 0) {
      const topIncreases = priceChanges
        .filter(p => p.change > 0)
        .sort((a, b) => b.change - a.change)
        .slice(0, 5)
      
      if (topIncreases.length > 0) {
        console.log('\n📈 TOP 5 DES PLUS GRANDES AUGMENTATIONS:')
        topIncreases.forEach((p, i) => {
          console.log(
            `   ${i + 1}. ${p.name} (${p.position}): ` +
            `+${p.change.toFixed(1)}M€ (${p.oldPrice.toFixed(1)}M€ → ${p.newPrice.toFixed(1)}M€)`
          )
        })
      }
      
      // Top 5 des plus grandes diminutions
      const topDecreases = priceChanges
        .filter(p => p.change < 0)
        .sort((a, b) => a.change - b.change)
        .slice(0, 5)
      
      if (topDecreases.length > 0) {
        console.log('\n📉 TOP 5 DES PLUS GRANDES DIMINUTIONS:')
        topDecreases.forEach((p, i) => {
          console.log(
            `   ${i + 1}. ${p.name} (${p.position}): ` +
            `${p.change.toFixed(1)}M€ (${p.oldPrice.toFixed(1)}M€ → ${p.newPrice.toFixed(1)}M€)`
          )
        })
      }
    }
    
    console.log('\n' + '='.repeat(70))
    if (dryRun) {
      console.log('⚠️  MODE SIMULATION - Aucune modification effectuée')
    } else {
      console.log('✅ Mise à jour des prix terminée avec succès')
    }
    console.log('='.repeat(70) + '\n')
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la mise à jour des prix:', error)
    throw error
  }
}

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    const args = process.argv.slice(2)
    const dryRun = args.includes('--dry-run')
    
    if (dryRun) {
      console.log('\n🔍 Exécution en mode simulation (dry-run)')
    }
    
    await updatePlayerPrices(dryRun)
    
    console.log('✅ Script terminé avec succès\n')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution du script:', error)
    process.exit(1)
  }
}

// Exécuter le script
main()
