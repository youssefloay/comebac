import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

/**
 * API pour créer un backup complet de la base de données
 * Sauvegarde toutes les collections importantes dans un fichier JSON
 * 
 * Options de stockage:
 * 1. Google Cloud Storage (recommandé pour Firebase)
 * 2. AWS S3
 * 3. Fichier local (pour développement)
 */
export async function POST(request: NextRequest) {
  try {
    const { destination = 'gcs', upload = false } = await request.json().catch(() => ({}))

    console.log('🔄 Début du backup de la base de données...')
    const startTime = Date.now()

    // Récupérer toutes les collections importantes
    const collections = [
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

    console.log(`📦 Récupération de ${collections.length} collections...`)

    // Récupérer toutes les données en parallèle
    const collectionsData: Record<string, any[]> = {}
    const collectionSizes: Record<string, number> = {}

    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName))
        collectionsData[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        collectionSizes[collectionName] = snapshot.size
        console.log(`✅ ${collectionName}: ${snapshot.size} documents`)
      } catch (error: any) {
        console.warn(`⚠️ Erreur lors de la récupération de ${collectionName}:`, error.message)
        collectionsData[collectionName] = []
        collectionSizes[collectionName] = 0
      }
    }

    // Créer l'objet de backup
    const backupData = {
      metadata: {
        backupDate: new Date().toISOString(),
        backupVersion: '1.0',
        projectId: 'scolar-league',
        totalCollections: collections.length,
        totalDocuments: Object.values(collectionSizes).reduce((sum, size) => sum + size, 0)
      },
      collections: collectionsData,
      summary: collectionSizes
    }

    const backupJson = JSON.stringify(backupData, null, 2)
    const backupSize = Buffer.byteLength(backupJson, 'utf8')
    const backupSizeMB = (backupSize / (1024 * 1024)).toFixed(2)

    console.log(`📊 Taille du backup: ${backupSizeMB} MB`)

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ Backup créé en ${elapsedTime}s`)

    // Si upload est demandé, uploader vers le service de stockage
    // Par défaut, sauvegarder localement (GRATUIT)
    if (upload) {
      try {
        const finalDestination = destination || 'local'
        const uploadResult = await uploadBackup(backupJson, finalDestination)
        return NextResponse.json({
          success: true,
          message: 'Backup créé et uploadé avec succès',
          backup: {
            size: backupSize,
            sizeMB: backupSizeMB,
            collections: Object.keys(collectionSizes).length,
            totalDocuments: backupData.metadata.totalDocuments,
            elapsedTime: `${elapsedTime}s`,
            destination: finalDestination,
            uploadResult
          }
        })
      } catch (uploadError: any) {
        console.error('❌ Erreur lors de l\'upload:', uploadError)
        return NextResponse.json({
          success: true,
          warning: 'Backup créé mais upload échoué',
          error: uploadError.message,
          backup: {
            size: backupSize,
            sizeMB: backupSizeMB,
            collections: Object.keys(collectionSizes).length,
            totalDocuments: backupData.metadata.totalDocuments,
            elapsedTime: `${elapsedTime}s`
          }
        }, { status: 207 }) // 207 Multi-Status
      }
    }

    // Retourner le backup en JSON
    return new NextResponse(backupJson, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json"`,
        'X-Backup-Size': backupSize.toString(),
        'X-Backup-Size-MB': backupSizeMB,
        'X-Backup-Collections': Object.keys(collectionSizes).length.toString(),
        'X-Backup-Documents': backupData.metadata.totalDocuments.toString()
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur lors du backup:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du backup', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * Upload le backup vers un service de stockage
 * Options GRATUITES uniquement
 */
async function uploadBackup(backupJson: string, destination: string): Promise<any> {
  switch (destination) {
    case 'email':
      return await sendBackupByEmail(backupJson)
    case 'local':
      return await saveToLocal(backupJson)
    case 'gcs':
      return await uploadToGoogleCloudStorage(backupJson)
    case 's3':
      return await uploadToS3(backupJson)
    default:
      // Par défaut, sauvegarder localement (GRATUIT)
      return await saveToLocal(backupJson)
  }
}

