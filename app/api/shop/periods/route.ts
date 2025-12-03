import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

// GET - Récupérer toutes les périodes
export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }
    const periodsSnapshot = await adminDb.collection('shopPeriods')
      .orderBy('createdAt', 'desc')
      .get()

    const periods = periodsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Convertir les Timestamps en format lisible pour le frontend
        startDate: data.startDate?.toDate?.() || data.startDate,
        endDate: data.endDate?.toDate?.() || data.endDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      }
    })
    return NextResponse.json(periods)
  } catch (error) {
    console.error('Error fetching periods:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des périodes' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle période (admin)
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }
    const { name, startDate, endDate } = await request.json()

    const periodRef = adminDb.collection('shopPeriods').doc()
    const period = {
      id: periodRef.id,
      name,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
      status: 'upcoming',
      totalOrders: 0,
      totalRevenue: 0,
      summary: {
        jerseys: 0,
        tshirts: 0,
        sweatshirts: 0
      },
      createdAt: FieldValue.serverTimestamp()
    }

    await periodRef.set(period)

    return NextResponse.json({ periodId: periodRef.id, period })
  } catch (error) {
    console.error('Error creating period:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la période' },
      { status: 500 }
    )
  }
}
