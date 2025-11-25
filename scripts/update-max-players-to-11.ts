/**
 * Script pour mettre à jour maxPlayers à 11 pour les équipes avec moins de 11 joueurs
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

const adminDb = getFirestore()

async function updateMaxPlayers() {
  console.log('🔄 Mise à jour de maxPlayers à 11 pour les équipes avec moins de 11 joueurs')
  console.log('='.repeat(60))
  console.log()

  try {
    let updated = 0
    let skipped = 0

    // Récupérer toutes les inscriptions d'équipes
    const registrationsSnap = await adminDb.collection('teamRegistrations').get()

    console.log(`📋 ${registrationsSnap.size} inscription(s) trouvée(s)`)
    console.log()

    for (const regDoc of registrationsSnap.docs) {
      const regData = regDoc.data()
      const playerCount = regData.players?.length || 0
      const currentMax = regData.maxPlayers || 10

      // Ignorer les équipes avec 11 joueurs ou plus
      if (playerCount >= 11) {
        console.log(`⏭️  ${regData.teamName}: ${playerCount} joueurs (≥ 11) - Ignoré`)
        skipped++
        continue
      }

      // Ignorer si déjà à 11
      if (currentMax === 11) {
        console.log(`✅ ${regData.teamName}: Déjà à 11 joueurs max`)
        skipped++
        continue
      }

      // Mettre à jour
      await regDoc.ref.update({
        maxPlayers: 11,
        updatedAt: new Date()
      })

      console.log(`✅ ${regData.teamName}: ${playerCount} joueurs, maxPlayers ${currentMax} → 11`)
      updated++
    }

    console.log()
    console.log('='.repeat(60))
    console.log('📊 RÉSUMÉ:')
    console.log(`   ✅ ${updated} équipe(s) mise(s) à jour`)
    console.log(`   ⏭️  ${skipped} équipe(s) ignorée(s)`)
    console.log()
    console.log('✅ Mise à jour terminée !')

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

updateMaxPlayers().catch(console.error)

