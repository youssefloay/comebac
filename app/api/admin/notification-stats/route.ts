import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
  try {
    const permissionsSnapshot = await adminDb.collection('notificationPermissions')
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get()

    const permissions = permissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString()
    }))

    // Statistiques
    const totalRequests = permissions.length
    const granted = permissions.filter(p => p.permission === 'granted').length
    const denied = permissions.filter(p => p.permission === 'denied').length
    const uniqueUsers = new Set(permissions.map(p => p.userEmail)).size

    // Par type d'utilisateur
    const byUserType = permissions.reduce((acc: any, perm: any) => {
      acc[perm.userType] = acc[perm.userType] || { granted: 0, denied: 0, total: 0 }
      acc[perm.userType].total++
      if (perm.permission === 'granted') acc[perm.userType].granted++
      if (perm.permission === 'denied') acc[perm.userType].denied++
      return acc
    }, {})

    // Par source
    const bySource = permissions.reduce((acc: any, perm: any) => {
      acc[perm.source] = (acc[perm.source] || 0) + 1
      return acc
    }, {})

    // Utilisateurs qui ont activé
    const usersWithNotifications = permissions
      .filter(p => p.permission === 'granted' && p.userEmail !== 'anonymous')
      .map(p => ({
        email: p.userEmail,
        type: p.userType,
        timestamp: p.timestamp
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Taux de conversion
    const conversionRate = totalRequests > 0 ? ((granted / totalRequests) * 100).toFixed(1) : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalRequests,
        granted,
        denied,
        uniqueUsers,
        conversionRate: `${conversionRate}%`,
        byUserType,
        bySource
      },
      usersWithNotifications: usersWithNotifications.slice(0, 100),
      recentActions: permissions.slice(0, 50)
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
