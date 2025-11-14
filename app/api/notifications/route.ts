import { NextRequest, NextResponse } from 'next/server'

// GET - Récupérer les notifications de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    // Récupérer l'userId depuis les query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      )
    }

    // Import dynamique pour éviter les erreurs de build
    const { adminDb } = await import('@/lib/firebase-admin')

    // Récupérer les notifications de l'utilisateur (sans orderBy pour éviter l'index)
    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .get()
    
    // Trier côté serveur
    const notifications = notificationsSnapshot.docs
      .map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          createdAtTimestamp: data.createdAt?.toDate?.()?.getTime() || 0
        }
      })
      .sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp)

    return NextResponse.json({
      success: true,
      notifications
    })

  } catch (error) {
    console.error('❌ Erreur API notifications:', error)
    // Retourner un tableau vide au lieu d'une erreur pour ne pas casser l'UI
    return NextResponse.json({
      success: true,
      notifications: []
    })
  }
}

// PATCH - Marquer une notification comme lue
export async function PATCH(request: NextRequest) {
  try {
    const { notificationId, userId } = await request.json()

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: 'notificationId et userId requis' },
        { status: 400 }
      )
    }

    // Import dynamique
    const { adminDb } = await import('@/lib/firebase-admin')

    // Marquer comme lue
    const notificationRef = adminDb.collection('notifications').doc(notificationId)
    const notificationDoc = await notificationRef.get()
    
    if (!notificationDoc.exists || notificationDoc.data()?.userId !== userId) {
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      )
    }

    await notificationRef.update({ read: true })

    return NextResponse.json({
      success: true,
      notification: { id: notificationId, ...notificationDoc.data(), read: true }
    })

  } catch (error) {
    console.error('❌ Erreur PATCH notifications:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
