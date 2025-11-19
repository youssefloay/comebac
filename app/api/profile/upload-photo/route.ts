import { NextRequest, NextResponse } from 'next/server'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase-admin/storage'
import { adminDb } from '@/lib/firebase-admin'

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
    const storage = getStorage()
    const fileName = `${userType}-photos/${userId}-${Date.now()}.jpg`
    const storageRef = ref(storage, fileName)

    await uploadBytes(storageRef, buffer, {
      contentType: 'image/jpeg',
    })

    const downloadURL = await getDownloadURL(storageRef)

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

