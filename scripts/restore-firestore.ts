import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialiser Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }

  initializeApp({
    credential: cert(serviceAccount)
  })
}

const db = getFirestore()

async function restoreFirestore(backupDir: string) {
  if (!fs.existsSync(backupDir)) {
    console.error(`❌ Le dossier de sauvegarde n'existe pas: ${backupDir}`)
    process.exit(1)
  }
  
  console.log('🔄 Restauration de la base de données Firestore...\n')
  console.log(`📁 Dossier de sauvegarde: ${backupDir}\n`)
  
  // Lire les métadonnées
  const metadataPath = path.join(backupDir, 'metadata.json')
  if (!fs.existsSync(metadataPath)) {
    console.error('❌ Fichier metadata.json introuvable')
    process.exit(1)
  }
  
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
  console.log(`📅 Date de sauvegarde: ${metadata.timestamp}`)
  console.log(`📊 Collections: ${metadata.collections.length}\n`)
  
  const restoreStats = {
    collectionsRestored: 0,
    documentsRestored: 0,
    errors: [] as string[]
  }
  
  // Restaurer chaque collection
  for (const collectionName of metadata.collections) {
    try {
      const filePath = path.join(backupDir, `${collectionName}.json`)
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Fichier ${collectionName}.json introuvable, ignoré`)
        continue
      }
      
      console.log(`📋 Restauration de ${collectionName}...`)
      const documents = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      
      if (!Array.isArray(documents) || documents.length === 0) {
        console.log(`   ⚠️  Aucun document à restaurer`)
        continue
      }
      
      // Restaurer chaque document
      const batch = db.batch()
      let batchCount = 0
      const BATCH_SIZE = 500 // Firestore limite à 500 opérations par batch
      
      for (const docData of documents) {
        const { id, ...data } = docData
        const deserializedData = deserializeFirestoreData(data)
        const docRef = db.collection(collectionName).doc(id)
        batch.set(docRef, deserializedData, { merge: true })
        batchCount++
        
        // Exécuter le batch si on atteint la limite
        if (batchCount >= BATCH_SIZE) {
          await batch.commit()
          batchCount = 0
        }
      }
      
      // Exécuter le dernier batch
      if (batchCount > 0) {
        await batch.commit()
      }
      
      restoreStats.collectionsRestored++
      restoreStats.documentsRestored += documents.length
      console.log(`   ✅ ${documents.length} documents restaurés`)
      
    } catch (error: any) {
      const errorMsg = `Erreur lors de la restauration de ${collectionName}: ${error.message}`
      restoreStats.errors.push(errorMsg)
      console.error(`   ❌ ${errorMsg}`)
    }
  }
  
  // Résumé
  console.log('\n📊 Résumé de la restauration:\n')
  console.log(`✅ Collections restaurées: ${restoreStats.collectionsRestored}`)
  console.log(`✅ Documents restaurés: ${restoreStats.documentsRestored}`)
  
  if (restoreStats.errors.length > 0) {
    console.log(`\n⚠️  Erreurs (${restoreStats.errors.length}):`)
    restoreStats.errors.forEach(error => console.log(`   - ${error}`))
  }
  
  console.log('\n✅ Restauration terminée!')
}

function deserializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }
  
  // Restaurer les Timestamps
  if (data && typeof data === 'object' && data._type === 'Timestamp') {
    return Timestamp.fromMillis(
      data._seconds * 1000 + (data._nanoseconds || 0) / 1000000
    )
  }
  
  // Restaurer les Dates
  if (data && typeof data === 'object' && data._type === 'Date') {
    return new Date(data._value)
  }
  
  if (Array.isArray(data)) {
    return data.map(item => deserializeFirestoreData(item))
  }
  
  if (typeof data === 'object') {
    const deserialized: any = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        deserialized[key] = deserializeFirestoreData(data[key])
      }
    }
    return deserialized
  }
  
  return data
}

// Récupérer le chemin du backup depuis les arguments
const backupDir = process.argv[2]

if (!backupDir) {
  console.error('❌ Usage: npx tsx scripts/restore-firestore.ts <chemin-du-backup>')
  console.error('   Exemple: npx tsx scripts/restore-firestore.ts backups/2025-11-26T20-30-00-000Z')
  process.exit(1)
}

restoreFirestore(backupDir)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la restauration:', error)
    process.exit(1)
  })

