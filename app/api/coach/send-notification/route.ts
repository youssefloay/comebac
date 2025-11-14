import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification via le token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split('Bearer ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    let userId: string
    try {
      const decodedToken = await adminAuth.verifyIdToken(token)
      userId = decodedToken.uid
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    // Récupérer les données de la requête
    const { title, message, type, recipientIds } = await request.json()

    // Validation
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Titre et message requis' },
        { status: 400 }
      )
    }

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste de destinataires requise' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur est un coach
    const coachesSnapshot = await adminDb
      .collection('coachAccounts')
      .where('uid', '==', userId)
      .limit(1)
      .get()

    if (coachesSnapshot.empty) {
      return NextResponse.json(
        { error: 'Coach non trouvé' },
        { status: 404 }
      )
    }

    // Créer les notifications pour chaque destinataire
    const batch = adminDb.batch()
    const notificationIds: string[] = []

    for (const recipientId of recipientIds) {
      const notificationRef = adminDb.collection('notifications').doc()
      batch.set(notificationRef, {
        userId: recipientId,
        title,
        message,
        type: type || 'info',
        read: false,
        createdAt: Timestamp.now()
      })
      notificationIds.push(notificationRef.id)
    }

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: `${recipientIds.length} notification(s) envoyée(s)`,
      notificationIds
    })

  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
