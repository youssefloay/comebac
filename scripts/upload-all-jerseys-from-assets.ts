// Script pour uploader toutes les photos de maillots depuis assets vers Storage
// et créer/mettre à jour les produits dans Firestore
// Usage: npx tsx scripts/upload-all-jerseys-from-assets.ts

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

  // Essayer d'abord une correspondance exacte
  for (const doc of teamsSnapshot.docs) {
    const data = doc.data()
    const teamNameLower = (data.name || '').trim().toLowerCase()

    if (teamNameLower === normalizedName) {
      return { id: doc.id, name: data.name }
    }
  }

  // Ensuite, essayer une correspondance partielle (contient le nom)
  for (const doc of teamsSnapshot.docs) {
    const data = doc.data()
    const teamNameLower = (data.name || '').trim().toLowerCase()

    // Vérifier si le nom de l'équipe contient le nom recherché ou vice versa
    if (teamNameLower.includes(normalizedName) || normalizedName.includes(teamNameLower)) {
      return { id: doc.id, name: data.name }
    }
  }

  // Essayer avec des variations communes
  const variations: Record<string, string[]> = {
    'santos': ['santos fc', 'santos'],
    'mangoz': ['mangoz fc', 'mangoz'],
    'ego': ['ego fc', 'ego'],
    'ego fc': ['ego fc', 'ego'],
    'selecao': ['selecao fc', 'selecao'],
    'selecao fc': ['selecao fc', 'selecao'],
    'tiki taka': ['tiki taka', 'tiki'],
    'el matador': ['el matador', 'matador'],
    'icons': ['icons'],
    'the saints': ['saints', 'the saints'],
    'vii rising': ['rising vii', 'vii rising', 'rising'],
    'prime team': ['prime', 'prime team'],
    'road to glory': ['road to glory', 'rtg'],
    'les lions sacrs': ['lions sacres', 'lions sacrés', 'les lions sacrés', 'lions'],
    'les lions sacrés': ['lions sacres', 'lions sacrés', 'les lions sacrés', 'lions']
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

async function createJerseyProduct(teamId: string, teamName: string, jerseyImageUrl: string) {
  const productRef = db.collection('shopProducts').doc()

  const product = {
    id: productRef.id,
    type: 'jersey',
    name: `Maillot ${teamName}`,
    nameAr: `قميص ${teamName}`,
    description: `Maillot officiel de ${teamName} avec personnalisation nom et numéro`,
    descriptionAr: `قميص رسمي لـ ${teamName} مع التخصيص الاسم والرقم`,
    price: 950,
    customizable: true,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: [jerseyImageUrl],
    active: true,
    mockupTemplate: 'jersey',
    teamId: teamId,
    teamName: teamName,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  await productRef.set(product)
  console.log(`✅ Produit créé pour ${teamName} (${teamId})`)
  return productRef.id
}

async function updateExistingJerseyProduct(productId: string, jerseyImageUrl: string) {
  await db.collection('shopProducts').doc(productId).update({
    images: [jerseyImageUrl],
    updatedAt: new Date()
  })
  console.log(`✅ Produit mis à jour: ${productId}`)
}

async function processAllJerseys() {
  console.log('🛍️  Upload de tous les maillots depuis assets...\n')

  const assetsDir = resolve(process.cwd(), 'assets')

  if (!fs.existsSync(assetsDir)) {
    console.error(`❌ Le dossier assets n'existe pas`)
    process.exit(1)
  }

  // Lire tous les fichiers .jpg et .png (exclure les fichiers génériques)
  const files = fs.readdirSync(assetsDir)
  const jerseyFiles = files.filter(f => {
    const isJerseyFile = (f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')) &&
      !f.includes('generic') &&
      !f.includes('tshirt') &&
      !f.includes('sweatshirt') &&
      !f.startsWith('image-') // Exclure les fichiers image-xxx.png
    return isJerseyFile
  })

  console.log(`📁 ${jerseyFiles.length} fichiers de maillots trouvés\n`)

  const results = {
    success: [] as string[],
    notFound: [] as string[],
    errors: [] as string[]
  }

  for (const imageFile of jerseyFiles) {
    // Extraire le nom de l'équipe du nom du fichier (sans extension)
    const fileNameWithoutExt = path.basename(imageFile, path.extname(imageFile))
    const teamName = fileNameWithoutExt.trim()

    const imagePath = path.join(assetsDir, imageFile)
    console.log(`\n🔍 Traitement: ${imageFile} -> ${teamName}`)

    try {
      // Chercher l'équipe
      const team = await findTeamByName(teamName)

      if (!team) {
        console.log(`❌ Équipe non trouvée: ${teamName}`)
        results.notFound.push(`${teamName} (${imageFile})`)
        continue
      }

      console.log(`✅ Équipe trouvée: ${team.name} (${team.id})`)

      // Upload de l'image
      console.log(`📤 Upload de l'image...`)
      const jerseyImageUrl = await uploadJerseyImage(team.id, team.name, imagePath)
      console.log(`✅ Image uploadée: ${jerseyImageUrl}`)

      // Vérifier si un produit existe déjà pour cette équipe
      const existingProducts = await db.collection('shopProducts')
        .where('teamId', '==', team.id)
        .where('type', '==', 'jersey')
        .get()

      if (!existingProducts.empty) {
        // Mettre à jour le produit existant
        const existingProduct = existingProducts.docs[0]
        await updateExistingJerseyProduct(existingProduct.id, jerseyImageUrl)
        console.log(`✅ Produit existant mis à jour`)
        results.success.push(`${team.name} (mis à jour)`)
      } else {
        // Créer un nouveau produit
        await createJerseyProduct(team.id, team.name, jerseyImageUrl)
        results.success.push(team.name)
      }

    } catch (error: any) {
      console.error(`❌ Erreur pour ${teamName}:`, error.message)
      results.errors.push(`${teamName}: ${error.message}`)
    }
  }

  // Résumé
  console.log('\n\n📊 RÉSUMÉ:')
  console.log(`✅ Succès: ${results.success.length}`)
  console.log(`❌ Non trouvées: ${results.notFound.length}`)
  console.log(`⚠️  Erreurs: ${results.errors.length}`)

  if (results.success.length > 0) {
    console.log('\n✅ Équipes traitées avec succès:')
    results.success.forEach(name => console.log(`  - ${name}`))
  }

  if (results.notFound.length > 0) {
    console.log('\n❌ Équipes/Images non trouvées:')
    results.notFound.forEach(name => console.log(`  - ${name}`))
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Erreurs:')
    results.errors.forEach(error => console.log(`  - ${error}`))
  }
}

// Point d'entrée
processAllJerseys()
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
