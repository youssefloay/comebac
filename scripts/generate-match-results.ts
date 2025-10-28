import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore'

// Configuration Firebase (utilise les mêmes variables d'environnement)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Données de test pour les résultats
const sampleResults = [
  {
    matchId: '', // À remplir avec l'ID du match
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
    matchId: '', // À remplir avec l'ID du match
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
    matchId: '', // À remplir avec l'ID du match
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
  }
]

async function generateMatchResults() {
  try {
    console.log('🚀 Génération des résultats de matchs...')
    
    // Récupérer tous les matchs
    const matchesSnapshot = await getDocs(collection(db, 'matches'))
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`📊 ${matches.length} matchs trouvés`)
    
    // Vérifier quels matchs ont déjà des résultats
    const resultsSnapshot = await getDocs(collection(db, 'matchResults'))
    const existingResults = resultsSnapshot.docs.map(doc => doc.data().matchId)
    
    console.log(`✅ ${existingResults.length} résultats existants`)
    
    // Prendre les premiers matchs sans résultats
    const matchesWithoutResults = matches.filter(match => !existingResults.includes(match.id))
    
    if (matchesWithoutResults.length === 0) {
      console.log('⚠️ Tous les matchs ont déjà des résultats')
      return
    }
    
    console.log(`🎯 ${matchesWithoutResults.length} matchs sans résultats trouvés`)
    
    // Générer des résultats pour les 3 premiers matchs
    const matchesToProcess = matchesWithoutResults.slice(0, Math.min(3, sampleResults.length))
    
    for (let i = 0; i < matchesToProcess.length; i++) {
      const match = matchesToProcess[i]
      const result = { ...sampleResults[i] }
      result.matchId = match.id
      
      console.log(`📝 Création du résultat pour le match ${match.id}`)
      console.log(`   Score: ${result.homeTeamScore} - ${result.awayTeamScore}`)
      console.log(`   Buts domicile: ${result.homeTeamGoalScorers.length}`)
      console.log(`   Buts extérieur: ${result.awayTeamGoalScorers.length}`)
      
      // Ajouter le résultat à Firestore
      await addDoc(collection(db, 'matchResults'), {
        ...result,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      
      console.log(`✅ Résultat créé pour le match ${match.id}`)
    }
    
    console.log('🎉 Génération terminée avec succès!')
    console.log('💡 Vous pouvez maintenant tester:')
    console.log('   - Les cartes de match avec popup')
    console.log('   - Les statistiques des équipes')
    console.log('   - Le classement mis à jour')
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error)
  }
}

// Exécuter le script
generateMatchResults()