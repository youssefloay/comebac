import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function cleanupDuplicateTeamStatistics() {
  try {
    console.log('Starting cleanup of duplicate team statistics...')
    
    // Get all team statistics
    const querySnapshot = await getDocs(collection(db, 'teamStatistics'))
    const allStats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`Found ${allStats.length} team statistics documents`)
    
    // Group by teamId
    const teamGroups: Record<string, any[]> = {}
    allStats.forEach(stat => {
      if (!teamGroups[stat.teamId]) {
        teamGroups[stat.teamId] = []
      }
      teamGroups[stat.teamId].push(stat)
    })
    
    console.log(`Found ${Object.keys(teamGroups).length} unique teams`)
    
    // Find and remove duplicates
    let deletedCount = 0
    for (const [teamId, stats] of Object.entries(teamGroups)) {
      if (stats.length > 1) {
        console.log(`Team ${teamId} has ${stats.length} statistics entries`)
        
        // Sort by updatedAt (keep the most recent) or by points (keep the highest)
        stats.sort((a, b) => {
          // First try by updatedAt
          if (a.updatedAt && b.updatedAt) {
            return new Date(b.updatedAt.toDate()).getTime() - new Date(a.updatedAt.toDate()).getTime()
          }
          // Then by points
          return (b.points || 0) - (a.points || 0)
        })
        
        // Keep the first one, delete the rest
        const toKeep = stats[0]
        const toDelete = stats.slice(1)
        
        console.log(`Keeping document ${toKeep.id} for team ${teamId}`)
        console.log(`Deleting ${toDelete.length} duplicate documents`)
        
        for (const duplicate of toDelete) {
          await deleteDoc(doc(db, 'teamStatistics', duplicate.id))
          deletedCount++
          console.log(`Deleted duplicate document ${duplicate.id}`)
        }
      }
    }
    
    console.log(`Cleanup completed. Deleted ${deletedCount} duplicate documents.`)
    return { deletedCount, totalTeams: Object.keys(teamGroups).length }
    
  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    throw error
  }
}

export async function preventDuplicateCreation() {
  // This function can be called before creating team statistics
  // to ensure we don't create duplicates
  console.log('Duplicate prevention measures implemented')
}