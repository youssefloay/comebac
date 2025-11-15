import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { teamId, player, isCoach } = await request.json()

    if (!teamId || !player) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que l'équipe existe
    const teamDoc = await getDoc(doc(db, 'teams', teamId))
    if (!teamDoc.exists()) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 })
    }

    const teamData = teamDoc.data()

    // 1. Ajouter dans la collection players
    await addDoc(collection(db, 'players'), {
      name: `${player.firstName} ${player.lastName}`,
      number: isCoach ? 0 : player.jerseyNumber,
      position: isCoach ? 'Entraîneur' : player.position,
      teamId: teamId,
      nationality: 'Égypte',
      isCaptain: false,
      isCoach: isCoach || false,
      email: player.email,
      phone: player.phone,
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname || '',
      birthDate: player.birthDate || '',
      height: player.height || 0,
      tshirtSize: player.tshirtSize || 'M',
      strongFoot: player.foot === 'Droitier' ? 'Droit' : player.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
      overall: isCoach ? 0 : 75,
      seasonStats: {
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // 2. Créer le compte et envoyer l'email
    if (isCoach) {
      // Créer compte coach
      const coachQuery = query(
        collection(db, 'coachAccounts'),
        where('email', '==', player.email)
      )
      const coachSnap = await getDocs(coachQuery)

      if (coachSnap.empty) {
        await addDoc(collection(db, 'coachAccounts'), {
          email: player.email,
          firstName: player.firstName,
          lastName: player.lastName,
          phone: player.phone || '',
          birthDate: player.birthDate || '',
          teamId: teamId,
          teamName: teamData.name,
          photo: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        // Envoyer email coach
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/create-coach-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: player.email,
            firstName: player.firstName,
            lastName: player.lastName,
            teamName: teamData.name
          })
        })
      }
    } else {
      // Créer compte joueur
      const playerQuery = query(
        collection(db, 'playerAccounts'),
        where('email', '==', player.email)
      )
      const playerSnap = await getDocs(playerQuery)

      if (playerSnap.empty) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/create-player-accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId: teamId,
            players: [player]
          })
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${isCoach ? 'Entraîneur' : 'Joueur'} ajouté avec succès et email envoyé!` 
    })

  } catch (error: any) {
    console.error('Erreur ajout joueur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
