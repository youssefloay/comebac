// Script pour uploader les maillots de chaque équipe dans le shop
// Usage: 
// 1. Extraire les images du PDF dans un dossier (ex: ./jerseys/)
// 2. Nommer les fichiers avec le nom de l'équipe (ex: "Icons.jpg", "Underdogs.jpg")
// 3. Exécuter: npx tsx scripts/upload-team-jerseys.ts

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import * as fs from 'fs'
import * as path from 'path'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()
const storage = getStorage()

interface TeamJerseyMapping {
  teamName: string
  imagePath: string
}

async function uploadJerseyImage(teamId: string, imagePath: string): Promise<string> {
  const bucket = storage.bucket()
  const fileName = `team-jerseys/${teamId}-${Date.now()}.jpg`
  const file = bucket.file(fileName)

  // Lire le fichier local
  const fileBuffer = fs.readFileSync(imagePath)
  
  // Upload vers Firebase Storage
  await file.save(fileBuffer, {
    metadata: {
      contentType: 'image/jpeg',
    },
  })

  // Rendre le fichier public
  await file.makePublic()

  // Retourner l'URL publique
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`
}

async function findTeamByName(teamName: string): Promise<string | null> {
  // Normaliser le nom de l'équipe pour la recherche
  const normalizedName = teamName.trim().toLowerCase()
  
  const teamsSnapshot = await db.collection('teams')
    .where('isActive', '==', true)
    .get()

  for (const doc of teamsSnapshot.docs) {
    const data = doc.data()
    const teamNameLower = (data.name || '').trim().toLowerCase()
    
    // Correspondance exacte ou partielle
    if (teamNameLower === normalizedName || 
        teamNameLower.includes(normalizedName) || 
        normalizedName.includes(teamNameLower)) {
      return doc.id
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
    images: [jerseyImageUrl], // Image du maillot spécifique à l'équipe
    active: true,
    mockupTemplate: 'jersey',
    teamId: teamId, // Lier le produit à l'équipe
    teamName: teamName
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

async function processJerseys(jerseysDir: string) {
  console.log('🛍️ Traitement des maillots...\n')

  // Lire tous les fichiers du dossier
  const files = fs.readdirSync(jerseysDir)
  const imageFiles = files.filter(f => 
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  )

  console.log(`📁 ${imageFiles.length} images trouvées\n`)

  const results = {
    success: [] as string[],
    notFound: [] as string[],
    errors: [] as string[]
  }

  for (const imageFile of imageFiles) {
    const imagePath = path.join(jerseysDir, imageFile)
    
    // Extraire le nom de l'équipe du nom du fichier
    // Ex: "Icons.jpg" -> "Icons"
    const teamName = path.basename(imageFile, path.extname(imageFile))
    
    console.log(`\n🔍 Recherche de l'équipe: ${teamName}`)
    
    try {
      // Chercher l'équipe
      const teamId = await findTeamByName(teamName)
      
      if (!teamId) {
        console.log(`❌ Équipe non trouvée: ${teamName}`)
        results.notFound.push(teamName)
        continue
      }

      console.log(`✅ Équipe trouvée: ${teamName} (${teamId})`)

      // Upload de l'image
      console.log(`📤 Upload de l'image...`)
      const jerseyImageUrl = await uploadJerseyImage(teamId, imagePath)
      console.log(`✅ Image uploadée: ${jerseyImageUrl}`)

      // Vérifier si un produit existe déjà pour cette équipe
      const existingProducts = await db.collection('shopProducts')
        .where('teamId', '==', teamId)
        .where('type', '==', 'jersey')
        .get()

      if (!existingProducts.empty) {
        // Mettre à jour le produit existant
        const existingProduct = existingProducts.docs[0]
        await updateExistingJerseyProduct(existingProduct.id, jerseyImageUrl)
        console.log(`✅ Produit existant mis à jour`)
        results.success.push(`${teamName} (mis à jour)`)
      } else {
        // Créer un nouveau produit
        const teamDoc = await db.collection('teams').doc(teamId).get()
        const teamData = teamDoc.data()
        const fullTeamName = teamData?.name || teamName
        
        await createJerseyProduct(teamId, fullTeamName, jerseyImageUrl)
        results.success.push(teamName)
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

  if (results.notFound.length > 0) {
    console.log('\nÉquipes non trouvées:')
    results.notFound.forEach(name => console.log(`  - ${name}`))
  }

  if (results.errors.length > 0) {
    console.log('\nErreurs:')
    results.errors.forEach(error => console.log(`  - ${error}`))
  }
}

// Point d'entrée
const jerseysDir = process.argv[2] || './jerseys'

if (!fs.existsSync(jerseysDir)) {
  console.error(`❌ Le dossier ${jerseysDir} n'existe pas`)
  console.log('\nUsage:')
  console.log('1. Créez un dossier "jerseys" à la racine du projet')
  console.log('2. Placez-y les images des maillots (nommées avec le nom de l\'équipe)')
  console.log('3. Exécutez: npx tsx scripts/upload-team-jerseys.ts [chemin-du-dossier]')
  process.exit(1)
}

processJerseys(jerseysDir)
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
