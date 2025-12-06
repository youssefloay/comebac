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
    const onlyJersey = searchParams.get('onlyJersey') === 'true'
    
    let products: any[] = []
    
    // Si un teamId est fourni, récupérer UNIQUEMENT les produits spécifiques à cette équipe
    if (teamId) {
      const teamProductsSnapshot = await adminDb.collection('shopProducts')
        .where('active', '==', true)
        .where('teamId', '==', teamId)
        .get()
      
      products = teamProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Si onlyJersey est true, filtrer pour ne garder que les maillots
      if (onlyJersey) {
        products = products.filter(p => p.type === 'jersey')
      }
      
      // Si aucun produit spécifique trouvé, ne rien retourner (pas de produits génériques)
      return NextResponse.json(products)
    }
    
    // Sinon, récupérer les produits génériques (sans teamId)
    const genericProductsSnapshot = await adminDb.collection('shopProducts')
      .where('active', '==', true)
      .get()
    
    if (genericProductsSnapshot.empty) {
      // Initialiser les produits par défaut
      const batch = adminDb.batch()
      DEFAULT_PRODUCTS.forEach((product) => {
        const docRef = adminDb.collection('shopProducts').doc()
        batch.set(docRef, { ...product, id: docRef.id })
      })
      await batch.commit()
      
      // Récupérer à nouveau
      const newSnapshot = await adminDb.collection('shopProducts')
        .where('active', '==', true)
        .get()
      products = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } else {
      // Filtrer pour ne garder que les produits sans teamId (génériques)
      products = genericProductsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => !p.teamId)
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
