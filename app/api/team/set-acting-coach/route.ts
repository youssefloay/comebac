import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { teamId, playerId } = await request.json()

    if (!teamId || !playerId) {
      return NextResponse.json(
        { error: 'teamId et playerId sont requis' },
        { status: 400 }
      )
    }

    // 1. Vérifier que l'équipe n'a pas déjà un coach
    const coachAccountsQuery = query(
      collection(db, 'coachAccounts'),
      where('teamId', '==', teamId)
    )
    const coachAccountsSnap = await getDocs(coachAccountsQuery)
    
    if (!coachAccountsSnap.empty) {
      return NextResponse.json(
        { error: 'Cette équipe a déjà un coach' },
        { status: 400 }
      )
    }

    // 2. Retirer le statut de coach intérimaire de tous les autres joueurs de l'équipe
    const allPlayersQuery = query(
      collection(db, 'playerAccounts'),
      where('teamId', '==', teamId),
      where('isActingCoach', '==', true)
    )
    const allPlayersSnap = await getDocs(allPlayersQuery)
    
    const removePromises = allPlayersSnap.docs.map(doc => 
      updateDoc(doc.ref, {
        isActingCoach: false,
        actingCoachUntil: new Date()
      })
    )
    await Promise.all(removePromises)

    // 3. Activer le statut de coach intérimaire pour le joueur choisi
    const playerDocRef = doc(db, 'playerAccounts', playerId)
    const playerDocSnap = await getDoc(playerDocRef)
    
    if (!playerDocSnap.exists()) {
      return NextResponse.json(
        { error: 'Joueur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le joueur appartient bien à l'équipe
    const playerData = playerDocSnap.data()
    if (playerData.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Le joueur n\'appartient pas à cette équipe' },
        { status: 400 }
      )
    }

    await updateDoc(playerDocRef, {
      isActingCoach: true,
      actingCoachSince: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Coach intérimaire activé avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de l\'activation du coach intérimaire:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

