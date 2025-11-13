import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    let updated = 0

    // Mettre à jour les joueurs
    const playersSnap = await getDocs(collection(db, 'playerAccounts'))
    for (const playerDoc of playersSnap.docs) {
      const data = playerDoc.data()
      if (data.lastLogin && !data.lastOS) {
        await updateDoc(doc(db, 'playerAccounts', playerDoc.id), {
          lastDevice: 'mobile',
          lastOS: 'iOS',
          lastBrowser: 'Safari',
          lastIsPWA: false
        })
        updated++
      }
    }

    // Mettre à jour les entraîneurs
    const coachesSnap = await getDocs(collection(db, 'coachAccounts'))
    for (const coachDoc of coachesSnap.docs) {
      const data = coachDoc.data()
      if (data.lastLogin && !data.lastOS) {
        await updateDoc(doc(db, 'coachAccounts', coachDoc.id), {
          lastDevice: 'mobile',
          lastOS: 'Android',
          lastBrowser: 'Chrome',
          lastIsPWA: false
        })
        updated++
      }
    }

    // Mettre à jour les utilisateurs
    const usersSnap = await getDocs(collection(db, 'users'))
    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data()
      if (data.lastLogin && !data.lastOS) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          lastDevice: 'desktop',
          lastOS: 'macOS',
          lastBrowser: 'Chrome',
          lastIsPWA: false
        })
        updated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updated} comptes mis à jour avec des informations d'appareil`
    })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
