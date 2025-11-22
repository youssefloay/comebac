import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

// GET - Récupérer les équipes favorites de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    // Limiter à 200 favoris pour éviter le quota
    const favoritesSnapshot = await adminDb
      .collection('userFavorites')
      .where('userId', '==', userId)
      .limit(200)
      .get()
    
    const favorites = favoritesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ success: true, favorites })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ success: true, favorites: [] })
  }
}

// POST - Ajouter une équipe ou un joueur aux favoris
export async function POST(request: NextRequest) {
  try {
    const { userId, teamId, playerId, name, type } = await request.json()

    if (!userId || (!teamId && !playerId)) {
      return NextResponse.json({ error: 'userId et (teamId ou playerId) requis' }, { status: 400 })
    }

    const favoriteType = type || (teamId ? 'team' : 'player')
    const itemId = teamId || playerId

    // Vérifier si déjà en favoris
    const existingSnapshot = await adminDb
      .collection('userFavorites')
      .where('userId', '==', userId)
      .where('itemId', '==', itemId)
      .where('type', '==', favoriteType)
      .get()

    if (!existingSnapshot.empty) {
      return NextResponse.json({ error: 'Déjà en favoris' }, { status: 400 })
    }

    // Ajouter aux favoris
    const docRef = await adminDb.collection('userFavorites').add({
      userId,
      itemId,
      type: favoriteType,
      name: name || '',
      // Garder la compatibilité avec l'ancien format
      ...(teamId && { teamId, teamName: name }),
      ...(playerId && { playerId, playerName: name }),
      createdAt: Timestamp.now()
    })

    return NextResponse.json({ 
      success: true, 
      message: `${favoriteType === 'team' ? 'Équipe' : 'Joueur'} ajouté${favoriteType === 'team' ? 'e' : ''} aux favoris`,
      favoriteId: docRef.id
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Retirer une équipe ou un joueur des favoris
export async function DELETE(request: NextRequest) {
  try {
    const { userId, teamId, playerId, type } = await request.json()

    if (!userId || (!teamId && !playerId)) {
      return NextResponse.json({ error: 'userId et (teamId ou playerId) requis' }, { status: 400 })
    }

    const favoriteType = type || (teamId ? 'team' : 'player')
    const itemId = teamId || playerId

    // Trouver et supprimer
    const snapshot = await adminDb
      .collection('userFavorites')
      .where('userId', '==', userId)
      .where('itemId', '==', itemId)
      .where('type', '==', favoriteType)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Favori non trouvé' }, { status: 404 })
    }

    // Supprimer tous les documents trouvés
    const batch = adminDb.batch()
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    return NextResponse.json({ 
      success: true, 
      message: `${favoriteType === 'team' ? 'Équipe' : 'Joueur'} retiré${favoriteType === 'team' ? 'e' : ''} des favoris`
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
