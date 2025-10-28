import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

export async function DELETE() {
  try {
    // Supprimer tous les joueurs
    const playersSnapshot = await getDocs(collection(db, 'players'))
    const playerDeletePromises = playersSnapshot.docs.map(playerDoc => 
      deleteDoc(doc(db, 'players', playerDoc.id))
    )
    await Promise.all(playerDeletePromises)

    // Supprimer toutes les équipes
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const teamDeletePromises = teamsSnapshot.docs.map(teamDoc => 
      deleteDoc(doc(db, 'teams', teamDoc.id))
    )
    await Promise.all(teamDeletePromises)

    // Supprimer tous les matchs
    const matchesSnapshot = await getDocs(collection(db, 'matches'))
    const matchDeletePromises = matchesSnapshot.docs.map(matchDoc => 
      deleteDoc(doc(db, 'matches', matchDoc.id))
    )
    await Promise.all(matchDeletePromises)

    return NextResponse.json({ 
      success: true, 
      message: `Supprimé ${playersSnapshot.docs.length} joueurs, ${teamsSnapshot.docs.length} équipes, et ${matchesSnapshot.docs.length} matchs`
    })
  } catch (error) {
    console.error('Error clearing data:', error)
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 })
  }
}