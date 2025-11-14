import { collection, getDocs, doc, updateDoc, Timestamp, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Player } from '../types'
import type { Position, PlayerFantasyStats } from '../types/fantasy'

/**
 * Calcule le prix initial d'un joueur basé sur sa position et ses statistiques
 * 
 * @param player - Le joueur pour lequel calculer le prix
 * @returns Le prix en millions d'euros (entre 4.0 et 15.0)
 */
export function calculateInitialPrice(player: Player): number {
  // Prix de base selon la position
  const basePrice: Record<Position, number> = {
    'Gardien': 4.5,
    'Défenseur': 5.0,
    'Milieu': 6.0,
    'Attaquant': 7.0
  }
  
  let price = basePrice[player.position as Position] || 5.0
  
  // Ajustements basés sur les statistiques de saison
  if (player.seasonStats) {
    // Bonus pour les buts (plus important pour les attaquants)
    const goalBonus = player.position === 'Attaquant' ? 0.5 : 
                      player.position === 'Milieu' ? 0.4 : 
                      player.position === 'Défenseur' ? 0.6 : 0.8
    price += (player.seasonStats.goals || 0) * goalBonus
    
    // Bonus pour les passes décisives
    price += (player.seasonStats.assists || 0) * 0.3
    
    // Bonus pour les matchs joués (expérience)
    const matchBonus = Math.min((player.seasonStats.matches || 0) * 0.1, 2.0)
    price += matchBonus
    
    // Pénalité pour les cartons rouges
    price -= (player.seasonStats.redCards || 0) * 0.5
  }
  
  // Bonus pour le capitaine
  if (player.isCaptain) {
    price += 1.0
  }
  
  // Bonus basé sur la note générale (si disponible)
  if (player.overall) {
    const overallBonus = (player.overall - 70) * 0.1
    price += Math.max(0, overallBonus)
  }
  
  // Limiter le prix entre 4.0M€ et 15.0M€
  return Math.min(Math.max(price, 4.0), 15.0)
}

/**
 * Récupère tous les joueurs de la base de données
 * 
 * @returns Liste de tous les joueurs
 */
async function getAllPlayers(): Promise<Player[]> {
  try {
    const playersSnapshot = await getDocs(collection(db, 'players'))
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
 * 
 * @param playerId - ID du joueur
 * @returns Les statistiques Fantasy du joueur ou null si non trouvées
 */
async function getPlayerFantasyStats(playerId: string): Promise<PlayerFantasyStats | null> {
  try {
    const q = query(
      collection(db, 'player_fantasy_stats'),
      where('playerId', '==', playerId)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const doc = querySnapshot.docs[0]
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
 * 
 * @param playerId - ID du joueur
 * @param stats - Statistiques à mettre à jour
 */
async function updatePlayerFantasyStats(
  playerId: string,
  stats: Partial<PlayerFantasyStats>
): Promise<void> {
  try {
    const q = query(
      collection(db, 'player_fantasy_stats'),
      where('playerId', '==', playerId)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.warn(`No fantasy stats found for player ${playerId}`)
      return
    }
    
    const docRef = querySnapshot.docs[0].ref
    await updateDoc(docRef, {
      ...stats,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error(`Error updating fantasy stats for player ${playerId}:`, error)
    throw error
  }
}

/**
 * Met à jour les prix de tous les joueurs basés sur leur forme récente
 * 
 * Cette fonction doit être exécutée hebdomadairement (typiquement au début d'une nouvelle gameweek)
 * pour ajuster les prix des joueurs en fonction de leurs performances.
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
 * @returns Nombre de joueurs dont le prix a été mis à jour
 */
export async function updatePlayerPrices(): Promise<number> {
  try {
    console.log('🔄 Mise à jour des prix des joueurs...')
    
    const players = await getAllPlayers()
    let updatedCount = 0
    
    for (const player of players) {
      const stats = await getPlayerFantasyStats(player.id)
      
      if (!stats) {
        console.warn(`Pas de stats Fantasy pour le joueur ${player.name} (${player.id})`)
        continue
      }
      
      // Calculer la forme récente (moyenne des 5 derniers matchs)
      const recentForm = stats.form.slice(-5)
      
      if (recentForm.length === 0) {
        console.log(`Pas de forme récente pour ${player.name}, prix inchangé`)
        continue
      }
      
      const avgPoints = recentForm.reduce((sum, points) => sum + points, 0) / recentForm.length
      
      let priceChange = 0
      
      // Déterminer le changement de prix basé sur la forme
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
      // Entre 3 et 4: pas de changement
      
      // Limiter la variation à ±0.5M€ par gameweek
      priceChange = Math.max(-0.5, Math.min(0.5, priceChange))
      
      // Arrondir à 0.1M€ près
      priceChange = Math.round(priceChange * 10) / 10
      
      if (priceChange !== 0) {
        const newPrice = Math.max(4.0, Math.min(15.0, stats.price + priceChange))
        
        await updatePlayerFantasyStats(player.id, {
          price: newPrice,
          priceChange: priceChange,
        })
        
        console.log(
          `✅ ${player.name}: ${stats.price.toFixed(1)}M€ → ${newPrice.toFixed(1)}M€ ` +
          `(forme: ${avgPoints.toFixed(1)} pts/match)`
        )
        
        updatedCount++
      } else {
        console.log(`➖ ${player.name}: prix stable à ${stats.price.toFixed(1)}M€`)
      }
    }
    
    console.log(`✅ Mise à jour terminée: ${updatedCount}/${players.length} joueurs modifiés`)
    return updatedCount
  } catch (error) {
    console.error('Erreur lors de la mise à jour des prix:', error)
    throw error
  }
}

/**
 * Calcule le changement de prix recommandé pour un joueur basé sur sa forme
 * 
 * @param form - Tableau des points des derniers matchs
 * @returns Le changement de prix recommandé (entre -0.5 et +0.5)
 */
export function calculatePriceChange(form: number[]): number {
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
 * Obtient le prix actuel d'un joueur depuis ses stats Fantasy
 * 
 * @param playerId - ID du joueur
 * @returns Le prix actuel ou null si non trouvé
 */
export async function getPlayerPrice(playerId: string): Promise<number | null> {
  const stats = await getPlayerFantasyStats(playerId)
  return stats ? stats.price : null
}

/**
 * Vérifie si un joueur a eu une augmentation ou diminution de prix récente
 * 
 * @param playerId - ID du joueur
 * @returns Object avec le changement de prix et la direction
 */
export async function getPlayerPriceChange(playerId: string): Promise<{
  change: number
  direction: 'up' | 'down' | 'stable'
} | null> {
  const stats = await getPlayerFantasyStats(playerId)
  
  if (!stats) {
    return null
  }
  
  const change = stats.priceChange || 0
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  
  return { change, direction }
}
