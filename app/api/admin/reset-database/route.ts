import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log("🗑️ Suppression de toutes les données existantes...")
    
    // Supprimer tous les joueurs
    const playersSnapshot = await getDocs(collection(db, 'players'))
    const playerDeletions = playersSnapshot.docs.map(playerDoc => 
      deleteDoc(doc(db, 'players', playerDoc.id))
    )
    await Promise.all(playerDeletions)
    console.log(`✅ ${playersSnapshot.docs.length} joueurs supprimés`)
    
    // Supprimer toutes les équipes
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const teamDeletions = teamsSnapshot.docs.map(teamDoc => 
      deleteDoc(doc(db, 'teams', teamDoc.id))
    )
    await Promise.all(teamDeletions)
    console.log(`✅ ${teamsSnapshot.docs.length} équipes supprimées`)
    
    // Supprimer tous les résultats de matchs
    const resultsSnapshot = await getDocs(collection(db, 'matchResults'))
    const resultDeletions = resultsSnapshot.docs.map(resultDoc => 
      deleteDoc(doc(db, 'matchResults', resultDoc.id))
    )
    await Promise.all(resultDeletions)
    console.log(`✅ ${resultsSnapshot.docs.length} résultats supprimés`)
    
    // Supprimer tous les matchs
    const matchesSnapshot = await getDocs(collection(db, 'matches'))
    const matchDeletions = matchesSnapshot.docs.map(matchDoc => 
      deleteDoc(doc(db, 'matches', matchDoc.id))
    )
    await Promise.all(matchDeletions)
    console.log(`✅ ${matchesSnapshot.docs.length} matchs supprimés`)
    
    console.log("🎉 Base de données nettoyée avec succès!")
    
    return NextResponse.json({ 
      success: true, 
      message: "Base de données nettoyée avec succès",
      deleted: {
        players: playersSnapshot.docs.length,
        teams: teamsSnapshot.docs.length,
        results: resultsSnapshot.docs.length,
        matches: matchesSnapshot.docs.length
      }
    })
    
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error)
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 })
  }
}