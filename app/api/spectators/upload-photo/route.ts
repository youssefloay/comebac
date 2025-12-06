import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from 'firebase-admin/storage'
import { adminApp } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier requis' },
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
    console.log('📤 Uploading spectator photo to Firebase Storage...')
    const storage = getStorage(adminApp)
    
    // Utiliser le bucket spécifié (sans le préfixe gs://)
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'scolar-league.firebasestorage.app'
    const bucket = storage.bucket(bucketName)
    console.log('✅ Using bucket:', bucketName)
    
    const fileName = `spectator-photos/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
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

    return NextResponse.json({
      success: true,
      photoUrl: downloadURL
    })
  } catch (error: any) {
    console.error('Erreur upload photo spectateur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
