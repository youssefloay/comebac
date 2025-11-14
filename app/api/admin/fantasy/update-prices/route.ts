import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    // Vérifier que l'utilisateur est admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - Admin uniquement' }, { status: 403 })
    }

    // Récupérer toutes les stats Fantasy
    const statsSnapshot = await adminDb.collection('player_fantasy_stats').get()

    let updatedCount = 0
    let stableCount = 0
    let noFormCount = 0

    for (const doc of statsSnapshot.docs) {
      const stats = doc.data()
      const form = stats.form || []

      if (form.length === 0) {
        noFormCount++
        continue
      }

      // Calculer la forme récente (moyenne des 5 derniers matchs)
      const recentForm = form.slice(-5)
      const avgPoints = recentForm.reduce((sum: number, points: number) => sum + points, 0) / recentForm.length

      // Calculer le changement de prix
      let priceChange = 0

      if (avgPoints > 8) {
        priceChange = 0.3
      } else if (avgPoints > 6) {
        priceChange = 0.2
      } else if (avgPoints > 4) {
        priceChange = 0.1
      } else if (avgPoints < 2) {
        priceChange = -0.3
      } else if (avgPoints < 3) {
        priceChange = -0.2
      }

      // Limiter à ±0.5M€
      priceChange = Math.max(-0.5, Math.min(0.5, priceChange))
      priceChange = Math.round(priceChange * 10) / 10

      if (priceChange !== 0) {
        const currentPrice = stats.price || 5.0
        const newPrice = Math.max(4.0, Math.min(15.0, currentPrice + priceChange))
        const actualChange = newPrice - currentPrice

        await doc.ref.update({
          price: newPrice,
          priceChange: actualChange,
          updatedAt: new Date()
        })

        updatedCount++
      } else {
        stableCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ Prix mis à jour: ${updatedCount} modifiés, ${stableCount} stables, ${noFormCount} sans forme`
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des prix:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des prix' },
      { status: 500 }
    )
  }
}
