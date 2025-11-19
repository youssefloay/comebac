import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from 'firebase-admin/storage'
import { adminDb, adminApp } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const userType = formData.get('userType') as string

    if (!file || !userId || !userType) {
      return NextResponse.json(
        { error: 'Fichier, userId et userType requis' },
        { status: 400 }
      )
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      )
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'L\'image ne doit pas dépasser 5MB' },
        { status: 400 }
      )
    }

    // Convertir File en Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload vers Firebase Storage
    console.log('📤 Uploading to Firebase Storage via Admin SDK...')
    const storage = getStorage(adminApp)
    
    // Essayer différents noms de bucket possibles
    const projectId = process.env.FIREBASE_PROJECT_ID || 'scolar-league'
    const possibleBuckets = [
      'scolar-league.firebasestorage.app',
      'scolar-league.appspot.com',
      `${projectId}.appspot.com`,
      `${projectId}.firebasestorage.app`
    ]
    
    let bucket
    let bucketName
    let lastError: any = null
    
    for (const name of possibleBuckets) {
      try {
        bucket = storage.bucket(name)
        // Vérifier si le bucket existe en essayant de lister les fichiers (opération légère)
        await bucket.exists()
        bucketName = name
        console.log('✅ Bucket found:', bucketName)
        break
      } catch (error: any) {
        console.log(`❌ Bucket "${name}" not accessible:`, error.message)
        lastError = error
        continue
      }
    }
    
    if (!bucket || !bucketName) {
      throw new Error(`Aucun bucket accessible trouvé. Essayé: ${possibleBuckets.join(', ')}. Dernière erreur: ${lastError?.message || 'Inconnue'}`)
    }
    
    const fileName = `${userType}-photos/${userId}-${Date.now()}.jpg`
    console.log('📁 File path:', fileName)
    
    const fileRef = bucket.file(fileName)

    console.log('⬆️ Saving file to bucket...')
    await fileRef.save(buffer, {
      contentType: 'image/jpeg',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    })
    console.log('✅ File saved')

    // Rendre le fichier public et obtenir l'URL
    console.log('🔓 Making file public...')
    await fileRef.makePublic()
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`
    console.log('✅ File is public, URL:', downloadURL)

    // Mettre à jour le profil dans Firestore
    if (userType === 'player') {
      const playerAccountsSnap = await adminDb
        .collection('playerAccounts')
        .where('uid', '==', userId)
        .limit(1)
        .get()

      if (!playerAccountsSnap.empty) {
        await playerAccountsSnap.docs[0].ref.update({
          photo: downloadURL,
          updatedAt: new Date()
        })
      }
    } else if (userType === 'coach') {
      const coachAccountsSnap = await adminDb
        .collection('coachAccounts')
        .where('uid', '==', userId)
        .limit(1)
        .get()

      if (!coachAccountsSnap.empty) {
        await coachAccountsSnap.docs[0].ref.update({
          photo: downloadURL,
          updatedAt: new Date()
        })
      }
    }

    return NextResponse.json({
      success: true,
      photoUrl: downloadURL
    })
  } catch (error: any) {
    console.error('Erreur upload photo:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

