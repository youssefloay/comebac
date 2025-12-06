import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { notificationId, userId } = await request.json()

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: 'notificationId et userId requis' },
        { status: 400 }
      )
    }

    // Récupérer l'email de l'utilisateur depuis son UID
    let userEmail: string | null = null
    try {
      // userId peut être soit un UID, soit un email (fallback)
      // Essayer d'abord comme UID
      try {
        const userRecord = await adminAuth.getUser(userId)
        userEmail = userRecord.email || null
      } catch {
        // Si ça échoue, userId est probablement déjà un email
        userEmail = userId
      }
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer l\'email pour userId:', userId)
      // Fallback: utiliser userId comme email
      userEmail = userId
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Impossible de déterminer l\'email de l\'utilisateur' },
        { status: 400 }
      )
    }

    // Marquer la notification individuelle comme lue
    // Chercher par userId (UID ou email) OU par email dans les recipients
    const notifSnap = await adminDb.collection('notifications')
      .where('customNotificationId', '==', notificationId)
      .where('userId', 'in', [userId, userEmail])
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
      
      // Trouver et mettre à jour le destinataire par email
      const updatedRecipients = recipients.map((r: any) => {
        // Comparer l'email (insensible à la casse)
        if (r.email?.toLowerCase() === userEmail?.toLowerCase()) {
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
