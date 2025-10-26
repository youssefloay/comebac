import { collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { recalculateAllStatistics } from '../lib/statistics'

export async function resetAndRecalculateStatistics() {
  try {
    console.log('🔄 Starting complete statistics reset and recalculation...')
    
    // Step 1: Delete ALL existing team statistics
    console.log('🗑️  Deleting all existing team statistics...')
    const querySnapshot = await getDocs(collection(db, 'teamStatistics'))
    
    if (querySnapshot.docs.length > 0) {
      const batch = writeBatch(db)
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      await batch.commit()
      console.log(`✅ Deleted ${querySnapshot.docs.length} existing statistics documents`)
    } else {
      console.log('ℹ️  No existing statistics found')
    }
    
    // Step 2: Recalculate all statistics from scratch
    console.log('📊 Recalculating all statistics from match results...')
    await recalculateAllStatistics()
    
    // Step 3: Verify the results
    console.log('🔍 Verifying new statistics...')
    const newSnapshot = await getDocs(collection(db, 'teamStatistics'))
    console.log(`✅ Created ${newSnapshot.docs.length} new statistics documents`)
    
    newSnapshot.docs.forEach(doc => {
      const data = doc.data()
      console.log(`  Team ${data.teamId}: ${data.points || 0} pts (${data.wins || 0}W-${data.draws || 0}D-${data.losses || 0}L)`)
    })
    
    return {
      deletedCount: querySnapshot.docs.length,
      createdCount: newSnapshot.docs.length
    }
    
  } catch (error) {
    console.error('💥 Error during reset and recalculation:', error)
    throw error
  }
}