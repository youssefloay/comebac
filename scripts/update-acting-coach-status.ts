#!/usr/bin/env node

/**
 * Script pour mettre à jour le statut de coach intérimaire
 * Les capitaines sans coach deviennent automatiquement coach intérimaire
 * 
 * Usage:
 *   npm run update-acting-coach-status
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialiser Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }

  initializeApp({
    credential: cert(serviceAccount)
  })
}

const db = getFirestore()

async function main() {
  console.log('🔄 Mise à jour du statut de coach intérimaire')
  console.log('=' .repeat(60))
  console.log()

  try {
    // 1. Récupérer toutes les équipes
    const teamsSnap = await db.collection('teams').get()
    
    console.log(`📋 ${teamsSnap.size} équipe(s) trouvée(s)`)
    console.log()

    let updatedCount = 0
    let skippedCount = 0

    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      const teamId = teamDoc.id
      const teamName = teamData.name

      console.log(`\n🔍 Vérification: ${teamName}`)

      // 2. Vérifier si l'équipe a un coach
      const coachSnap = await db.collection('coachAccounts')
        .where('teamId', '==', teamId)
        .get()

      const hasCoach = !coachSnap.empty

      if (hasCoach) {
        console.log(`  ✅ A un coach - Pas de changement nécessaire`)
        skippedCount++
        continue
      }

      // 3. Trouver le capitaine
      const captainSnap = await db.collection('players')
        .where('teamId', '==', teamId)
        .where('isCaptain', '==', true)
        .get()

      if (captainSnap.empty) {
        console.log(`  ⚠️  Pas de capitaine trouvé`)
        skippedCount++
        continue
      }

      const captainData = captainSnap.docs[0].data()
      const captainEmail = captainData.email

      console.log(`  👤 Capitaine: ${captainData.name} (${captainEmail})`)

      // 4. Mettre à jour le playerAccount du capitaine
      const playerAccountSnap = await db.collection('playerAccounts')
        .where('email', '==', captainEmail)
        .where('teamId', '==', teamId)
        .get()

      if (playerAccountSnap.empty) {
        console.log(`  ⚠️  Compte joueur non trouvé`)
        skippedCount++
        continue
      }

      const playerAccountDoc = playerAccountSnap.docs[0]
      await playerAccountDoc.ref.update({
        isActingCoach: true,
        actingCoachSince: new Date()
      })

      console.log(`  ✅ Statut de coach intérimaire activé`)
      updatedCount++
    }

    console.log()
    console.log('=' .repeat(60))
    console.log('📊 Résumé:')
    console.log(`✅ Capitaines mis à jour: ${updatedCount}`)
    console.log(`⏭️  Équipes ignorées: ${skippedCount}`)
    console.log()
    console.log('💡 Les capitaines sans coach ont maintenant accès aux fonctions de coach')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
