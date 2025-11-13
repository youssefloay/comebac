import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    let fixed = 0
    const fixes: Array<{ collection: string; id: string; oldEmail: string; newEmail: string }> = []

    // Fonction pour corriger l'email
    const fixEmail = (email: string): string => {
      return email.replace(/@gmaill\.com/gi, '@gmail.com')
    }

    // Corriger dans playerAccounts
    const playersSnap = await getDocs(collection(db, 'playerAccounts'))
    for (const playerDoc of playersSnap.docs) {
      const data = playerDoc.data()
      if (data.email && data.email.toLowerCase().includes('@gmaill.com')) {
        const oldEmail = data.email
        const newEmail = fixEmail(data.email)
        
        await updateDoc(doc(db, 'playerAccounts', playerDoc.id), {
          email: newEmail
        })
        
        fixes.push({
          collection: 'playerAccounts',
          id: playerDoc.id,
          oldEmail,
          newEmail
        })
        fixed++
      }
    }

    // Corriger dans coachAccounts
    const coachesSnap = await getDocs(collection(db, 'coachAccounts'))
    for (const coachDoc of coachesSnap.docs) {
      const data = coachDoc.data()
      if (data.email && data.email.toLowerCase().includes('@gmaill.com')) {
        const oldEmail = data.email
        const newEmail = fixEmail(data.email)
        
        await updateDoc(doc(db, 'coachAccounts', coachDoc.id), {
          email: newEmail
        })
        
        fixes.push({
          collection: 'coachAccounts',
          id: coachDoc.id,
          oldEmail,
          newEmail
        })
        fixed++
      }
    }

    // Corriger dans users
    const usersSnap = await getDocs(collection(db, 'users'))
    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data()
      if (data.email && data.email.toLowerCase().includes('@gmaill.com')) {
        const oldEmail = data.email
        const newEmail = fixEmail(data.email)
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          email: newEmail
        })
        
        fixes.push({
          collection: 'users',
          id: userDoc.id,
          oldEmail,
          newEmail
        })
        fixed++
      }
    }

    // Corriger dans userProfiles
    const profilesSnap = await getDocs(collection(db, 'userProfiles'))
    for (const profileDoc of profilesSnap.docs) {
      const data = profileDoc.data()
      if (data.email && data.email.toLowerCase().includes('@gmaill.com')) {
        const oldEmail = data.email
        const newEmail = fixEmail(data.email)
        
        await updateDoc(doc(db, 'userProfiles', profileDoc.id), {
          email: newEmail
        })
        
        fixes.push({
          collection: 'userProfiles',
          id: profileDoc.id,
          oldEmail,
          newEmail
        })
        fixed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${fixed} email(s) corrigé(s) : @gmaill.com → @gmail.com`,
      fixes
    })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
