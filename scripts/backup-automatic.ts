#!/usr/bin/env ts-node

/**
 * Script pour faire un backup automatique de la base de données Firestore
 * 
 * Usage:
 *   npm run backup:auto
 *   ou
 *   ts-node scripts/backup-automatic.ts
 * 
 * Configuration:
 *   - Ajoutez ce script à un cron job pour des backups automatiques
 *   - Exemple cron (tous les jours à 2h du matin):
 *     0 2 * * * cd /path/to/project && npm run backup:auto
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as fs from 'fs/promises'
import * as path from 'path'

// Configuration Firebase Admin
const projectId = process.env.FIREBASE_PROJECT_ID || 'scolar-league'
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY

if (!clientEmail || !privateKey) {
  console.error('❌ Variables FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY requises')
  process.exit(1)
}

// Initialiser Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

// Collections à sauvegarder
const COLLECTIONS = [
  'teams',
  'players',
  'coachAccounts',
  'playerAccounts',
  'teamRegistrations',
  'matches',
  'matchResults',
  'lineups',
  'notifications',
  'userProfiles',
  'teamStatistics',
  'seasonArchives',
  'fantasyTeams',
  'favorites'
]

async function createBackup() {
  console.log('🔄 Début du backup automatique...')
  const startTime = Date.now()

  try {
    const collectionsData: Record<string, any[]> = {}
    const collectionSizes: Record<string, number> = {}

    // Récupérer toutes les collections
    for (const collectionName of COLLECTIONS) {
      try {
        const snapshot = await db.collection(collectionName).get()
        collectionsData[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        collectionSizes[collectionName] = snapshot.size
        console.log(`✅ ${collectionName}: ${snapshot.size} documents`)
      } catch (error: any) {
        console.warn(`⚠️ Erreur ${collectionName}:`, error.message)
        collectionsData[collectionName] = []
        collectionSizes[collectionName] = 0
      }
    }

    // Créer l'objet de backup
    const backupData = {
      metadata: {
        backupDate: new Date().toISOString(),
        backupVersion: '1.0',
        projectId,
        totalCollections: COLLECTIONS.length,
        totalDocuments: Object.values(collectionSizes).reduce((sum, size) => sum + size, 0)
      },
      collections: collectionsData,
      summary: collectionSizes
    }

    const backupJson = JSON.stringify(backupData, null, 2)
    const backupSize = Buffer.byteLength(backupJson, 'utf8')
    const backupSizeMB = (backupSize / (1024 * 1024)).toFixed(2)

    console.log(`📊 Taille du backup: ${backupSizeMB} MB`)

    // Sauvegarder localement
    const backupDir = process.env.BACKUP_LOCAL_DIR || './backups'
    const fileName = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`
    const filePath = path.join(backupDir, fileName)

    await fs.mkdir(backupDir, { recursive: true })
    await fs.writeFile(filePath, backupJson, 'utf8')

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ Backup sauvegardé: ${filePath}`)
    console.log(`⏱️  Temps écoulé: ${elapsedTime}s`)

    // Optionnel: Upload vers GCS ou S3
    const uploadDestination = process.env.BACKUP_UPLOAD_DESTINATION
    if (uploadDestination) {
      console.log(`📤 Upload vers ${uploadDestination}...`)
      // Ici vous pouvez ajouter la logique d'upload
      // Voir app/api/admin/backup/route.ts pour l'implémentation
    }

    // Nettoyer les anciens backups (garder seulement les 30 derniers)
    await cleanupOldBackups(backupDir)

    console.log('🎉 Backup terminé avec succès!')
    process.exit(0)

  } catch (error: any) {
    console.error('❌ Erreur lors du backup:', error)
    process.exit(1)
  }
}

async function cleanupOldBackups(backupDir: string) {
  try {
    const files = await fs.readdir(backupDir)
    const backupFiles = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.stat(path.join(backupDir, f)).then(s => s.mtime.getTime())
      }))

    const filesWithTime = await Promise.all(
      backupFiles.map(async f => ({
        ...f,
        time: await f.time
      }))
    )

    // Trier par date (plus récent en premier)
    filesWithTime.sort((a, b) => b.time - a.time)

    // Garder seulement les 30 derniers
    const maxBackups = parseInt(process.env.BACKUP_MAX_FILES || '30')
    const toDelete = filesWithTime.slice(maxBackups)

    for (const file of toDelete) {
      await fs.unlink(file.path)
      console.log(`🗑️  Ancien backup supprimé: ${file.name}`)
    }

    if (toDelete.length > 0) {
      console.log(`🧹 ${toDelete.length} ancien(s) backup(s) supprimé(s)`)
    }
  } catch (error: any) {
    console.warn('⚠️ Erreur lors du nettoyage:', error.message)
  }
}

// Exécuter le backup
createBackup()

