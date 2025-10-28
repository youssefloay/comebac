import { NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, Timestamp } from 'firebase/firestore'

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialiser Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

// Données de test pour les résultats
const sampleResults = [
  {
    homeTeamScore: 2,
    awayTeamScore: 1,
    homeTeamGoalScorers: [
      { playerName: 'Ahmed El-Masry', assists: 'Omar Hassan' },
      { playerName: 'Karim Farouk', assists: '' }
    ],
    awayTeamGoalScorers: [
      { playerName: 'Jean-Baptiste Dubois', assists: 'Pierre Martin' }
    ],
    homeTeamYellowCards: [
      { playerName: 'Mohamed Ali' }
    ],
    awayTeamYellowCards: [
      { playerName: 'Lucas Moreau' }
    ],
    homeTeamRedCards: [],
    awayTeamRedCards: []
  },
  {
    homeTeamScore: 0,
    awayTeamScore: 3,
    homeTeamGoalScorers: [],
    awayTeamGoalScorers: [
      { playerName: 'Antoine Lefebvre', assists: 'Thomas Bernard' },
      { playerName: 'Nicolas Petit', assists: '' },
      { playerName: 'Antoine Lefebvre', assists: 'Julien Roux' }
    ],
    homeTeamYellowCards: [
      { playerName: 'Youssef Ibrahim' },
      { playerName: 'Hassan Mahmoud' }
    ],
    awayTeamYellowCards: [],
    homeTeamRedCards: [
      { playerName: 'Mahmoud Saeed' }
    ],
    awayTeamRedCards: []
  },
  {
    homeTeamScore: 1,
    awayTeamScore: 1,
    homeTeamGoalScorers: [
      { playerName: 'Amr Khaled', assists: 'Tamer Hosny' }
    ],
    awayTeamGoalScorers: [
      { playerName: 'Maxime Durand', assists: '' }
    ],
    homeTeamYellowCards: [],
    awayTeamYellowCards: [
      { playerName: 'Gabriel Leroy' },
      { playerName: 'Raphael Simon' }
    ],
    homeTeamRedCards: [],
    awayTeamRedCards: []
  },
  {
    homeTeamScore: 4,
    awayTeamScore: 0,
    homeTeamGoalScorers: [
      { playerName: 'Sami Youssef', assists: 'Nour Eddine' },
      { playerName: 'Sami Youssef', assists: '' },
      { playerName: 'Tarek Mansour', assists: 'Sami Youssef' },
      { playerName: 'Nour Eddine', assists: 'Tarek Mansour' }
    ],
    awayTeamGoalScorers: [],
    homeTeamYellowCards: [],
    awayTeamYellowCards: [
      { playerName: 'Clément Rousseau' }
    ],
    homeTeamRedCards: [],
    awayTeamRedCards: []
  },
  {
    homeTeamScore: 2,
    awayTeamScore: 2,
    homeTeamGoalScorers: [
      { playerName: 'Rami Farid', assists: 'Hossam Kamal' },
      { playerName: 'Hossam Kamal', assists: '' }
    ],
    awayTeamGoalScorers: [
      { playerName: 'Adrien Blanc', assists: 'Fabien Girard' },
      { playerName: 'Fabien Girard', assists: 'Adrien Blanc' }
    ],
    homeTeamYellowCards: [
      { playerName: 'Rami Farid' }
    ],
    awayTeamYellowCards: [
      { playerName: 'Adrien Blanc' }
    ],
    homeTeamRedCards: [],
    awayTeamRedCards: []
  }
]

export async function POST() {
  try {
    // Récupérer tous les matchs
    const matchesSnapshot = await getDocs(collection(db, 'matches'))
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    if (matches.length === 0) {
      return NextResponse.json({ error: 'Aucun match trouvé. Créez d\'abord des matchs.' }, { status: 400 })
    }
    
    // Vérifier quels matchs ont déjà des résultats
    const resultsSnapshot = await getDocs(collection(db, 'matchResults'))
    const existingResults = resultsSnapshot.docs.map(doc => doc.data().matchId)
    
    // Prendre les matchs sans résultats
    const matchesWithoutResults = matches.filter(match => !existingResults.includes(match.id))
    
    if (matchesWithoutResults.length === 0) {
      return NextResponse.json({ error: 'Tous les matchs ont déjà des résultats.' }, { status: 400 })
    }
    
    // Générer des résultats pour les matchs
    const matchesToProcess = matchesWithoutResults.slice(0, Math.min(matchesWithoutResults.length, sampleResults.length))
    let resultsCreated = 0
    
    for (let i = 0; i < matchesToProcess.length; i++) {
      const match = matchesToProcess[i]
      const result = { ...sampleResults[i % sampleResults.length] }
      
      // Ajouter le résultat à Firestore
      await addDoc(collection(db, 'matchResults'), {
        matchId: match.id,
        ...result,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      
      resultsCreated++
    }
    
    return NextResponse.json({ 
      message: `${resultsCreated} résultats de matchs générés avec succès!`,
      details: {
        totalMatches: matches.length,
        existingResults: existingResults.length,
        newResults: resultsCreated
      }
    })
    
  } catch (error) {
    console.error('Erreur lors de la génération des résultats:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la génération des résultats: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
    }, { status: 500 })
  }
}