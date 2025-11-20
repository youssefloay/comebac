import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin non initialisé' }, { status: 500 })
    }

    const pageViewsSnapshot = await adminDb.collection('pageViews')
      .orderBy('timestamp', 'desc')
      .limit(2000)
      .get()

    const pageViews = pageViewsSnapshot.docs
      .map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString()
      }))
      .filter((view: any) => view.userEmail !== 'contact@comebac.com')

    const timeSpentSnapshot = await adminDb.collection('timeSpent')
      .orderBy('timestamp', 'desc')
      .limit(2000)
      .get()

    const timeSpentData = timeSpentSnapshot.docs
      .map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString()
      }))
      .filter((time: any) => time.userEmail !== 'contact@comebac.com')

    const pageStats = pageViews.reduce((acc: any, view: any) => {
      if (!acc[view.page]) {
        acc[view.page] = {
          page: view.page,
          views: 0,
          uniqueUsers: new Set(),
          totalTime: 0,
          sessions: new Set()
        }
      }
      acc[view.page].views++
      acc[view.page].uniqueUsers.add(view.userEmail)
      acc[view.page].sessions.add(view.sessionId)
      return acc
    }, {})

    timeSpentData.forEach((time: any) => {
      if (pageStats[time.page]) {
        pageStats[time.page].totalTime += time.timeSpent
      }
    })

    const pageStatsArray = Object.values(pageStats).map((stat: any) => ({
      page: stat.page,
      views: stat.views,
      uniqueUsers: stat.uniqueUsers.size,
      sessions: stat.sessions.size,
      totalTime: stat.totalTime,
      avgTimePerView: stat.views > 0 ? Math.round(stat.totalTime / stat.views) : 0
    })).sort((a, b) => b.views - a.views)

    const totalViews = pageViews.length
    const uniqueUsers = new Set(pageViews.map(v => v.userEmail)).size
    const totalSessions = new Set(pageViews.map(v => v.sessionId)).size
    const totalTime = timeSpentData.reduce((sum, t) => sum + t.timeSpent, 0)

    return NextResponse.json({
      success: true,
      globalStats: {
        totalViews,
        uniqueUsers,
        totalSessions,
        totalTime,
        avgTimePerSession: totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0
      },
      pageStats: pageStatsArray
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
