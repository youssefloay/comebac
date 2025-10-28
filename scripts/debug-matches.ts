import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

// Configuration Firebase
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

async function debugMatches() {
  try {
    console.log('🔍 Débogage des matchs et résultats...')
    console.log('')
    
    // Récupérer tous les matchs
    const matchesSnapshot = await getDocs(collection(db, 'matches'))
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`📅 ${matches.length} matchs trouvés:`)
    matches.forEach((match: any) => {
      console.log(`  - Match ${match.id}: ${match.status || 'pas de statut'} (${match.date?.toDate?.()?.toLocaleDateString() || 'pas de date'})`)
    })
    console.log('')
    
    // Récupérer tous les résultats
    const resultsSnapshot = await getDocs(collection(db, 'matchResults'))
    const results = resultsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`🏆 ${results.length} résultats trouvés:`)
    results.forEach((result: any) => {
      console.log(`  - Résultat ${result.id}: Match ${result.matchId} → ${result.homeTeamScore}-${result.awayTeamScore}`)
    })
    console.log('')
    
    // Vérifier la correspondance
    const matchesWithResults = matches.filter((match: any) => 
      results.some((result: any) => result.matchId === match.id)
    )
    
    console.log(`✅ ${matchesWithResults.length} matchs avec résultats:`)
    matchesWithResults.forEach((match: any) => {
      const result = results.find((r: any) => r.matchId === match.id)
      console.log(`  - Match ${match.id}: ${match.status} → ${result?.homeTeamScore}-${result?.awayTeamScore}`)
    })
    console.log('')
    
    // Récupérer les équipes pour les noms
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }))
    
    console.log(`👥 ${teams.length} équipes trouvées:`)
    teams.forEach(team => {
      console.log(`  - ${team.id}: ${team.name}`)
    })
    console.log('')
    
    // Afficher les matchs complets avec noms d'équipes
    console.log('🎯 Matchs détaillés:')
    matchesWithResults.forEach((match: any) => {
      const homeTeam = teams.find(t => t.id === match.homeTeamId)
      const awayTeam = teams.find(t => t.id === match.awayTeamId)
      const result = results.find((r: any) => r.matchId === match.id)
      
      console.log(`  📊 ${homeTeam?.name || 'Équipe inconnue'} vs ${awayTeam?.name || 'Équipe inconnue'}`)
      console.log(`     Statut: ${match.status}`)
      console.log(`     Score: ${result?.homeTeamScore}-${result?.awayTeamScore}`)
      console.log(`     Date: ${match.date?.toDate?.()?.toLocaleDateString() || 'pas de date'}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error)
  }
}

debugMatches()