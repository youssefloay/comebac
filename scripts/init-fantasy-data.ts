/**
 * Script d'initialisation des données Fantasy
 * 
 * Ce script initialise les données nécessaires pour le mode Fantasy:
 * - Calcule le prix initial de tous les joueurs
 * - Crée les PlayerFantasyStats pour chaque joueur
 * - Crée la première gameweek
 * 
 * Usage: npx ts-node scripts/init-fantasy-data.ts
 */

import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query,
  where,
  Timestamp 
} from 'firebase/firestore'
import { calculateInitialPrice } from '../lib/fantasy/player-pricing'
import type { Player } from '../lib/types'
import type { PlayerFantasyStats, GameweekInfo } from '../lib/types/fantasy'

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/**
 * Récupère tous les joueurs de la base de données
 */
async function getAllPlayers(): Promise<Player[]> {
  try {
    console.log('📥 Récupération de tous les joueurs...')
    const playersSnapshot = await getDocs(collection(db, 'players'))
    const players = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Player[]
    
    console.log(`✅ ${players.length} joueurs récupérés`)
    return players
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des joueurs:', error)
    throw error
  }
}

/**
 * Vérifie si les stats Fantasy existent déjà pour un joueur
 */
async function playerFantasyStatsExist(playerId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'player_fantasy_stats'),
      where('playerId', '==', playerId)
    )
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error(`Erreur lors de la vérification des stats pour ${playerId}:`, error)
    return false
  }
}

/**
 * Crée les statistiques Fantasy pour un joueur
 */
async function createPlayerFantasyStats(
  player: Player,
  price: number
): Promise<void> {
  try {
    const stats: Omit<PlayerFantasyStats, 'updatedAt'> & { updatedAt: Timestamp } = {
      playerId: player.id,
      price: price,
      totalPoints: 0,
      gameweekPoints: 0,
      popularity: 0,
      form: [],
      priceChange: 0,
      selectedBy: 0,
      updatedAt: Timestamp.now(),
    }
    
    await addDoc(collection(db, 'player_fantasy_stats'), stats)
    console.log(`   ✅ ${player.name} - ${price.toFixed(1)}M€`)
  } catch (error) {
    console.error(`   ❌ Erreur pour ${player.name}:`, error)
    throw error
  }
}

/**
 * Vérifie si une gameweek existe déjà
 */
async function gameweekExists(gameweekNumber: number): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'fantasy_gameweeks'),
      where('number', '==', gameweekNumber)
    )
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error(`Erreur lors de la vérification de la gameweek ${gameweekNumber}:`, error)
    return false
  }
}

/**
 * Crée une nouvelle gameweek
 */
async function createGameweek(
  gameweekNumber: number,
  startDate: Date
): Promise<void> {
  try {
    // Calculer les dates
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7) // 7 jours plus tard
    
    const deadline = new Date(startDate)
    deadline.setHours(deadline.getHours() - 2) // 2 heures avant le début
    
    const gameweek: Omit<GameweekInfo, 'startDate' | 'endDate' | 'deadline'> & {
      startDate: Timestamp
      endDate: Timestamp
      deadline: Timestamp
    } = {
      number: gameweekNumber,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      deadline: Timestamp.fromDate(deadline),
      isActive: true,
      isCompleted: false,
    }
    
    await addDoc(collection(db, 'fantasy_gameweeks'), gameweek)
    console.log(`✅ Gameweek ${gameweekNumber} créée`)
    console.log(`   📅 Début: ${startDate.toLocaleDateString('fr-FR')}`)
    console.log(`   📅 Fin: ${endDate.toLocaleDateString('fr-FR')}`)
    console.log(`   ⏰ Deadline: ${deadline.toLocaleString('fr-FR')}`)
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la gameweek ${gameweekNumber}:`, error)
    throw error
  }
}

/**
 * Fonction principale d'initialisation
 */
async function initFantasyData() {
  console.log('🎮 ========================================')
  console.log('🎮 Initialisation des données Fantasy')
  console.log('🎮 ========================================\n')
  
  try {
    // 1. Récupérer tous les joueurs
    const players = await getAllPlayers()
    
    if (players.length === 0) {
      console.log('⚠️  Aucun joueur trouvé dans la base de données')
      console.log('   Veuillez d\'abord créer des joueurs avant d\'initialiser le Fantasy')
      return
    }
    
    // 2. Créer les stats Fantasy pour chaque joueur
    console.log('\n💰 Calcul des prix et création des stats Fantasy...')
    let createdCount = 0
    let skippedCount = 0
    
    for (const player of players) {
      // Vérifier si les stats existent déjà
      const exists = await playerFantasyStatsExist(player.id)
      
      if (exists) {
        console.log(`   ⏭️  ${player.name} - Stats déjà existantes`)
        skippedCount++
        continue
      }
      
      // Calculer le prix initial
      const price = calculateInitialPrice(player)
      
      // Créer les stats Fantasy
      await createPlayerFantasyStats(player, price)
      createdCount++
    }
    
    console.log(`\n📊 Résumé des stats Fantasy:`)
    console.log(`   ✅ Créées: ${createdCount}`)
    console.log(`   ⏭️  Ignorées (déjà existantes): ${skippedCount}`)
    console.log(`   📈 Total: ${players.length}`)
    
    // 3. Créer la première gameweek
    console.log('\n📅 Création de la première gameweek...')
    
    const gameweekNumber = 1
    const gameweekExists_ = await gameweekExists(gameweekNumber)
    
    if (gameweekExists_) {
      console.log(`⏭️  Gameweek ${gameweekNumber} existe déjà`)
    } else {
      // Utiliser la date actuelle comme début de la première gameweek
      const startDate = new Date()
      await createGameweek(gameweekNumber, startDate)
    }
    
    // 4. Résumé final
    console.log('\n🎉 ========================================')
    console.log('🎉 Initialisation terminée avec succès!')
    console.log('🎉 ========================================')
    console.log('\n📋 Prochaines étapes:')
    console.log('   1. Les utilisateurs peuvent maintenant créer leurs équipes Fantasy')
    console.log('   2. Après chaque match, exécutez le script de mise à jour des points')
    console.log('   3. Chaque semaine, exécutez le script de nouvelle gameweek')
    console.log('')
    
  } catch (error) {
    console.error('\n❌ ========================================')
    console.error('❌ Erreur lors de l\'initialisation')
    console.error('❌ ========================================')
    console.error(error)
    process.exit(1)
  }
}

// Exécuter le script
initFantasyData()
  .then(() => {
    console.log('✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
