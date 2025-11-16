import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    console.log(`🔍 Recherche du joueur avec l'email: ${email}`)

    // Trouver le joueur dans la collection players
    const playersQuery = query(
      collection(db, 'players'),
      where('email', '==', email)
    )
    const playersSnap = await getDocs(playersQuery)

    if (playersSnap.empty) {
      return NextResponse.json({ 
        error: `Aucun joueur trouvé avec l'email ${email}` 
      }, { status: 404 })
    }

    const playerDoc = playersSnap.docs[0]
    const player = playerDoc.data()

    console.log(`✅ Joueur trouvé: ${player.firstName} ${player.lastName}`)

    // Vérifier si le compte existe déjà
    const accountQuery = query(
      collection(db, 'playerAccounts'),
      where('email', '==', email)
    )
    const accountSnap = await getDocs(accountQuery)

    if (!accountSnap.empty) {
      return NextResponse.json({ 
        error: 'Ce joueur a déjà un compte' 
      }, { status: 400 })
    }

    // Créer le compte
    console.log(`📝 Création du compte pour ${player.firstName} ${player.lastName}...`)

    const playerData = {
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname || '',
      email: player.email,
      phone: player.phone,
      position: player.position,
      jerseyNumber: player.number,
      birthDate: player.birthDate || '',
      height: player.height || 0,
      tshirtSize: player.tshirtSize || 'M',
      foot: player.strongFoot === 'Droit' ? 'Droitier' : player.strongFoot === 'Gauche' ? 'Gaucher' : 'Ambidextre'
    }

    const response = await fetch(`${request.nextUrl.origin}/api/admin/create-player-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: player.teamId,
        players: [playerData]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Erreur création compte:', error)
      return NextResponse.json({ 
        error: `Erreur création compte: ${error.error}` 
      }, { status: 500 })
    }

    console.log(`✅ Compte créé et email envoyé à ${email}`)

    return NextResponse.json({ 
      success: true, 
      message: `Compte créé avec succès pour ${player.firstName} ${player.lastName} et email envoyé!` 
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
