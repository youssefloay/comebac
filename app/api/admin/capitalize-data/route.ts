import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'

function capitalizeWords(text: string | undefined | null): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function POST() {
  try {
    let updatedCount = 0
    const updates: string[] = []

    // 1. Capitaliser les équipes
    const teamsSnap = await getDocs(collection(db, 'teams'))
    for (const teamDoc of teamsSnap.docs) {
      const data = teamDoc.data()
      const updateData: any = {}
      
      if (data.name) {
        updateData.name = capitalizeWords(data.name)
      }
      if (data.schoolName) {
        updateData.schoolName = capitalizeWords(data.schoolName)
      }
      if (data.coach) {
        updateData.coach = {
          ...data.coach,
          firstName: capitalizeWords(data.coach.firstName),
          lastName: capitalizeWords(data.coach.lastName)
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'teams', teamDoc.id), updateData)
        updatedCount++
        updates.push(`Équipe: ${data.name}`)
      }
    }

    // 2. Capitaliser les joueurs (playerAccounts)
    const playersSnap = await getDocs(collection(db, 'playerAccounts'))
    for (const playerDoc of playersSnap.docs) {
      const data = playerDoc.data()
      const updateData: any = {}
      
      if (data.firstName) {
        updateData.firstName = capitalizeWords(data.firstName)
      }
      if (data.lastName) {
        updateData.lastName = capitalizeWords(data.lastName)
      }
      if (data.nickname) {
        updateData.nickname = capitalizeWords(data.nickname)
      }
      if (data.teamName) {
        updateData.teamName = capitalizeWords(data.teamName)
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'playerAccounts', playerDoc.id), updateData)
        updatedCount++
        updates.push(`Joueur: ${data.firstName} ${data.lastName}`)
      }
    }

    // 3. Capitaliser les entraîneurs (coachAccounts)
    const coachesSnap = await getDocs(collection(db, 'coachAccounts'))
    for (const coachDoc of coachesSnap.docs) {
      const data = coachDoc.data()
      const updateData: any = {}
      
      if (data.firstName) {
        updateData.firstName = capitalizeWords(data.firstName)
      }
      if (data.lastName) {
        updateData.lastName = capitalizeWords(data.lastName)
      }
      if (data.teamName) {
        updateData.teamName = capitalizeWords(data.teamName)
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'coachAccounts', coachDoc.id), updateData)
        updatedCount++
        updates.push(`Entraîneur: ${data.firstName} ${data.lastName}`)
      }
    }

    // 4. Capitaliser les inscriptions (teamRegistrations)
    const registrationsSnap = await getDocs(collection(db, 'teamRegistrations'))
    for (const regDoc of registrationsSnap.docs) {
      const data = regDoc.data()
      const updateData: any = {}
      
      if (data.teamName) {
        updateData.teamName = capitalizeWords(data.teamName)
      }
      if (data.schoolName) {
        updateData.schoolName = capitalizeWords(data.schoolName)
      }
      if (data.coach) {
        updateData.coach = {
          ...data.coach,
          firstName: capitalizeWords(data.coach.firstName),
          lastName: capitalizeWords(data.coach.lastName)
        }
      }
      if (data.players && Array.isArray(data.players)) {
        updateData.players = data.players.map((player: any) => ({
          ...player,
          firstName: capitalizeWords(player.firstName),
          lastName: capitalizeWords(player.lastName),
          nickname: capitalizeWords(player.nickname)
        }))
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'teamRegistrations', regDoc.id), updateData)
        updatedCount++
        updates.push(`Inscription: ${data.teamName}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${updatedCount} documents capitalisés avec succès`,
      updatedCount,
      updates: updates.slice(0, 20) // Limiter à 20 pour l'affichage
    })
  } catch (error: any) {
    console.error('Error capitalizing data:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
