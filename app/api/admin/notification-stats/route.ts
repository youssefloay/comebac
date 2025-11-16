import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (notificationId) {
      // Récupérer les stats d'une notification spécifique
      const notifDoc = await adminDb.collection('customNotifications').doc(notificationId).get()
      
      if (!notifDoc.exists) {
        return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 })
      }

      const data = notifDoc.data()
      
      // Compter les lectures
      const readCount = data?.recipients?.filter((r: any) => r.read).length || 0
      const totalCount = data?.recipientCount || 0

      return NextResponse.json({
        id: notifDoc.id,
        title: data?.title,
        message: data?.message,
        createdAt: data?.createdAt,
        recipientCount: totalCount,
        readCount,
        unreadCount: totalCount - readCount,
        readPercentage: totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0,
        recipients: data?.recipients || []
      })
    }

    // Récupérer toutes les notifications
    const notificationsSnap = await adminDb.collection('customNotifications')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const notifications = notificationsSnap.docs.map(doc => {
      const data = doc.data()
      const readCount = data.recipients?.filter((r: any) => r.read).length || 0
      const totalCount = data.recipientCount || 0

      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        targetType: data.targetType,
        priority: data.priority,
        createdAt: data.createdAt,
        recipientCount: totalCount,
        readCount,
        unreadCount: totalCount - readCount,
        readPercentage: totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0
      }
    })

    return NextResponse.json({
      success: true,
      notifications
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
