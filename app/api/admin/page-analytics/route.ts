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
    const uniqueUsers = new Set(pageViews.map((v: any) => v.userEmail)).size
    const totalSessions = new Set(pageViews.map((v: any) => v.sessionId)).size
    const totalTime = timeSpentData.reduce((sum: number, t: any) => sum + (t.timeSpent || 0), 0)

    // Calculer le temps passé par utilisateur
    const userTimeStats = timeSpentData.reduce((acc: any, timeData: any) => {
      const time: any = timeData
      const email = (time.userEmail as string) || 'anonymous'
      if (!acc[email]) {
        acc[email] = {
          email,
          totalTime: 0,
          sessions: new Set(),
          pages: new Set(),
          visits: 0
        }
      }
      acc[email].totalTime += (time.timeSpent as number) || 0
      if (time.sessionId as string) {
        acc[email].sessions.add(time.sessionId as string)
      }
      if (time.page as string) {
        acc[email].pages.add(time.page as string)
      }
      acc[email].visits++
      return acc
    }, {})

    const userTimeStatsArray = Object.values(userTimeStats).map((user: any) => ({
      email: user.email,
      totalTime: user.totalTime,
      sessions: user.sessions.size,
      pages: user.pages.size,
      visits: user.visits,
      avgTimePerVisit: user.visits > 0 ? Math.round(user.totalTime / user.visits) : 0
    })).sort((a: any, b: any) => b.totalTime - a.totalTime)

    return NextResponse.json({
      success: true,
      globalStats: {
        totalViews,
        uniqueUsers,
        totalSessions,
        totalTime,
        avgTimePerSession: totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0
      },
      pageStats: pageStatsArray,
      userTimeStats: userTimeStatsArray
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
