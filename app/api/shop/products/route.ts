import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { DEFAULT_PRODUCTS } from '@/lib/shop-utils'

// GET - Récupérer tous les produits actifs
// Query params: ?teamId=xxx pour récupérer aussi les produits spécifiques à une équipe
export async function GET(request: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }
    
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    
    // Récupérer les produits génériques (sans teamId)
    const genericProductsSnapshot = await adminDb.collection('shopProducts')
      .where('active', '==', true)
      .get()
    
    let products: any[] = []
    
    if (genericProductsSnapshot.empty) {
      // Initialiser les produits par défaut
      const batch = adminDb.batch()
      DEFAULT_PRODUCTS.forEach((product) => {
        const docRef = adminDb.collection('shopProducts').doc()
        batch.set(docRef, { ...product, id: docRef.id })
      })
      await batch.commit()
      
      // Récupérer à nouveau
      const newSnapshot = await adminDb.collection('shopProducts').where('active', '==', true).get()
      products = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } else {
      products = genericProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
    
    // Si un teamId est fourni, récupérer aussi les produits spécifiques à cette équipe
    if (teamId) {
      const teamProductsSnapshot = await adminDb.collection('shopProducts')
        .where('active', '==', true)
        .where('teamId', '==', teamId)
        .get()
      
      const teamProducts = teamProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Remplacer les produits génériques par les produits spécifiques à l'équipe si ils existent
      // Par exemple, remplacer le maillot générique par le maillot spécifique de l'équipe
      teamProducts.forEach(teamProduct => {
        const index = products.findIndex(p => p.type === teamProduct.type && !p.teamId)
        if (index !== -1) {
          // Remplacer le produit générique par le produit spécifique
          products[index] = teamProduct
        } else {
          // Ajouter le produit spécifique seulement s'il n'existe pas déjà
          const exists = products.some(p => p.id === teamProduct.id)
          if (!exists) {
            products.push(teamProduct)
          }
        }
      })
    }
    
    // Filtrer les doublons par ID pour éviter les clés dupliquées
    const uniqueProducts = products.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    )
    
    return NextResponse.json(uniqueProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}
