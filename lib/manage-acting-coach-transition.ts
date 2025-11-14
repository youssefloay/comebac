/**
 * Fonction pour gérer la transition quand un coach est ajouté à une équipe
 * Le capitaine perd automatiquement son statut de coach intérimaire
 */

import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function removeActingCoachStatus(teamId: string): Promise<void> {
  try {
    // Trouver tous les joueurs de l'équipe qui sont coach intérimaire
    const playerAccountsQuery = query(
      collection(db, 'playerAccounts'),
      where('teamId', '==', teamId),
      where('isActingCoach', '==', true)
    )
    
    const playerAccountsSnap = await getDocs(playerAccountsQuery)
    
    // Retirer le statut de coach intérimaire
    const updatePromises = playerAccountsSnap.docs.map(doc => 
      updateDoc(doc.ref, {
        isActingCoach: false,
        actingCoachUntil: new Date()
      })
    )
    
    await Promise.all(updatePromises)
    
    console.log(`✅ Statut de coach intérimaire retiré pour ${playerAccountsSnap.size} joueur(s)`)
  } catch (error) {
    console.error('Erreur lors du retrait du statut de coach intérimaire:', error)
    throw error
  }
}

export async function setActingCoachStatus(teamId: string, playerEmail: string): Promise<void> {
  try {
    // Trouver le compte joueur
    const playerAccountsQuery = query(
      collection(db, 'playerAccounts'),
      where('teamId', '==', teamId),
      where('email', '==', playerEmail)
    )
    
    const playerAccountsSnap = await getDocs(playerAccountsQuery)
    
    if (playerAccountsSnap.empty) {
      throw new Error('Joueur non trouvé')
    }
    
    // Activer le statut de coach intérimaire
    await updateDoc(playerAccountsSnap.docs[0].ref, {
      isActingCoach: true,
      actingCoachSince: new Date()
    })
    
    console.log(`✅ Statut de coach intérimaire activé pour ${playerEmail}`)
  } catch (error) {
    console.error('Erreur lors de l\'activation du statut de coach intérimaire:', error)
    throw error
  }
}
