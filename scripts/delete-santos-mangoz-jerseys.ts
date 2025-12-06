// Script pour supprimer les photos de maillot de Santos et Mangoz
// Usage: npx tsx scripts/delete-santos-mangoz-jerseys.ts

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

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
const storage = getStorage()
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

async function deleteJerseys() {
  console.log('🗑️  Suppression des photos de maillot de Santos et Mangoz...\n')

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

  const bucket = storage.bucket(bucketName)

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

  // Chemins des fichiers
  const santosFileName = `team-jerseys/${santosNormalized}-${santos.id}.jpg`
  const mangozFileName = `team-jerseys/${mangozNormalized}-${mangoz.id}.jpg`

  try {
    // Supprimer le fichier Santos
    console.log(`🗑️  Suppression de: ${santosFileName}`)
    const santosFile = bucket.file(santosFileName)
    const [santosExists] = await santosFile.exists()
    
    if (santosExists) {
      await santosFile.delete()
      console.log(`✅ Fichier Santos supprimé`)
    } else {
      console.log(`⚠️  Fichier Santos n'existe pas`)
    }

    // Supprimer le fichier Mangoz
    console.log(`🗑️  Suppression de: ${mangozFileName}`)
    const mangozFile = bucket.file(mangozFileName)
    const [mangozExists] = await mangozFile.exists()
    
    if (mangozExists) {
      await mangozFile.delete()
      console.log(`✅ Fichier Mangoz supprimé`)
    } else {
      console.log(`⚠️  Fichier Mangoz n'existe pas`)
    }

    // Optionnel: Supprimer aussi les produits dans Firestore
    console.log('\n📦 Suppression des produits dans Firestore...')
    
    const santosProducts = await db.collection('shopProducts')
      .where('teamId', '==', santos.id)
      .where('type', '==', 'jersey')
      .get()

    if (!santosProducts.empty) {
      for (const doc of santosProducts.docs) {
        await doc.ref.delete()
        console.log(`✅ Produit Santos supprimé: ${doc.id}`)
      }
    } else {
      console.log(`⚠️  Aucun produit Santos trouvé`)
    }

    const mangozProducts = await db.collection('shopProducts')
      .where('teamId', '==', mangoz.id)
      .where('type', '==', 'jersey')
      .get()

    if (!mangozProducts.empty) {
      for (const doc of mangozProducts.docs) {
        await doc.ref.delete()
        console.log(`✅ Produit Mangoz supprimé: ${doc.id}`)
      }
    } else {
      console.log(`⚠️  Aucun produit Mangoz trouvé`)
    }

    console.log('\n✅ Suppression terminée avec succès!')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    throw error
  }
}

// Point d'entrée
deleteJerseys()
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
