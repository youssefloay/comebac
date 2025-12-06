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

    if (!adminDb) {
      return NextResponse.json({
        success: true,
        notifications: []
      })
    }

    // Récupérer les notifications de l'utilisateur avec limite pour éviter le quota
    // Limiter à 100 notifications les plus récentes
    let notificationsSnapshot
    try {
      // Essayer avec orderBy si l'index existe
      notificationsSnapshot = await adminDb
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get()
    } catch (error: any) {
      // Si le quota est dépassé, retourner immédiatement
      if (error.code === 8 || error.message?.includes('Quota exceeded') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn('⚠️ Quota Firestore dépassé - Retour d\'un tableau vide')
        return NextResponse.json({
          success: true,
          notifications: [],
          quotaExceeded: true
        })
      }
      
      // Si l'index n'existe pas, récupérer sans orderBy et limiter
      if (error.code === 9 || error.message?.includes('index')) {
        const allNotifications = await adminDb
          .collection('notifications')
          .where('userId', '==', userId)
          .limit(200) // Récupérer plus pour avoir assez après tri
          .get()
        notificationsSnapshot = allNotifications
      } else {
        throw error
      }
    }
    
    // Trier côté serveur
    const notifications = notificationsSnapshot.docs
      .map(doc => {
        const data = doc.data()
        // Convertir createdAt en string ISO pour éviter les problèmes de sérialisation
        const createdAtDate = data.createdAt?.toDate?.()
        const createdAtISO = createdAtDate?.toISOString() || new Date().toISOString()
        const createdAtTimestamp = createdAtDate?.getTime() || 0
        
        return {
          id: doc.id,
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'info',
          read: data.read || false,
          actionUrl: data.actionUrl || null,
          priority: data.priority || 'normal',
          created_at: createdAtISO,
          createdAtTimestamp: createdAtTimestamp
        }
      })
      .sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp)
      .slice(0, 100) // Limiter à 100 même si on en a récupéré plus

    return NextResponse.json({
      success: true,
      notifications
    })

  } catch (error: any) {
    console.error('❌ Erreur API notifications:', error)
    
    // Si le quota est dépassé, retourner immédiatement un tableau vide
    if (error.code === 8 || error.message?.includes('Quota exceeded') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn('⚠️ Quota Firestore dépassé - Retour d\'un tableau vide pour éviter d\'autres appels')
      return NextResponse.json({
        success: true,
        notifications: [],
        quotaExceeded: true
      })
    }
    
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
    const { adminDb, adminAuth } = await import('@/lib/firebase-admin')

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin non initialisé' },
        { status: 500 }
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

    // Marquer comme lue
    const notificationRef = adminDb.collection('notifications').doc(notificationId)
    const notificationDoc = await notificationRef.get()
    
    const notificationData = notificationDoc.data()
    // Vérifier que la notification appartient à l'utilisateur (par UID ou email)
    if (!notificationDoc.exists || 
        (notificationData?.userId !== userId && notificationData?.userId !== userEmail)) {
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      )
    }

    await notificationRef.update({ read: true, readAt: new Date() })

    // Si c'est une notification custom, mettre à jour aussi le statut dans customNotifications
    if (notificationData?.customNotificationId) {
      const customNotifRef = adminDb.collection('customNotifications').doc(notificationData.customNotificationId)
      const customNotifDoc = await customNotifRef.get()
      
      if (customNotifDoc.exists) {
        const customData = customNotifDoc.data()!
        const recipients = customData.recipients || []
        
        // Trouver et mettre à jour le destinataire par email (insensible à la casse)
        const updatedRecipients = recipients.map((r: any) => {
          const recipientEmail = r.email?.toLowerCase()
          const currentUserEmail = userEmail?.toLowerCase()
          const notificationUserId = notificationData.userId?.toLowerCase()
          
          if (recipientEmail === currentUserEmail || 
              recipientEmail === notificationUserId ||
              (notificationUserId && recipientEmail === notificationUserId)) {
            return { ...r, read: true, readAt: new Date() }
          }
          return r
        })
        
        // Calculer le nouveau readCount
        const readCount = updatedRecipients.filter((r: any) => r.read).length
        
        await customNotifRef.update({
          recipients: updatedRecipients,
          readCount
        })
      }
    }

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
