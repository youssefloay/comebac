import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { oldEmail, newEmail } = await request.json()

    if (!oldEmail || !newEmail) {
      return NextResponse.json(
        { error: 'oldEmail et newEmail sont requis' },
        { status: 400 }
      )
    }

    let updated = 0
    let authUpdated = false
    let userUID: string | null = null
    const updates: Array<{ collection: string; id: string; name: string }> = []

    // Normaliser les emails
    const oldEmailLower = oldEmail.toLowerCase().trim()
    const newEmailLower = newEmail.toLowerCase().trim()

    console.log(`🔄 Remplacement: "${oldEmail}" → "${newEmail}"`)

    const auth = getAuth()
    const db = getFirestore()

    // D'abord, chercher l'utilisateur dans Firebase Auth par email
    try {
      const userRecord = await auth.getUserByEmail(oldEmail)
      userUID = userRecord.uid
      console.log(`🔍 Utilisateur trouvé dans Auth: ${userUID}`)
    } catch (authError: any) {
      console.log(`⚠️ Utilisateur non trouvé dans Auth: ${authError.message}`)
    }

    // Mettre à jour playerAccounts
    const playersSnap = await db.collection('playerAccounts').get()
    for (const playerDoc of playersSnap.docs) {
      const data = playerDoc.data()
      if (data.email && data.email.toLowerCase().trim() === oldEmailLower) {
        await playerDoc.ref.update({ email: newEmail })
        updates.push({
          collection: 'playerAccounts',
          id: playerDoc.id,
          name: `${data.firstName} ${data.lastName}`
        })
        updated++
        console.log(`✅ Player: ${data.firstName} ${data.lastName}`)
      }
    }

    // Mettre à jour players
    const playersCollSnap = await db.collection('players').get()
    for (const doc of playersCollSnap.docs) {
      const data = doc.data()
      if (data.email && data.email.toLowerCase().trim() === oldEmailLower) {
        await doc.ref.update({ email: newEmail })
        updates.push({
          collection: 'players',
          id: doc.id,
          name: data.name || `${data.firstName} ${data.lastName}`
        })
        updated++
        console.log(`✅ Players: ${data.name}`)
      }
    }

    // Mettre à jour coachAccounts
    const coachesSnap = await db.collection('coachAccounts').get()
    for (const coachDoc of coachesSnap.docs) {
      const data = coachDoc.data()
      if (data.email && data.email.toLowerCase().trim() === oldEmailLower) {
        await coachDoc.ref.update({ email: newEmail })
        updates.push({
          collection: 'coachAccounts',
          id: coachDoc.id,
          name: `${data.firstName} ${data.lastName}`
        })
        updated++
        console.log(`✅ Coach: ${data.firstName} ${data.lastName}`)
      }
    }

    // Mettre à jour users
    const usersSnap = await db.collection('users').get()
    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data()
      if (data.email && data.email.toLowerCase().trim() === oldEmailLower) {
        await userDoc.ref.update({ email: newEmail })
        updates.push({
          collection: 'users',
          id: userDoc.id,
          name: data.displayName || data.email
        })
        updated++
        console.log(`✅ User: ${data.displayName || data.email}`)
      }
    }

    // Mettre à jour userProfiles
    const profilesSnap = await db.collection('userProfiles').get()
    for (const profileDoc of profilesSnap.docs) {
      const data = profileDoc.data()
      if (data.email && data.email.toLowerCase().trim() === oldEmailLower) {
        await profileDoc.ref.update({ email: newEmail })
        updates.push({
          collection: 'userProfiles',
          id: profileDoc.id,
          name: data.fullName || data.email
        })
        updated++
        console.log(`✅ Profile: ${data.fullName || data.email}`)
      }
    }

    // Mettre à jour teamRegistrations
    const registrationsSnap = await db.collection('teamRegistrations').get()
    for (const regDoc of registrationsSnap.docs) {
      const data = regDoc.data()
      let needsUpdate = false
      const updateData: any = {}

      // Email de l'entraîneur
      if (data.coach?.email && data.coach.email.toLowerCase().trim() === oldEmailLower) {
        updateData['coach.email'] = newEmail
        needsUpdate = true
      }

      // Email du capitaine
      if (data.captain?.email && data.captain.email.toLowerCase().trim() === oldEmailLower) {
        updateData['captain.email'] = newEmail
        needsUpdate = true
      }

      // Emails des joueurs
      if (data.players && Array.isArray(data.players)) {
        const updatedPlayers = data.players.map((player: any) => {
          if (player.email && player.email.toLowerCase().trim() === oldEmailLower) {
            return { ...player, email: newEmail }
          }
          return player
        })
        
        if (JSON.stringify(updatedPlayers) !== JSON.stringify(data.players)) {
          updateData.players = updatedPlayers
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        await regDoc.ref.update(updateData)
        updates.push({
          collection: 'teamRegistrations',
          id: regDoc.id,
          name: data.teamName || 'Inscription'
        })
        updated++
        console.log(`✅ Registration: ${data.teamName}`)
      }
    }

    // Mettre à jour Firebase Auth si UID trouvé
    if (userUID) {
      try {
        await auth.updateUser(userUID, { email: newEmail })
        authUpdated = true
        console.log(`✅ Firebase Auth mis à jour pour UID: ${userUID}`)
      } catch (authError: any) {
        console.error('Erreur Auth:', authError.message)
        return NextResponse.json({
          success: false,
          message: `⚠️ ${updated} document(s) Firestore mis à jour, mais erreur Firebase Auth: ${authError.message}`,
          updates
        })
      }
    }

    if (updated === 0) {
      return NextResponse.json({
        success: false,
        message: `❌ Aucun email "${oldEmail}" trouvé dans la base de données`
      })
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${updated} email(s) remplacé(s) : "${oldEmail}" → "${newEmail}"${authUpdated ? ' (Auth + Firestore)' : ' (Firestore uniquement)'}`,
      updates,
      authUpdated
    })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
