import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'

// Corrections d'emails connues
const emailCorrections: { [key: string]: string } = {
  '@outlool': '@outlook',
  '@gmai': '@gmail',
  '@yahooo': '@yahoo',
  '@hotmial': '@hotmail',
}

function fixEmail(email: string): string {
  if (!email) return email
  
  let fixedEmail = email.toLowerCase().trim()
  
  // Appliquer les corrections connues
  for (const [wrong, correct] of Object.entries(emailCorrections)) {
    if (fixedEmail.includes(wrong)) {
      fixedEmail = fixedEmail.replace(wrong, correct)
    }
  }
  
  return fixedEmail
}

export async function POST() {
  try {
    let fixedCount = 0
    const fixes: string[] = []

    // 1. Corriger playerAccounts
    const playersSnap = await getDocs(collection(db, 'playerAccounts'))
    for (const playerDoc of playersSnap.docs) {
      const data = playerDoc.data()
      if (data.email) {
        const fixedEmail = fixEmail(data.email)
        if (fixedEmail !== data.email) {
          await updateDoc(doc(db, 'playerAccounts', playerDoc.id), {
            email: fixedEmail
          })
          fixedCount++
          fixes.push(`Joueur: ${data.firstName} ${data.lastName} - ${data.email} → ${fixedEmail}`)
        }
      }
    }

    // 2. Corriger coachAccounts
    const coachesSnap = await getDocs(collection(db, 'coachAccounts'))
    for (const coachDoc of coachesSnap.docs) {
      const data = coachDoc.data()
      if (data.email) {
        const fixedEmail = fixEmail(data.email)
        if (fixedEmail !== data.email) {
          await updateDoc(doc(db, 'coachAccounts', coachDoc.id), {
            email: fixedEmail
          })
          fixedCount++
          fixes.push(`Entraîneur: ${data.firstName} ${data.lastName} - ${data.email} → ${fixedEmail}`)
        }
      }
    }

    // 3. Corriger players
    const playersCollectionSnap = await getDocs(collection(db, 'players'))
    for (const playerDoc of playersCollectionSnap.docs) {
      const data = playerDoc.data()
      if (data.email) {
        const fixedEmail = fixEmail(data.email)
        if (fixedEmail !== data.email) {
          await updateDoc(doc(db, 'players', playerDoc.id), {
            email: fixedEmail
          })
          fixedCount++
          fixes.push(`Player: ${data.name} - ${data.email} → ${fixedEmail}`)
        }
      }
    }

    // 4. Corriger teamRegistrations
    const registrationsSnap = await getDocs(collection(db, 'teamRegistrations'))
    for (const regDoc of registrationsSnap.docs) {
      const data = regDoc.data()
      let needsUpdate = false
      const updateData: any = {}
      
      if (data.coach?.email) {
        const fixedEmail = fixEmail(data.coach.email)
        if (fixedEmail !== data.coach.email) {
          updateData.coach = { ...data.coach, email: fixedEmail }
          needsUpdate = true
          fixes.push(`Registration coach: ${data.teamName} - ${data.coach.email} → ${fixedEmail}`)
        }
      }
      
      if (data.players && Array.isArray(data.players)) {
        const fixedPlayers = data.players.map((player: any) => {
          if (player.email) {
            const fixedEmail = fixEmail(player.email)
            if (fixedEmail !== player.email) {
              needsUpdate = true
              fixes.push(`Registration player: ${player.firstName} ${player.lastName} - ${player.email} → ${fixedEmail}`)
              return { ...player, email: fixedEmail }
            }
          }
          return player
        })
        if (needsUpdate) {
          updateData.players = fixedPlayers
        }
      }
      
      if (needsUpdate) {
        await updateDoc(doc(db, 'teamRegistrations', regDoc.id), updateData)
        fixedCount++
      }
    }

    // 5. Corriger users
    const usersSnap = await getDocs(collection(db, 'users'))
    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data()
      if (data.email) {
        const fixedEmail = fixEmail(data.email)
        if (fixedEmail !== data.email) {
          await updateDoc(doc(db, 'users', userDoc.id), {
            email: fixedEmail
          })
          fixedCount++
          fixes.push(`User: ${data.email} → ${fixedEmail}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${fixedCount} emails corrigés avec succès`,
      fixedCount,
      fixes: fixes.slice(0, 30) // Limiter à 30 pour l'affichage
    })
  } catch (error: any) {
    console.error('Error fixing emails:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
