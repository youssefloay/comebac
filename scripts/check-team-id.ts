// Script pour vérifier quelle équipe correspond à un ID
// Usage: npx tsx scripts/check-team-id.ts

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

async function checkTeam() {
  const teamId = '5AKP3hWyaz9iPXxb3Bxy'
  
  console.log(`🔍 Recherche de l'équipe avec l'ID: ${teamId}\n`)

  try {
    const teamDoc = await db.collection('teams').doc(teamId).get()
    
    if (teamDoc.exists) {
      const data = teamDoc.data()
      console.log(`✅ Équipe trouvée:`)
      console.log(`   Nom: ${data?.name}`)
      console.log(`   ID: ${teamId}`)
      console.log(`   Active: ${data?.isActive}`)
      
      // Vérifier aussi les produits
      const products = await db.collection('shopProducts')
        .where('teamId', '==', teamId)
        .where('type', '==', 'jersey')
        .get()
      
      if (!products.empty) {
        const product = products.docs[0].data()
        console.log(`\n📦 Produit maillot:`)
        console.log(`   Nom: ${product.name}`)
        console.log(`   Images: ${JSON.stringify(product.images)}`)
      }
    } else {
      console.log(`❌ Aucune équipe trouvée avec cet ID`)
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
  }
}

// Point d'entrée
checkTeam()
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
