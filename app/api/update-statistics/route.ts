import { NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, query, where, deleteDoc, Timestamp } from 'firebase/firestore'

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

export async function POST() {
  try {
    // Récupérer toutes les équipes
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }))
    
    if (teams.length === 0) {
      return NextResponse.json({ error: 'Aucune équipe trouvée.' }, { status: 400 })
    }
    
    // Récupérer tous les matchs
    const matchesSnapshot = await getDocs(collection(db, 'matches'))
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]
    
    // Récupérer tous les résultats
    const resultsSnapshot = await getDocs(collection(db, 'matchResults'))
    const results = resultsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    if (results.length === 0) {
      return NextResponse.json({ error: 'Aucun résultat de match trouvé. Générez d\'abord des résultats.' }, { status: 400 })
    }
    
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
    results.forEach((result: any) => {
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
    const deletePromises = oldStatsSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
    
    // Sauvegarder les nouvelles statistiques
    let statsCreated = 0
    for (const teamId in teamStats) {
      const stats = teamStats[teamId]
      
      if (stats.matchesPlayed > 0) {
        await addDoc(collection(db, 'teamStatistics'), {
          ...stats,
          updatedAt: Timestamp.now()
        })
        statsCreated++
      }
    }
    
    // Calculer quelques statistiques pour le retour
    const totalGoals = Object.values(teamStats).reduce((sum, team) => sum + team.goalsFor, 0)
    const totalMatches = results.length
    
    return NextResponse.json({ 
      message: `Statistiques mises à jour avec succès!`,
      details: {
        teamsUpdated: statsCreated,
        totalMatches: totalMatches,
        totalGoals: totalGoals,
        oldStatsDeleted: oldStatsSnapshot.docs.length
      }
    })
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour des statistiques: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
    }, { status: 500 })
  }
}