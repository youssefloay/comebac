import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { DEFAULT_PRODUCTS } from '@/lib/shop-utils'

// GET - Récupérer tous les produits actifs
export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }
    const productsSnapshot = await adminDb.collection('shopProducts').where('active', '==', true).get()
    
    if (productsSnapshot.empty) {
      // Initialiser les produits par défaut
      const batch = adminDb.batch()
      DEFAULT_PRODUCTS.forEach((product) => {
        const docRef = adminDb.collection('shopProducts').doc()
        batch.set(docRef, { ...product, id: docRef.id })
      })
      await batch.commit()
      
      // Récupérer à nouveau
      const newSnapshot = await adminDb.collection('shopProducts').where('active', '==', true).get()
      const products = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      return NextResponse.json(products)
    }

    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}
