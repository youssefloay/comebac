import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
  try {
    const clicksSnapshot = await adminDb.collection('fantasyClicks')
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get()

    const clicks = clicksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString()
    }))

    // Statistiques
    const totalClicks = clicks.length
    const uniqueUsers = new Set(clicks.map(c => c.userEmail)).size
    const byUserType = clicks.reduce((acc: any, click: any) => {
      acc[click.userType] = (acc[click.userType] || 0) + 1
      return acc
    }, {})
    const byPage = clicks.reduce((acc: any, click: any) => {
      acc[click.page] = (acc[click.page] || 0) + 1
      return acc
    }, {})

    // Top utilisateurs
    const userClicks = clicks.reduce((acc: any, click: any) => {
      const key = click.userEmail
      if (!acc[key]) {
        acc[key] = { email: click.userEmail, type: click.userType, count: 0 }
      }
      acc[key].count++
      return acc
    }, {})
    const topUsers = Object.values(userClicks)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      stats: {
        totalClicks,
        uniqueUsers,
        byUserType,
        byPage,
        topUsers
      },
      recentClicks: clicks.slice(0, 50)
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
