// Script pour uploader le fichier Santos FC.jpg vers santos-5AKP3hWyaz9iPXxb3Bxy.jpg
// Usage: npx tsx scripts/upload-santos-correct-file.ts

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

  const variations: Record<string, string[]> = {
    'santos': ['santos fc', 'santos']
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
    console.log(`⚠️  Impossible de supprimer l'ancien fichier`)
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

async function uploadSantos() {
  console.log('📤 Upload du fichier Santos FC.jpg vers santos-5AKP3hWyaz9iPXxb3Bxy.jpg...\n')

  const assetsDir = resolve(process.cwd(), 'assets')
  const santosLocalFile = path.join(assetsDir, 'Santos FC.jpg')

  if (!fs.existsSync(santosLocalFile)) {
    console.error(`❌ Fichier non trouvé: ${santosLocalFile}`)
    return
  }

  const santos = await findTeamByName('Santos')

  if (!santos) {
    console.error('❌ Équipe Santos non trouvée')
    return
  }

  console.log(`✅ Santos trouvé: ${santos.name} (${santos.id})`)
  console.log(`📄 Fichier local: Santos FC.jpg`)
  console.log(`📄 Fichier Storage cible: santos-${santos.id}.jpg\n`)

  try {
    // Uploader l'image
    console.log('📤 Upload de l\'image...')
    const santosUrl = await uploadJerseyImage(santos.id, santos.name, santosLocalFile)
    console.log(`✅ Image uploadée: ${santosUrl}`)

    // Mettre à jour le produit
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
    } else {
      console.log(`⚠️  Aucun produit trouvé pour Santos`)
    }

    console.log('\n✅ Terminé avec succès!')
    console.log(`📄 Le fichier santos-${santos.id}.jpg contient maintenant l'image de Santos FC.jpg`)

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    throw error
  }
}

// Point d'entrée
uploadSantos()
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
