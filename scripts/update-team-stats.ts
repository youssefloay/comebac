import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, query, where, Timestamp } from 'firebase/firestore'

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

interface TeamStats {
  teamId: string
  teamName: string
  matchesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

async function updateTeamStatistics() {
  try {
    console.log('📊 Mise à jour des statistiques des équipes...')
    
    // Récupérer toutes les équipes
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }))
    
    console.log(`🏆 ${teams.length} équipes trouvées`)
    
    // Récupérer tous les matchs
    const matchesSnapshot = await getDocs(collection(db, 'matches'))
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Récupérer tous les résultats
    const resultsSnapshot = await getDocs(collection(db, 'matchResults'))
    const results = resultsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`⚽ ${results.length} résultats de matchs trouvés`)
    
    // Initialiser les statistiques pour chaque équipe
    const teamStats: { [key: string]: TeamStats } = {}
    
    teams.forEach(team => {
      teamStats[team.id] = {
        teamId: team.id,
        teamName: team.name,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      }
    })
    
    // Calculer les statistiques basées sur les résultats
    results.forEach(result => {
      // Trouver le match correspondant
      const match = matches.find(m => m.id === result.matchId)
      if (!match) return
      
      const homeTeamId = match.homeTeamId
      const awayTeamId = match.awayTeamId
      const homeScore = result.homeTeamScore || 0
      const awayScore = result.awayTeamScore || 0
      
      if (teamStats[homeTeamId] && teamStats[awayTeamId]) {
        // Équipe domicile
        teamStats[homeTeamId].matchesPlayed++
        teamStats[homeTeamId].goalsFor += homeScore
        teamStats[homeTeamId].goalsAgainst += awayScore
        
        // Équipe extérieur
        teamStats[awayTeamId].matchesPlayed++
        teamStats[awayTeamId].goalsFor += awayScore
        teamStats[awayTeamId].goalsAgainst += homeScore
        
        // Déterminer le résultat
        if (homeScore > awayScore) {
          // Victoire domicile
          teamStats[homeTeamId].wins++
          teamStats[homeTeamId].points += 3
          teamStats[awayTeamId].losses++
        } else if (awayScore > homeScore) {
          // Victoire extérieur
          teamStats[awayTeamId].wins++
          teamStats[awayTeamId].points += 3
          teamStats[homeTeamId].losses++
        } else {
          // Match nul
          teamStats[homeTeamId].draws++
          teamStats[homeTeamId].points += 1
          teamStats[awayTeamId].draws++
          teamStats[awayTeamId].points += 1
        }
      }
    })
    
    // Supprimer les anciennes statistiques
    const oldStatsSnapshot = await getDocs(collection(db, 'teamStatistics'))
    console.log(`🗑️ Suppression de ${oldStatsSnapshot.docs.length} anciennes statistiques`)
    
    // Sauvegarder les nouvelles statistiques
    for (const teamId in teamStats) {
      const stats = teamStats[teamId]
      
      if (stats.matchesPlayed > 0) {
        console.log(`📈 ${stats.teamName}: ${stats.matchesPlayed} matchs, ${stats.points} pts, ${stats.goalsFor}-${stats.goalsAgainst}`)
        
        await addDoc(collection(db, 'teamStatistics'), {
          ...stats,
          updatedAt: Timestamp.now()
        })
      }
    }
    
    console.log('✅ Statistiques mises à jour avec succès!')
    console.log('🏆 Le classement est maintenant à jour')
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
  }
}

// Exécuter le script
updateTeamStatistics()