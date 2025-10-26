import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function directCleanupDuplicates() {
  try {
    console.log('🧹 Starting direct cleanup of duplicate team statistics...')
    
    // Get all team statistics
    const querySnapshot = await getDocs(collection(db, 'teamStatistics'))
    const allStats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      docRef: doc.ref,
      ...doc.data()
    }))
    
    console.log(`📊 Found ${allStats.length} team statistics documents`)
    
    // Group by teamId
    const teamGroups: Record<string, any[]> = {}
    allStats.forEach(stat => {
      if (!teamGroups[stat.teamId]) {
        teamGroups[stat.teamId] = []
      }
      teamGroups[stat.teamId].push(stat)
    })
    
    console.log(`🏆 Found ${Object.keys(teamGroups).length} unique teams`)
    
    // Use batch operations for better performance
    const batch = writeBatch(db)
    let deletedCount = 0
    
    // Find and mark duplicates for deletion
    for (const [teamId, stats] of Object.entries(teamGroups)) {
      if (stats.length > 1) {
        console.log(`⚠️  Team ${teamId} has ${stats.length} statistics entries`)
        
        // Sort by updatedAt (keep the most recent) or by points (keep the highest)
        stats.sort((a, b) => {
          // First try by updatedAt
          if (a.updatedAt && b.updatedAt) {
            const aTime = a.updatedAt.toDate ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt).getTime()
            const bTime = b.updatedAt.toDate ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt).getTime()
            return bTime - aTime
          }
          // Then by points
          return (b.points || 0) - (a.points || 0)
        })
        
        // Keep the first one, delete the rest
        const toKeep = stats[0]
        const toDelete = stats.slice(1)
        
        console.log(`✅ Keeping document ${toKeep.id} for team ${teamId} (Points: ${toKeep.points || 0})`)
        
        for (const duplicate of toDelete) {
          batch.delete(duplicate.docRef)
          deletedCount++
          console.log(`❌ Marking duplicate document ${duplicate.id} for deletion (Points: ${duplicate.points || 0})`)
        }
      }
    }
    
    // Execute batch deletion
    if (deletedCount > 0) {
      await batch.commit()
      console.log(`🎉 Cleanup completed! Deleted ${deletedCount} duplicate documents.`)
    } else {
      console.log('✨ No duplicates found!')
    }
    
    return { 
      deletedCount, 
      totalTeams: Object.keys(teamGroups).length,
      originalCount: allStats.length
    }
    
  } catch (error) {
    console.error('💥 Error during cleanup:', error)
    throw error
  }
}

export async function showCurrentStats() {
  try {
    const querySnapshot = await getDocs(collection(db, 'teamStatistics'))
    const allStats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      teamId: doc.data().teamId,
      points: doc.data().points || 0,
      wins: doc.data().wins || 0,
      draws: doc.data().draws || 0,
      losses: doc.data().losses || 0
    }))
    
    console.log('📋 Current team statistics:')
    allStats.forEach(stat => {
      console.log(`  Team ${stat.teamId}: ${stat.points} pts (${stat.wins}W-${stat.draws}D-${stat.losses}L) [Doc: ${stat.id}]`)
    })
    
    return allStats
  } catch (error) {
    console.error('Error showing stats:', error)
    throw error
  }
}