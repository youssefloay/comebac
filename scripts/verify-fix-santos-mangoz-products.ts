// Script pour vérifier et corriger les produits Santos et Mangoz dans Firestore
// Usage: npx tsx scripts/verify-fix-santos-mangoz-products.ts

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
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'scolar-league.firebasestorage.app'

async function findTeamByName(teamName: string): Promise<{ id: string; name: string } | null> {
  const normalizedName = teamName.trim().toLowerCase()

  const teamsSnapshot = await db.collection('teams')
    .where('isActive', '==', true)
    .get()

  for (const doc of teamsSnapshot.docs) {
    const data = doc.data()
    const teamNameLower = (data.name || '').trim().toLowerCase()

    if (teamNameLower === normalizedName) {
      return { id: doc.id, name: data.name }
    }
  }

  // Essayer avec des variations
  const variations: Record<string, string[]> = {
    'santos': ['santos fc', 'santos'],
    'mangoz': ['mangoz fc', 'mangoz']
  }

  const keywords = variations[normalizedName] || [normalizedName]
  for (const doc of teamsSnapshot.docs) {
    const data = doc.data()
    const teamNameLower = (data.name || '').trim().toLowerCase()

    for (const keyword of keywords) {
      if (teamNameLower.includes(keyword) || keyword.includes(teamNameLower)) {
        return { id: doc.id, name: data.name }
      }
    }
  }

  return null
}

async function verifyAndFix() {
  console.log('🔍 Vérification et correction des produits Santos et Mangoz...\n')

  const santos = await findTeamByName('Santos')
  const mangoz = await findTeamByName('Mangoz')

  if (!santos) {
    console.error('❌ Équipe Santos non trouvée')
    return
  }

  if (!mangoz) {
    console.error('❌ Équipe Mangoz non trouvée')
    return
  }

  console.log(`✅ Santos trouvé: ${santos.name} (${santos.id})`)
  console.log(`✅ Mangoz trouvé: ${mangoz.name} (${mangoz.id})\n`)

  // Normaliser les noms pour les chemins de fichiers
  const santosNormalized = santos.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const mangozNormalized = mangoz.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // URLs correctes
  const santosUrl = `https://storage.googleapis.com/${bucketName}/team-jerseys/${santosNormalized}-${santos.id}.jpg`
  const mangozUrl = `https://storage.googleapis.com/${bucketName}/team-jerseys/${mangozNormalized}-${mangoz.id}.jpg`

  console.log(`📄 URL Santos attendue: ${santosUrl}`)
  console.log(`📄 URL Mangoz attendue: ${mangozUrl}\n`)

  // Récupérer les produits
  const santosProducts = await db.collection('shopProducts')
    .where('teamId', '==', santos.id)
    .where('type', '==', 'jersey')
    .get()

  const mangozProducts = await db.collection('shopProducts')
    .where('teamId', '==', mangoz.id)
    .where('type', '==', 'jersey')
    .get()

  // Vérifier et corriger Santos
  if (!santosProducts.empty) {
    const product = santosProducts.docs[0]
    const data = product.data()
    const currentUrl = Array.isArray(data.images) ? data.images[0] : data.images

    console.log(`📦 Produit Santos (${product.id}):`)
    console.log(`   URL actuelle: ${currentUrl}`)
    console.log(`   URL attendue: ${santosUrl}`)

    if (currentUrl !== santosUrl) {
      console.log(`   ⚠️  URL incorrecte, correction...`)
      await product.ref.update({
        images: [santosUrl],
        updatedAt: new Date()
      })
      console.log(`   ✅ Produit Santos corrigé`)
    } else {
      console.log(`   ✅ URL correcte`)
    }
  } else {
    console.log(`⚠️  Aucun produit trouvé pour Santos`)
  }

  console.log('')

  // Vérifier et corriger Mangoz
  if (!mangozProducts.empty) {
    const product = mangozProducts.docs[0]
    const data = product.data()
    const currentUrl = Array.isArray(data.images) ? data.images[0] : data.images

    console.log(`📦 Produit Mangoz (${product.id}):`)
    console.log(`   URL actuelle: ${currentUrl}`)
    console.log(`   URL attendue: ${mangozUrl}`)

    if (currentUrl !== mangozUrl) {
      console.log(`   ⚠️  URL incorrecte, correction...`)
      await product.ref.update({
        images: [mangozUrl],
        updatedAt: new Date()
      })
      console.log(`   ✅ Produit Mangoz corrigé`)
    } else {
      console.log(`   ✅ URL correcte`)
    }
  } else {
    console.log(`⚠️  Aucun produit trouvé pour Mangoz`)
  }

  console.log('\n✅ Vérification terminée!')
}

// Point d'entrée
verifyAndFix()
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
