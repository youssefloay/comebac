import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET - Récupérer les paramètres de la boutique
export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }
    const settingsDoc = await adminDb.collection('shopSettings').doc('main').get()
    
    if (!settingsDoc.exists) {
      // Créer les paramètres par défaut
      const defaultSettings = {
        currentPeriod: {
          id: null,
          isOpen: false,
          startDate: null,
          endDate: null,
          status: 'upcoming'
        },
        deliveryOptions: {
          pickup: true,
          shipping: true,
          shippingCost: 100
        },
        products: {
          jersey: { price: 950, active: true },
          tshirt: { price: 750, active: true },
          sweatshirt: { price: 1100, active: true }
        },
        notificationEmails: []
      }
      
      await adminDb.collection('shopSettings').doc('main').set(defaultSettings)
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settingsDoc.data())
  } catch (error) {
    console.error('Error fetching shop settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour les paramètres (admin uniquement)
export async function PUT(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }
    const updates = await request.json()
    
    await adminDb.collection('shopSettings').doc('main').update(updates)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating shop settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    )
  }
}
