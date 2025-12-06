// Script pour uploader les maillots depuis le dossier assets vers le store
// Usage: npx tsx scripts/upload-jerseys-from-assets.ts

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

// Mapping des noms d'équipes basé sur les descriptions des images
const teamNameMapping: Record<string, string[]> = {
  'Blues': ['blues', 'blue'],
  'VII Rising': ['vii rising', 'vii', 'rising'],
  'Prime Team': ['prime team', 'prime'],
  'The Saints': ['saints', 'the saints'],
  'Devils': ['devils'],
  'Road to Glory': ['road to glory', 'rtg', 'road'],
  'Icons': ['icons'],
  'Goats': ['goats'],
  'Les Lions Sacrés': ['lions sacres', 'lions', 'sacres'],
  'EGO FC': ['ego', 'ego fc'],
  'Underdogs': ['underdogs'],
  'El Matador': ['matador', 'el matador'],
  'Selecao FC': ['selecao', 'selecao fc'],
  'Tiki Taka': ['tiki taka', 'tiki'],
  'Santos FC': ['santos', 'santos fc'],
  'Mangoz FC': ['mangoz', 'mangoz fc']
}

// Mapping des fichiers images aux équipes (basé sur l'ordre des descriptions)
const imageToTeamMapping: Record<string, string> = {
  'T-shirts_88_page-0010': 'Blues',
  'T-shirts_88_page-0007': 'VII Rising',
  'T-shirts_88_page-0012': 'Prime Team',
  'T-shirts_88_page-0003': 'The Saints',
  'T-shirts_88_page-0009': 'Devils',
  'T-shirts_88_page-0008': 'Road to Glory',
  'T-shirts_88_page-0011': 'Icons',
  'T-shirts_88_page-0014': 'Goats',
  'T-shirts_88_page-0015': 'Les Lions Sacrés',
  'T-shirts_88_page-0006': 'EGO FC',
  'T-shirts_88_page-0001': 'Underdogs',
  'T-shirts_88_page-0005': 'El Matador',
  'T-shirts_88_page-0002': 'Selecao FC',
  'T-shirts_88_page-0016': 'Tiki Taka',
  'T-shirts_88_page-0013': 'Santos FC',
  'T-shirts_88_page-0004': 'Mangoz FC'
}

async function uploadJerseyImage(teamId: string, imagePath: string): Promise<string> {
  const bucket = storage.bucket(bucketName)
  const fileName = `team-jerseys/${teamId}-${Date.now()}.png`
  const file = bucket.file(fileName)

  // Lire le fichier local
  const fileBuffer = fs.readFileSync(imagePath)
  
  console.log(`📤 Uploading ${fileName}...`)
  
  // Upload vers Firebase Storage
  await file.save(fileBuffer, {
    metadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000',
    },
  })
  console.log(`✅ File saved to bucket`)

  // Rendre le fichier public
  console.log(`🔓 Making file public...`)
  await file.makePublic()
  console.log(`✅ File is now public`)

  // Vérifier que le fichier est accessible
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
  
  // Attendre un peu pour que les permissions se propagent
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Retourner l'URL publique
  return publicUrl
}

async function findTeamByName(teamName: string): Promise<{ id: string; name: string } | null> {
  // Normaliser le nom de l'équipe pour la recherche
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

  // Ensuite, essayer une correspondance partielle
  for (const doc of teamsSnapshot.docs) {
    const data = doc.data()
    const teamNameLower = (data.name || '').trim().toLowerCase()
    
    // Vérifier si le nom de l'équipe contient des mots-clés du mapping
    const keywords = teamNameMapping[teamName] || [normalizedName]
    for (const keyword of keywords) {
      if (teamNameLower.includes(keyword) || keyword.includes(teamNameLower)) {
        return { id: doc.id, name: data.name }
      }
    }
  }

  return null
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
    price: 950, // Prix par défaut, peut être modifié
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

async function processJerseys() {
  console.log('🛍️ Traitement des maillots depuis assets...\n')

  const assetsDir = resolve(process.cwd(), 'assets')
  
  if (!fs.existsSync(assetsDir)) {
    console.error(`❌ Le dossier assets n'existe pas`)
    process.exit(1)
  }

  // Lire tous les fichiers du dossier assets
  const files = fs.readdirSync(assetsDir)
  const jerseyFiles = files.filter(f => 
    f.startsWith('T-shirts_88_page-') && f.endsWith('.png')
  )

  console.log(`📁 ${jerseyFiles.length} images de maillots trouvées\n`)

  const results = {
    success: [] as string[],
    notFound: [] as string[],
    errors: [] as string[]
  }

  for (const imageFile of jerseyFiles) {
    // Extraire le préfixe du fichier (ex: "T-shirts_88_page-0010")
    const filePrefix = imageFile.replace(/-\w{8}-\w{4}-\w{4}-\w{4}-\w{12}\.png$/, '')
    const teamName = imageToTeamMapping[filePrefix]
    
    if (!teamName) {
      console.log(`⚠️  Pas de mapping pour: ${imageFile}`)
      results.notFound.push(imageFile)
      continue
    }

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
      const jerseyImageUrl = await uploadJerseyImage(team.id, imagePath)
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
processJerseys()
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
