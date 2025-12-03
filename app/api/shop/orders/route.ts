import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// GET - Récupérer les commandes (avec filtres optionnels)
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const periodId = searchParams.get('periodId')
    const status = searchParams.get('status')

    let query: any = adminDb.collection('shopOrders')

    if (userId) {
      query = query.where('userId', '==', userId)
    }
    if (periodId) {
      query = query.where('periodId', '==', periodId)
    }
    if (status) {
      query = query.where('orderStatus', '==', status)
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get()
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle commande
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }
    const orderData = await request.json()

    // Vérifier que la boutique est ouverte
    const settingsDoc = await adminDb.collection('shopSettings').doc('main').get()
    const settings = settingsDoc.data()

    if (!settings?.currentPeriod?.isOpen) {
      return NextResponse.json(
        { error: 'La boutique est actuellement fermée' },
        { status: 400 }
      )
    }

    // Créer la commande
    const orderRef = adminDb.collection('shopOrders').doc()
    const order = {
      ...orderData,
      id: orderRef.id,
      periodId: settings.currentPeriod.id,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }

    await orderRef.set(order)

    return NextResponse.json({ orderId: orderRef.id, order })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la commande' },
      { status: 500 }
    )
  }
}