/**
 * Envoyer le backup par email (GRATUIT - via Resend)
 * Limité à ~25MB par email
 */
async function sendBackupByEmail(backupJson: string): Promise<any> {
  const { sendEmail } = await import('@/lib/email-service')
  const adminEmail = process.env.ADMIN_EMAIL || 'contact@comebac.com'
  
  // Si le backup est trop gros, compresser ou envoyer juste un résumé
  const backupSize = Buffer.byteLength(backupJson, 'utf8')
  const backupSizeMB = backupSize / (1024 * 1024)
  
  if (backupSizeMB > 20) {
    // Si trop gros, envoyer juste un résumé avec instructions
    const summary = JSON.parse(backupJson)
    const summaryData = {
      metadata: summary.metadata,
      summary: summary.summary,
      note: 'Le backup complet est trop volumineux pour être envoyé par email. Veuillez le télécharger directement depuis l\'interface admin.'
    }
    
    await sendEmail({
      to: adminEmail,
      subject: `📦 Backup automatique - ${new Date().toLocaleDateString('fr-FR')}`,
      html: `
        <h2>Backup Automatique ComeBac League</h2>
        <p>Un backup a été créé le ${new Date().toLocaleString('fr-FR')}</p>
        <h3>Résumé:</h3>
        <pre>${JSON.stringify(summaryData, null, 2)}</pre>
        <p><strong>Note:</strong> Le backup complet (${backupSizeMB.toFixed(2)} MB) est trop volumineux pour être envoyé par email.</p>
        <p>Veuillez le télécharger directement depuis l'interface admin.</p>
      `
    })
    
    return {
      destination: 'email',
      sent: true,
      note: 'Résumé envoyé par email (backup trop volumineux)',
      sizeMB: backupSizeMB
    }
  }
  
  // Envoyer le backup complet en pièce jointe (via base64 dans le HTML)
  await sendEmail({
    to: adminEmail,
    subject: `📦 Backup automatique - ${new Date().toLocaleDateString('fr-FR')}`,
    html: `
      <h2>Backup Automatique ComeBac League</h2>
      <p>Backup créé le ${new Date().toLocaleString('fr-FR')}</p>
      <p>Taille: ${backupSizeMB.toFixed(2)} MB</p>
      <p><strong>Le backup est inclus ci-dessous en format JSON:</strong></p>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; max-height: 500px; overflow-y: auto;">${backupJson.substring(0, 10000)}${backupJson.length > 10000 ? '\n\n... (tronqué pour l\'aperçu, voir le fichier complet ci-dessous)' : ''}</pre>
      <hr>
      <p><strong>Fichier complet (copier-coller dans un fichier .json):</strong></p>
      <textarea style="width: 100%; height: 200px; font-family: monospace; font-size: 10px;">${backupJson}</textarea>
    `
  })
  
  return {
    destination: 'email',
    sent: true,
    sizeMB: backupSizeMB
  }
}

/**
 * Upload vers Google Cloud Storage
 */
async function uploadToGoogleCloudStorage(backupJson: string): Promise<any> {
  // Vérifier que les variables d'environnement sont configurées
  if (!process.env.GCS_BUCKET_NAME || !process.env.GCS_PROJECT_ID) {
    throw new Error('Variables GCS_BUCKET_NAME et GCS_PROJECT_ID requises')
  }

  // Utiliser @google-cloud/storage si disponible
  // Sinon, utiliser l'API REST de GCS
  try {
    const { Storage } = await import('@google-cloud/storage')
    const storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE // Optionnel, peut utiliser les credentials par défaut
    })

    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME)
    const fileName = `backups/backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`
    const file = bucket.file(fileName)

    await file.save(backupJson, {
      contentType: 'application/json',
      metadata: {
        metadata: {
          backupDate: new Date().toISOString(),
          projectId: 'scolar-league'
        }
      }
    })

    console.log(`✅ Backup uploadé vers GCS: ${fileName}`)
    return {
      destination: 'gcs',
      bucket: process.env.GCS_BUCKET_NAME,
      fileName,
      url: `gs://${process.env.GCS_BUCKET_NAME}/${fileName}`
    }
  } catch (error: any) {
    // Fallback: utiliser l'API REST
    console.warn('⚠️ @google-cloud/storage non disponible, tentative avec API REST...')
    throw new Error(`Upload GCS échoué: ${error.message}. Installez @google-cloud/storage ou configurez l'API REST.`)
  }
}

