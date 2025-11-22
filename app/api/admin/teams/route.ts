import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp, query, where } from 'firebase/firestore'

export async function GET() {
  try {
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const teamsData = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Charger tous les coaches depuis coachAccounts
    const coachesSnapshot = await getDocs(collection(db, 'coachAccounts'))
    const coachesMap = new Map<string, any>()
    coachesSnapshot.docs.forEach(coachDoc => {
      const coachData = coachDoc.data()
      if (coachData.teamId) {
        coachesMap.set(coachData.teamId, {
          firstName: coachData.firstName || '',
          lastName: coachData.lastName || '',
          birthDate: coachData.birthDate || '',
          email: coachData.email || '',
          phone: coachData.phone || ''
        })
      }
    })
    
    // Enrichir les équipes avec les données du coach si manquantes
    const teams = teamsData.map(team => {
      const teamData = team as any
      
      // Si le coach n'est pas rempli dans teams, chercher dans coachAccounts
      if (!teamData.coach || !teamData.coach.firstName || !teamData.coach.lastName) {
        const coachFromAccounts = coachesMap.get(teamData.id)
        if (coachFromAccounts) {
          return {
            ...teamData,
            coach: coachFromAccounts
          }
        }
      }
      
      return teamData
    })
    
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const teamData = await request.json()
    
    const docRef = await addDoc(collection(db, 'teams'), {
      ...teamData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({ id: docRef.id, ...teamData })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...teamData } = await request.json()
    
    await updateDoc(doc(db, 'teams', id), {
      ...teamData,
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({ id, ...teamData })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }
    
    // Suppression en cascade
    console.log(`Suppression de l'équipe ${id} et de toutes ses données associées...`)
    
    // 1. Supprimer tous les joueurs de l'équipe
    const playersSnapshot = await getDocs(collection(db, 'players'))
    const playerDeletions = playersSnapshot.docs
      .filter(doc => doc.data().teamId === id)
      .map(doc => deleteDoc(doc.ref))
    await Promise.all(playerDeletions)
    console.log(`${playerDeletions.length} joueurs supprimés`)
    
    // 2. Supprimer les statistiques de l'équipe
    const statsSnapshot = await getDocs(collection(db, 'teamStatistics'))
    const statsDeletions = statsSnapshot.docs
      .filter(doc => doc.data().teamId === id)
      .map(doc => deleteDoc(doc.ref))
    await Promise.all(statsDeletions)
    console.log(`${statsDeletions.length} statistiques supprimées`)
    
    // 3. Supprimer les matchs où l'équipe participe
    const matchesSnapshot = await getDocs(collection(db, 'matches'))
    const matchDeletions = matchesSnapshot.docs
      .filter(doc => {
        const data = doc.data()
        return data.homeTeamId === id || data.awayTeamId === id
      })
      .map(doc => deleteDoc(doc.ref))
    await Promise.all(matchDeletions)
    console.log(`${matchDeletions.length} matchs supprimés`)
    
    // 4. Supprimer les résultats de matchs associés
    const resultsSnapshot = await getDocs(collection(db, 'matchResults'))
    const resultDeletions = resultsSnapshot.docs
      .filter(doc => {
        const data = doc.data()
        return data.homeTeamId === id || data.awayTeamId === id
      })
      .map(doc => deleteDoc(doc.ref))
    await Promise.all(resultDeletions)
    console.log(`${resultDeletions.length} résultats supprimés`)
    
    // 5. Supprimer l'équipe elle-même
    await deleteDoc(doc(db, 'teams', id))
    console.log(`Équipe ${id} supprimée avec succès`)
    
    return NextResponse.json({ 
      success: true,
      deleted: {
        players: playerDeletions.length,
        statistics: statsDeletions.length,
        matches: matchDeletions.length,
        results: resultDeletions.length
      }
    })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}