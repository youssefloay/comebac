import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, deleteDoc, writeBatch, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { recalculateAllStatistics } from '@/lib/statistics'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 FORCE CLEANUP: Starting complete database cleanup...')
    
    // Step 1: Get all current statistics
    const querySnapshot = await getDocs(collection(db, 'teamStatistics'))
    const allStats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      docRef: doc.ref,
      ...doc.data()
    }))
    
    console.log(`📊 Found ${allStats.length} team statistics documents`)
    
    // Step 2: Delete ALL existing statistics
    console.log('🗑️ Deleting ALL existing team statistics...')
    const batch = writeBatch(db)
    
    allStats.forEach(stat => {
      batch.delete(stat.docRef)
    })
    
    await batch.commit()
    console.log(`✅ Deleted ${allStats.length} statistics documents`)
    
    // Step 3: Recalculate all statistics from scratch
    console.log('📊 Recalculating all statistics from match results...')
    await recalculateAllStatistics()
    
    // Step 4: Verify the results
    console.log('🔍 Verifying new statistics...')
    const newSnapshot = await getDocs(collection(db, 'teamStatistics'))
    const newStats = newSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        teamId: data.teamId,
        points: data.points || 0,
        wins: data.wins || 0,
        draws: data.draws || 0,
        losses: data.losses || 0,
        goalsFor: data.goalsFor || 0,
        goalsAgainst: data.goalsAgainst || 0,
        matchesPlayed: data.matchesPlayed || 0,
        ...data
      }
    })
    
    console.log(`✅ Created ${newStats.length} new statistics documents`)
    
    // Group by teamId to check for any remaining duplicates
    const teamGroups: Record<string, any[]> = {}
    newStats.forEach(stat => {
      if (!teamGroups[stat.teamId]) {
        teamGroups[stat.teamId] = []
      }
      teamGroups[stat.teamId].push(stat)
    })
    
    const duplicatesFound = Object.values(teamGroups).some(group => group.length > 1)
    
    return NextResponse.json({
      success: true,
      message: 'Force cleanup completed successfully',
      stats: {
        deletedCount: allStats.length,
        createdCount: newStats.length,
        uniqueTeams: Object.keys(teamGroups).length,
        duplicatesRemaining: duplicatesFound
      },
      teamStats: newStats.map(stat => ({
        teamId: stat.teamId,
        points: stat.points,
        wins: stat.wins,
        draws: stat.draws,
        losses: stat.losses
      }))
    })
    
  } catch (error) {
    console.error('💥 FORCE CLEANUP Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform force cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}