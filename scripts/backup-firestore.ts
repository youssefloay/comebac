import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
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

// Collections à sauvegarder
const COLLECTIONS_TO_BACKUP = [
  'playerAccounts',
  'players',
  'coachAccounts',
  'teams',
  'teamRegistrations',
  'users',
  'userProfiles',
  'teamStatistics',
  'matches',
  'lineups',
  'results'
]

async function backupFirestore() {
  console.log('💾 Sauvegarde de la base de données Firestore...\n')
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(process.cwd(), 'backups', timestamp)
  
  // Créer le dossier de sauvegarde
  if (!fs.existsSync(path.join(process.cwd(), 'backups'))) {
    fs.mkdirSync(path.join(process.cwd(), 'backups'), { recursive: true })
  }
  fs.mkdirSync(backupDir, { recursive: true })
  
  console.log(`📁 Dossier de sauvegarde: ${backupDir}\n`)
  
  const backupStats = {
    totalCollections: 0,
    totalDocuments: 0,
    errors: [] as string[]
  }
  
  // Sauvegarder chaque collection
  for (const collectionName of COLLECTIONS_TO_BACKUP) {
    try {
      console.log(`📋 Sauvegarde de ${collectionName}...`)
      const snapshot = await db.collection(collectionName).get()
      
      if (snapshot.empty) {
        console.log(`   ⚠️  Collection vide`)
        continue
      }
      
      const documents: any[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        // Convertir les Timestamps en objets sérialisables
        const serializedData = serializeFirestoreData(data)
        documents.push({
          id: doc.id,
          ...serializedData
        })
      })
      
      // Sauvegarder dans un fichier JSON
      const filePath = path.join(backupDir, `${collectionName}.json`)
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf-8')
      
      backupStats.totalCollections++
      backupStats.totalDocuments += documents.length
      console.log(`   ✅ ${documents.length} documents sauvegardés`)
      
    } catch (error: any) {
      const errorMsg = `Erreur lors de la sauvegarde de ${collectionName}: ${error.message}`
      backupStats.errors.push(errorMsg)
      console.error(`   ❌ ${errorMsg}`)
    }
  }
  
  // Créer un fichier de métadonnées
  const metadata = {
    timestamp: new Date().toISOString(),
    projectId: process.env.FIREBASE_PROJECT_ID,
    collections: COLLECTIONS_TO_BACKUP,
    stats: backupStats,
    version: '1.0'
  }
  
  fs.writeFileSync(
    path.join(backupDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf-8'
  )
  
  // Résumé
  console.log('\n📊 Résumé de la sauvegarde:\n')
  console.log(`✅ Collections sauvegardées: ${backupStats.totalCollections}`)
  console.log(`✅ Documents sauvegardés: ${backupStats.totalDocuments}`)
  console.log(`📁 Emplacement: ${backupDir}`)
  
  if (backupStats.errors.length > 0) {
    console.log(`\n⚠️  Erreurs (${backupStats.errors.length}):`)
    backupStats.errors.forEach(error => console.log(`   - ${error}`))
  }
  
  console.log('\n✅ Sauvegarde terminée!')
  console.log(`\n💡 Pour restaurer, utilisez: npx tsx scripts/restore-firestore.ts ${backupDir}`)
  
  return backupDir
}

function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }
  
  if (data instanceof Date) {
    return {
      _type: 'Date',
      _value: data.toISOString()
    }
  }
  
  // Vérifier si c'est un Timestamp Firestore
  if (data && typeof data === 'object' && 'toDate' in data && typeof data.toDate === 'function') {
    return {
      _type: 'Timestamp',
      _seconds: (data as any)._seconds,
      _nanoseconds: (data as any)._nanoseconds,
      _value: data.toDate().toISOString()
    }
  }
  
  // Vérifier si c'est un Timestamp sérialisé
  if (data && typeof data === 'object' && '_seconds' in data && '_nanoseconds' in data) {
    return {
      _type: 'Timestamp',
      _seconds: data._seconds,
      _nanoseconds: data._nanoseconds,
      _value: new Date(data._seconds * 1000 + data._nanoseconds / 1000000).toISOString()
    }
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item))
  }
  
  if (typeof data === 'object') {
    const serialized: any = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        serialized[key] = serializeFirestoreData(data[key])
      }
    }
    return serialized
  }
  
  return data
}

backupFirestore()
  .then((backupDir) => {
    console.log(`\n✅ Sauvegarde complète dans: ${backupDir}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la sauvegarde:', error)
    process.exit(1)
  })

