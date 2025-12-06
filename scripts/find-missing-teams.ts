// Script pour trouver les noms exacts des équipes manquantes
// Usage: npx tsx scripts/find-missing-teams.ts

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'scolar-league.firebasestorage.app'
  })
}

const db = getFirestore()

async function findMissingTeams() {
  console.log('🔍 Recherche des équipes manquantes...\n')

  const searchTerms = ['matador', 'icons', 'selecao', 'tiki']

  const teamsSnapshot = await db.collection('teams')
    .where('isActive', '==', true)
    .get()

  console.log('📋 Toutes les équipes actives:\n')
  teamsSnapshot.docs.forEach(doc => {
    const data = doc.data()
    console.log(`  - ${data.name} (${doc.id})`)
  })

  console.log('\n🔍 Recherche des équipes avec termes similaires:\n')
  
  for (const term of searchTerms) {
    console.log(`Recherche: "${term}"`)
    const matching = teamsSnapshot.docs.filter(doc => {
      const name = (doc.data().name || '').toLowerCase()
      return name.includes(term) || term.includes(name)
    })
    
    if (matching.length > 0) {
      matching.forEach(doc => {
        const data = doc.data()
        console.log(`  ✅ Trouvé: ${data.name} (${doc.id})`)
      })
    } else {
      console.log(`  ❌ Aucune équipe trouvée`)
    }
    console.log('')
  }
}

// Point d'entrée
findMissingTeams()
  .then(() => {
    console.log('✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
