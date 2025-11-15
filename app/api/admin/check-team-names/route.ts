import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    // Charger les équipes
    const teamsSnap = await getDocs(collection(db, 'teams'))
    const teams = teamsSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }))

    // Charger les inscriptions
    const registrationsSnap = await getDocs(collection(db, 'teamRegistrations'))
    const registrations = registrationsSnap.docs.map(doc => ({
      id: doc.id,
      teamName: doc.data().teamName,
      status: doc.data().status
    }))

    // Charger quelques joueurs
    const playersSnap = await getDocs(collection(db, 'players'))
    const players = playersSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      teamName: doc.data().teamName,
      teamId: doc.data().teamId
    }))

    // Charger quelques comptes joueurs
    const playerAccountsSnap = await getDocs(collection(db, 'playerAccounts'))
    const playerAccounts = playerAccountsSnap.docs.map(doc => ({
      id: doc.id,
      firstName: doc.data().firstName,
      lastName: doc.data().lastName,
      teamName: doc.data().teamName,
      teamId: doc.data().teamId
    }))

    return NextResponse.json({
      success: true,
      teams,
      registrations,
      players,
      playerAccounts
    })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
