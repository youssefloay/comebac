// Simple script to check for duplicate team statistics
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

const firebaseConfig = {
  // Add your config here - we'll use the existing one from the app
}

// For now, let's create a simple function to check duplicates
export async function checkDuplicateTeamStats() {
  try {
    const db = getFirestore()
    const querySnapshot = await getDocs(collection(db, 'teamStatistics'))
    
    const teamCounts = {}
    const allStats = []
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data()
      const teamId = data.teamId
      
      if (!teamCounts[teamId]) {
        teamCounts[teamId] = 0
      }
      teamCounts[teamId]++
      
      allStats.push({
        id: doc.id,
        teamId: data.teamId,
        points: data.points || 0,
        wins: data.wins || 0,
        draws: data.draws || 0,
        losses: data.losses || 0
      })
    })
    
    console.log('Team Statistics Count:', Object.keys(teamCounts).length)
    console.log('Total Documents:', querySnapshot.docs.length)
    console.log('Teams with duplicates:')
    
    Object.entries(teamCounts).forEach(([teamId, count]) => {
      if (count > 1) {
        console.log(`Team ${teamId}: ${count} entries`)
        const teamStats = allStats.filter(s => s.teamId === teamId)
        teamStats.forEach(stat => {
          console.log(`  - Doc ID: ${stat.id}, Points: ${stat.points}, W:${stat.wins} D:${stat.draws} L:${stat.losses}`)
        })
      }
    })
    
    return { teamCounts, allStats }
  } catch (error) {
    console.error('Error checking duplicates:', error)
    throw error
  }
}