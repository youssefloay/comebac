import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 API: Starting duplicate cleanup...')
    
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
    const duplicateInfo: any[] = []
    
    // Find and mark duplicates for deletion
    for (const [teamId, stats] of Object.entries(teamGroups)) {
      if (stats.length > 1) {
        console.log(`⚠️  Team ${teamId} has ${stats.length} statistics entries`)
        
        // Sort by points (desc) then by updatedAt (desc)
        stats.sort((a, b) => {
          if ((b.points || 0) !== (a.points || 0)) {
            return (b.points || 0) - (a.points || 0)
          }
          // Then by updatedAt
          if (a.updatedAt && b.updatedAt) {
            const aTime = a.updatedAt.toDate ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt).getTime()
            const bTime = b.updatedAt.toDate ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt).getTime()
            return bTime - aTime
          }
          return 0
        })
        
        // Keep the first one, delete the rest
        const toKeep = stats[0]
        const toDelete = stats.slice(1)
        
        duplicateInfo.push({
          teamId,
          totalEntries: stats.length,
          kept: {
            id: toKeep.id,
            points: toKeep.points || 0,
            wins: toKeep.wins || 0,
            draws: toKeep.draws || 0,
            losses: toKeep.losses || 0
          },
          deleted: toDelete.map(d => ({
            id: d.id,
            points: d.points || 0,
            wins: d.wins || 0,
            draws: d.draws || 0,
            losses: d.losses || 0
          }))
        })
        
        for (const duplicate of toDelete) {
          batch.delete(duplicate.docRef)
          deletedCount++
        }
      }
    }
    
    // Execute batch deletion
    if (deletedCount > 0) {
      await batch.commit()
      console.log(`🎉 Cleanup completed! Deleted ${deletedCount} duplicate documents.`)
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      stats: {
        originalCount: allStats.length,
        uniqueTeams: Object.keys(teamGroups).length,
        deletedCount,
        finalCount: allStats.length - deletedCount
      },
      duplicateInfo
    })
    
  } catch (error) {
    console.error('💥 API Error during cleanup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup duplicates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}