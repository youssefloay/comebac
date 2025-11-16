import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { notificationId, userId } = await request.json()

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: 'notificationId et userId requis' },
        { status: 400 }
      )
    }

    // Marquer la notification individuelle comme lue
    const notifSnap = await adminDb.collection('notifications')
      .where('customNotificationId', '==', notificationId)
      .where('userId', '==', userId)
      .limit(1)
      .get()

    if (!notifSnap.empty) {
      await notifSnap.docs[0].ref.update({
        read: true,
        readAt: new Date()
      })
    }

    // Mettre à jour dans customNotifications
    const customNotifRef = adminDb.collection('customNotifications').doc(notificationId)
    const customNotifDoc = await customNotifRef.get()

    if (customNotifDoc.exists) {
      const data = customNotifDoc.data()
      const recipients = data?.recipients || []
      
      // Trouver et mettre à jour le destinataire
      const updatedRecipients = recipients.map((r: any) => {
        if (r.email === userId) {
          return {
            ...r,
            read: true,
            readAt: new Date()
          }
        }
        return r
      })

      // Compter les lectures
      const readCount = updatedRecipients.filter((r: any) => r.read).length

      await customNotifRef.update({
        recipients: updatedRecipients,
        readCount
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marquée comme lue'
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