/**
 * Upload vers AWS S3
 */
async function uploadToS3(backupJson: string): Promise<any> {
  if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Variables AWS requises: AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY')
  }

  try {
    // Import dynamique optionnel - si le package n'est pas installé, on retourne une erreur claire
    let S3Client: any, PutObjectCommand: any
    try {
      // @ts-ignore - Package optionnel, peut ne pas être installé
      const s3Module = await import('@aws-sdk/client-s3')
      S3Client = s3Module.S3Client
      PutObjectCommand = s3Module.PutObjectCommand
    } catch (importError: any) {
      throw new Error('Package @aws-sdk/client-s3 non installé. Installez-le avec: npm install @aws-sdk/client-s3')
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })

    const fileName = `backups/backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: backupJson,
      ContentType: 'application/json',
      Metadata: {
        backupDate: new Date().toISOString(),
        projectId: 'scolar-league'
      }
    })

    await s3Client.send(command)

    console.log(`✅ Backup uploadé vers S3: ${fileName}`)
    return {
      destination: 's3',
      bucket: process.env.AWS_S3_BUCKET_NAME,
      fileName,
      url: `s3://${process.env.AWS_S3_BUCKET_NAME}/${fileName}`
    }
  } catch (error: any) {
    throw new Error(`Upload S3 échoué: ${error.message}`)
  }
}

/**
 * Sauvegarder localement (pour développement)
 */
async function saveToLocal(backupJson: string): Promise<any> {
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const backupDir = process.env.BACKUP_LOCAL_DIR || './backups'
  const fileName = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`
  const filePath = path.join(backupDir, fileName)

  // Créer le dossier s'il n'existe pas
  await fs.mkdir(backupDir, { recursive: true })
  
  // Sauvegarder le fichier
  await fs.writeFile(filePath, backupJson, 'utf8')

  console.log(`✅ Backup sauvegardé localement: ${filePath}`)
  return {
    destination: 'local',
    filePath,
    fileName
  }
}

/**
 * GET: Récupérer la liste des backups disponibles
 */
export async function GET() {
  try {
    // Retourner les informations de configuration
    return NextResponse.json({
      availableDestinations: ['local', 'email', 'gcs', 's3'],
      recommended: 'local', // Stockage local est 100% GRATUIT
      freeOptions: {
        local: {
          name: 'Stockage Local',
          free: '100% GRATUIT - Illimité (selon espace disque)',
          description: 'Sauvegarde sur le serveur local dans le dossier ./backups',
          recommended: true,
          configured: true
        },
        email: {
          name: 'Envoi par Email',
          free: '100% GRATUIT - Via Resend (déjà configuré)',
          description: 'Envoie le backup par email (limité à ~20MB)',
          configured: !!process.env.RESEND_API_KEY
        }
      },
      paidOptions: {
        gcs: 'Google Cloud Storage (payant)',
        s3: 'AWS S3 (payant)'
      },
      instructions: {
        local: 'Aucune configuration requise - Utilisez {"destination": "local", "upload": true} ou téléchargez directement',
        email: 'Aucune configuration requise - Utilisez {"destination": "email", "upload": true} (nécessite RESEND_API_KEY)',
        gcs: 'Configurez GCS_BUCKET_NAME et GCS_PROJECT_ID dans .env.local (PAYANT)',
        s3: 'Configurez AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY dans .env.local (PAYANT)'
      },
      note: 'Pour un backup 100% gratuit, utilisez "local" ou téléchargez directement le fichier JSON'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des informations', details: error.message },
      { status: 500 }
    )
  }
}

