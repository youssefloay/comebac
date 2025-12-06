// Script pour corriger les noms de fichiers inversés entre Santos et Mangoz sur Storage
// Usage: npx tsx scripts/fix-santos-mangoz-storage-names.ts

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import * as fs from 'fs'

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

async function swapStorageFiles() {
  console.log('🔄 Correction des noms de fichiers inversés entre Santos et Mangoz...\n')

  const bucket = storage.bucket(bucketName)

  // Trouver les équipes
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

  // Chercher les fichiers actuels
  const [santosFiles] = await bucket.getFiles({ prefix: `team-jerseys/${santosNormalized}-${santos.id}` })
  const [mangozFiles] = await bucket.getFiles({ prefix: `team-jerseys/${mangozNormalized}-${mangoz.id}` })

  console.log(`📁 Fichiers Santos trouvés: ${santosFiles.length}`)
  console.log(`📁 Fichiers Mangoz trouvés: ${mangozFiles.length}\n`)

  if (santosFiles.length === 0 || mangozFiles.length === 0) {
    console.error('❌ Fichiers non trouvés sur Storage')
    return
  }

  const santosFile = santosFiles[0]
  const mangozFile = mangozFiles[0]

  console.log(`📄 Fichier Santos actuel: ${santosFile.name}`)
  console.log(`📄 Fichier Mangoz actuel: ${mangozFile.name}\n`)

  // Créer des noms temporaires pour l'échange
  const santosTempName = `team-jerseys/temp-santos-${Date.now()}.jpg`
  const mangozTempName = `team-jerseys/temp-mangoz-${Date.now()}.jpg`

  try {
    // Étape 1: Copier Santos vers temp
    console.log('📋 Étape 1: Copie de Santos vers temp...')
    await santosFile.copy(bucket.file(santosTempName))
    console.log('✅ Santos copié vers temp')

    // Étape 2: Copier Mangoz vers temp
    console.log('📋 Étape 2: Copie de Mangoz vers temp...')
    await mangozFile.copy(bucket.file(mangozTempName))
    console.log('✅ Mangoz copié vers temp')

    // Étape 3: Supprimer les fichiers originaux
    console.log('📋 Étape 3: Suppression des fichiers originaux...')
    await santosFile.delete()
    await mangozFile.delete()
    console.log('✅ Fichiers originaux supprimés')

    // Étape 4: Renommer temp-santos vers mangoz (car les fichiers sont inversés)
    console.log('📋 Étape 4: Renommage temp-santos vers Mangoz...')
    const tempSantosFile = bucket.file(santosTempName)
    await tempSantosFile.copy(bucket.file(`team-jerseys/${mangozNormalized}-${mangoz.id}.jpg`))
    await tempSantosFile.delete()
    console.log('✅ Fichier renommé vers Mangoz')

    // Étape 5: Renommer temp-mangoz vers santos
    console.log('📋 Étape 5: Renommage temp-mangoz vers Santos...')
    const tempMangozFile = bucket.file(mangozTempName)
    await tempMangozFile.copy(bucket.file(`team-jerseys/${santosNormalized}-${santos.id}.jpg`))
    await tempMangozFile.delete()
    console.log('✅ Fichier renommé vers Santos')

    // Étape 6: Rendre les fichiers publics
    console.log('📋 Étape 6: Rendre les fichiers publics...')
    const newSantosFile = bucket.file(`team-jerseys/${santosNormalized}-${santos.id}.jpg`)
    const newMangozFile = bucket.file(`team-jerseys/${mangozNormalized}-${mangoz.id}.jpg`)
    
    await newSantosFile.makePublic()
    await newMangozFile.makePublic()
    console.log('✅ Fichiers rendus publics')

    // Étape 7: Mettre à jour les produits dans Firestore
    console.log('📋 Étape 7: Mise à jour des produits dans Firestore...')
    
    const santosUrl = `https://storage.googleapis.com/${bucket.name}/team-jerseys/${santosNormalized}-${santos.id}.jpg`
    const mangozUrl = `https://storage.googleapis.com/${bucket.name}/team-jerseys/${mangozNormalized}-${mangoz.id}.jpg`

    // Mettre à jour le produit Santos
    const santosProducts = await db.collection('shopProducts')
      .where('teamId', '==', santos.id)
      .where('type', '==', 'jersey')
      .get()

    if (!santosProducts.empty) {
      await santosProducts.docs[0].ref.update({
        images: [santosUrl],
        updatedAt: new Date()
      })
      console.log(`✅ Produit Santos mis à jour: ${santosProducts.docs[0].id}`)
    }

    // Mettre à jour le produit Mangoz
    const mangozProducts = await db.collection('shopProducts')
      .where('teamId', '==', mangoz.id)
      .where('type', '==', 'jersey')
      .get()

    if (!mangozProducts.empty) {
      await mangozProducts.docs[0].ref.update({
        images: [mangozUrl],
        updatedAt: new Date()
      })
      console.log(`✅ Produit Mangoz mis à jour: ${mangozProducts.docs[0].id}`)
    }

    console.log('\n✅ Correction terminée avec succès!')
    console.log(`📄 Nouveau fichier Santos: team-jerseys/${santosNormalized}-${santos.id}.jpg`)
    console.log(`📄 Nouveau fichier Mangoz: team-jerseys/${mangozNormalized}-${mangoz.id}.jpg`)

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'échange:', error)
    throw error
  }
}

// Point d'entrée
swapStorageFiles()
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
