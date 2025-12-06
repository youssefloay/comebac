// Script pour créer le produit maillot Santos dans Firestore
// Usage: npx tsx scripts/create-santos-product.ts

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

async function createProduct() {
  console.log('📦 Création du produit maillot Santos...\n')

  const santos = await findTeamByName('Santos')

  if (!santos) {
    console.error('❌ Équipe Santos non trouvée')
    return
  }

  console.log(`✅ Santos trouvé: ${santos.name} (${santos.id})\n`)

  // Normaliser le nom pour l'URL
  const santosNormalized = santos.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const jerseyImageUrl = `https://storage.googleapis.com/${bucketName}/team-jerseys/${santosNormalized}-${santos.id}.jpg`

  console.log(`📄 URL de l'image: ${jerseyImageUrl}\n`)

  // Vérifier si un produit existe déjà
  const existingProducts = await db.collection('shopProducts')
    .where('teamId', '==', santos.id)
    .where('type', '==', 'jersey')
    .get()

  if (!existingProducts.empty) {
    console.log('⚠️  Un produit existe déjà pour Santos')
    const existingProduct = existingProducts.docs[0]
    await existingProduct.ref.update({
      images: [jerseyImageUrl],
      updatedAt: new Date()
    })
    console.log(`✅ Produit existant mis à jour: ${existingProduct.id}`)
  } else {
    // Créer le produit
    const productId = await createJerseyProduct(santos.id, santos.name, jerseyImageUrl)
    console.log(`✅ Produit créé: ${productId}`)
  }

  console.log('\n✅ Terminé!')
}

// Point d'entrée
createProduct()
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
