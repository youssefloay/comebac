import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const type = searchParams.get('type') // 'custom' ou 'permissions'

    // Stats des permissions de notifications (pour /admin/stats)
    if (type === 'permissions') {
      const permissionsSnap = await adminDb.collection('notificationPermissions').get()
      
      const stats = {
        totalRequests: permissionsSnap.size,
        granted: 0,
        denied: 0
      }
      
      const usersWithNotifications: any[] = []
      
      permissionsSnap.docs.forEach(doc => {
        const data = doc.data()
        if (data.permission === 'granted') {
          stats.granted++
          usersWithNotifications.push({
            email: data.userId,
            type: data.userType || 'unknown',
            timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
          })
        } else if (data.permission === 'denied') {
          stats.denied++
        }
      })
      
      const conversionRate = stats.totalRequests > 0 
        ? `${Math.round((stats.granted / stats.totalRequests) * 100)}%`
        : '0%'
      
      return NextResponse.json({
        stats: {
          ...stats,
          conversionRate
        },
        usersWithNotifications
      })
    }

    // Si un ID est fourni, retourner les détails d'une notification custom
    if (notificationId) {
      const notifDoc = await adminDb.collection('customNotifications').doc(notificationId).get()
      
      if (!notifDoc.exists) {
        return NextResponse.json(
          { error: 'Notification non trouvée' },
          { status: 404 }
        )
      }

      const data = notifDoc.data()!
      
      // Calculer les stats de lecture
      const recipients = data.recipients || []
      const readCount = recipients.filter((r: any) => r.read).length
      const unreadCount = recipients.length - readCount
      const readPercentage = recipients.length > 0 
        ? Math.round((readCount / recipients.length) * 100) 
        : 0

      return NextResponse.json({
        id: notifDoc.id,
        title: data.title,
        message: data.message,
        targetType: data.targetType,
        priority: data.priority,
        createdAt: data.createdAt,
        recipientCount: recipients.length,
        readCount,
        unreadCount,
        readPercentage,
        recipients: recipients.map((r: any) => ({
          email: r.email,
          name: r.name,
          type: r.type,
          teamName: r.teamName,
          read: r.read,
          readAt: r.readAt
        }))
      })
    }

    // Sinon, retourner la liste de toutes les notifications
    const notificationsSnap = await adminDb
      .collection('customNotifications')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const notifications = notificationsSnap.docs.map(doc => {
      const data = doc.data()
      const recipients = data.recipients || []
      const readCount = recipients.filter((r: any) => r.read).length
      const unreadCount = recipients.length - readCount
      const readPercentage = recipients.length > 0 
        ? Math.round((readCount / recipients.length) * 100) 
        : 0

      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        targetType: data.targetType,
        priority: data.priority,
        createdAt: data.createdAt,
        recipientCount: recipients.length,
        readCount,
        unreadCount,
        readPercentage
      }
    })

    return NextResponse.json({
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
