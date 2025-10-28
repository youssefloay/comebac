import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore'

export async function POST() {
  try {
    // Récupérer les équipes existantes
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    if (teams.length < 2) {
      return NextResponse.json({ 
        error: 'Il faut au moins 2 équipes pour créer un match de test' 
      }, { status: 400 })
    }

    // Prendre les 2 premières équipes
    const homeTeam = teams[0]
    const awayTeam = teams[1]

    // Créer un match fictif
    const testMatch = {
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      date: Timestamp.fromDate(new Date()), // Match aujourd'hui
      status: 'scheduled', // Statut: programmé
      round: 1,
      venue: 'Stade de Test',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    // Sauvegarder le match
    const docRef = await addDoc(collection(db, 'matches'), testMatch)

    return NextResponse.json({ 
      success: true, 
      message: `Match de test créé: ${homeTeam.name} vs ${awayTeam.name}`,
      match: {
        id: docRef.id,
        ...testMatch,
        date: testMatch.date.toDate()
      }
    })
  } catch (error) {
    console.error('Error creating test match:', error)
    return NextResponse.json({ error: 'Failed to create test match' }, { status: 500 })
  }
}