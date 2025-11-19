import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

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

    // Récupérer l'email de l'utilisateur depuis Firebase Auth
    let userEmail: string | undefined
    try {
      const userRecord = await adminAuth.getUser(userId)
      userEmail = userRecord.email
      console.log('📧 User email from Auth:', userEmail)
    } catch (error) {
      console.warn('⚠️ Could not get user email from Auth:', error)
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

    // Convertir le fichier en base64 (l'image est déjà compressée côté client)
    console.log('📤 Converting file to base64...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Vérifier la taille finale (limite Firestore ~1 MB, on garde 900 KB pour la marge)
    const maxSize = 900 * 1024 // 900 KB pour laisser une marge (limite Firestore ~1 MB)
    
    if (buffer.length > maxSize) {
      console.log('⚠️ File still too large after compression:', { size: buffer.length, maxSize })
      return NextResponse.json(
        { error: `L'image est encore trop grande après compression (${Math.round(buffer.length / 1024)} KB). Veuillez utiliser une image plus petite.` },
        { status: 400 }
      )
    }
    
    const base64 = buffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`
    
    console.log('✅ File converted to base64, size:', dataUrl.length, 'chars', `(${Math.round(dataUrl.length / 1024)} KB)`)

    // Mettre à jour le profil dans Firestore avec l'URL base64
    if (userType === 'player') {
      // Chercher d'abord par uid
      let playerAccountsSnap = await adminDb
        .collection('playerAccounts')
        .where('uid', '==', userId)
        .limit(1)
        .get()

      // Si pas trouvé par uid, chercher par email
      if (playerAccountsSnap.empty && userEmail) {
        console.log('🔍 Player not found by uid, trying email...')
        playerAccountsSnap = await adminDb
          .collection('playerAccounts')
          .where('email', '==', userEmail)
          .limit(1)
          .get()
      }

      if (!playerAccountsSnap.empty) {
        await playerAccountsSnap.docs[0].ref.update({
          photo: dataUrl,
          updatedAt: new Date()
        })
        console.log('✅ Player profile updated with base64 photo')
      } else {
        console.error('❌ Player account not found. UID:', userId, 'Email:', userEmail)
        return NextResponse.json(
          { error: 'Compte joueur non trouvé. Vérifiez que votre compte est bien configuré.' },
          { status: 404 }
        )
      }
    } else if (userType === 'coach') {
      // Chercher d'abord par uid
      let coachAccountsSnap = await adminDb
        .collection('coachAccounts')
        .where('uid', '==', userId)
        .limit(1)
        .get()

      // Si pas trouvé par uid, chercher par email
      if (coachAccountsSnap.empty && userEmail) {
        console.log('🔍 Coach not found by uid, trying email...')
        coachAccountsSnap = await adminDb
          .collection('coachAccounts')
          .where('email', '==', userEmail)
          .limit(1)
          .get()
      }

      if (!coachAccountsSnap.empty) {
        await coachAccountsSnap.docs[0].ref.update({
          photo: dataUrl,
          updatedAt: new Date()
        })
        console.log('✅ Coach profile updated with base64 photo')
      } else {
        console.error('❌ Coach account not found. UID:', userId, 'Email:', userEmail)
        return NextResponse.json(
          { error: 'Compte coach non trouvé. Vérifiez que votre compte est bien configuré.' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      photoUrl: dataUrl
    })
  } catch (error: any) {
    console.error('Erreur upload photo:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    })
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

