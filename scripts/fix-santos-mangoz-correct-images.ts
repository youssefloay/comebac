// Script pour corriger les images inversées entre Santos et Mangoz
// Le fichier santos-xxx.jpg contient l'image Mangoz et vice versa
// On va ré-uploader les bonnes images depuis les fichiers locaux
// Usage: npx tsx scripts/fix-santos-mangoz-correct-images.ts

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import * as fs from 'fs'
import * as path from 'path'

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

async function uploadJerseyImage(teamId: string, teamName: string, imagePath: string): Promise<string> {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`File not found: ${imagePath}`)
  }

  const stats = fs.statSync(imagePath)
  if (stats.size === 0) {
    throw new Error(`File is empty: ${imagePath}`)
  }

  console.log(`📁 File size: ${stats.size} bytes`)

  const normalizedTeamName = teamName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const bucket = storage.bucket(bucketName)
  const fileExt = imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg') ? 'jpg' : 'png'
  const fileName = `team-jerseys/${normalizedTeamName}-${teamId}.${fileExt}`
  const file = bucket.file(fileName)

  // Supprimer l'ancien fichier s'il existe
  try {
    const [exists] = await file.exists()
    if (exists) {
      console.log(`🗑️  Suppression de l'ancien fichier: ${fileName}`)
      await file.delete()
    }
  } catch (error) {
    console.log(`⚠️  Impossible de supprimer l'ancien fichier (peut-être n'existe pas)`)
  }

  const fileBuffer = fs.readFileSync(imagePath)

  const stream = file.createWriteStream({
    metadata: {
      contentType: imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/png',
      cacheControl: 'public, max-age=31536000',
    },
    resumable: false,
  })

  return new Promise((resolve, reject) => {
    stream.on('error', (error) => {
      console.error(`❌ Upload error:`, error)
      reject(error)
    })

    stream.on('finish', async () => {
      try {
        await file.makePublic()
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
        console.log(`✅ Public URL: ${publicUrl}`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        resolve(publicUrl)
      } catch (error) {
        console.error(`❌ Error making file public:`, error)
        reject(error)
      }
    })

    stream.end(fileBuffer)
  })
}

async function fixImages() {
  console.log('🔧 Correction des images Santos et Mangoz avec les bons fichiers...\n')

  // Mapping correct : nom d'équipe -> équipe
  const teamMapping: Record<string, string> = {
    'Mangoz FC': 'Mangoz FC',
    'Santos FC': 'Santos FC'
  }

  const assetsDir = resolve(process.cwd(), 'assets')
  const results = {
    success: [] as string[],
    errors: [] as string[]
  }

  for (const teamName of Object.values(teamMapping)) {
    // Chercher le fichier par nom d'équipe (nouveaux noms)
    const files = fs.readdirSync(assetsDir)
    const normalizedTeamName = teamName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' ').trim()
    const imageFile = files.find(f => {
      const fileName = f.replace(/\.(png|jpg|jpeg)$/, '')
      return fileName === normalizedTeamName && (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
    })

    if (!imageFile) {
      console.log(`⚠️  Fichier non trouvé pour: ${teamName} (cherché: ${normalizedTeamName})`)
      continue
    }

    const imagePath = path.join(assetsDir, imageFile)
    console.log(`\n🔍 Traitement: ${imageFile} -> ${teamName}`)

    try {
      const team = await findTeamByName(teamName)

      if (!team) {
        console.log(`❌ Équipe non trouvée: ${teamName}`)
        continue
      }

      console.log(`✅ Équipe trouvée: ${team.name} (${team.id})`)

      // Upload de l'image (écrase l'ancienne)
      console.log(`📤 Upload de l'image...`)
      const jerseyImageUrl = await uploadJerseyImage(team.id, team.name, imagePath)
      console.log(`✅ Image uploadée: ${jerseyImageUrl}`)

      // Mettre à jour le produit existant
      const existingProducts = await db.collection('shopProducts')
        .where('teamId', '==', team.id)
        .where('type', '==', 'jersey')
        .get()

      if (!existingProducts.empty) {
        const existingProduct = existingProducts.docs[0]
        await db.collection('shopProducts').doc(existingProduct.id).update({
          images: [jerseyImageUrl],
          updatedAt: new Date()
        })
        console.log(`✅ Produit mis à jour: ${existingProduct.id}`)
        results.success.push(team.name)
      } else {
        console.log(`⚠️  Aucun produit trouvé pour ${team.name}`)
      }

    } catch (error: any) {
      console.error(`❌ Erreur pour ${teamName}:`, error.message)
      results.errors.push(`${teamName}: ${error.message}`)
    }
  }

  console.log('\n\n📊 RÉSUMÉ:')
  console.log(`✅ Succès: ${results.success.length}`)
  console.log(`⚠️  Erreurs: ${results.errors.length}`)

  if (results.success.length > 0) {
    console.log('\n✅ Équipes corrigées:')
    results.success.forEach(name => console.log(`  - ${name}`))
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Erreurs:')
    results.errors.forEach(error => console.log(`  - ${error}`))
  }
}

// Point d'entrée
fixImages()
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
