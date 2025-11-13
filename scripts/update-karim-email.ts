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

const auth = getAuth()
const db = getFirestore()

const oldEmail = 'karim_basim@outlook.com'
const newEmail = 'kbdem_2009@hotmail.com'

async function updateKarimEmail() {
  console.log(`🔄 Remplacement de l'email de Karim...`)
  console.log(`   Ancien: ${oldEmail}`)
  console.log(`   Nouveau: ${newEmail}`)
  console.log('')

  let userUID: string | null = null
  let updated = 0

  // 1. Trouver l'utilisateur dans Firebase Auth
  try {
    const userRecord = await auth.getUserByEmail(oldEmail)
    userUID = userRecord.uid
    console.log(`✅ Utilisateur trouvé dans Firebase Auth (UID: ${userUID})`)
  } catch (error: any) {
    console.log(`⚠️  Utilisateur non trouvé dans Firebase Auth: ${error.message}`)
  }

  // 2. Mettre à jour playerAccounts
  const playersSnap = await db.collection('playerAccounts').get()
  for (const doc of playersSnap.docs) {
    const data = doc.data()
    if (data.email?.toLowerCase() === oldEmail.toLowerCase()) {
      await doc.ref.update({ email: newEmail })
      console.log(`✅ playerAccounts: ${data.firstName} ${data.lastName}`)
      updated++
    }
  }

  // 3. Mettre à jour players
  const playersCollSnap = await db.collection('players').get()
  for (const doc of playersCollSnap.docs) {
    const data = doc.data()
    if (data.email?.toLowerCase() === oldEmail.toLowerCase()) {
      await doc.ref.update({ email: newEmail })
      console.log(`✅ players: ${data.name}`)
      updated++
    }
  }

  // 4. Mettre à jour coachAccounts
  const coachesSnap = await db.collection('coachAccounts').get()
  for (const doc of coachesSnap.docs) {
    const data = doc.data()
    if (data.email?.toLowerCase() === oldEmail.toLowerCase()) {
      await doc.ref.update({ email: newEmail })
      console.log(`✅ coachAccounts: ${data.firstName} ${data.lastName}`)
      updated++
    }
  }

  // 5. Mettre à jour users
  const usersSnap = await db.collection('users').get()
  for (const doc of usersSnap.docs) {
    const data = doc.data()
    if (data.email?.toLowerCase() === oldEmail.toLowerCase()) {
      await doc.ref.update({ email: newEmail })
      console.log(`✅ users: ${data.displayName || data.email}`)
      updated++
    }
  }

  // 6. Mettre à jour userProfiles
  const profilesSnap = await db.collection('userProfiles').get()
  for (const doc of profilesSnap.docs) {
    const data = doc.data()
    if (data.email?.toLowerCase() === oldEmail.toLowerCase()) {
      await doc.ref.update({ email: newEmail })
      console.log(`✅ userProfiles: ${data.fullName || data.email}`)
      updated++
    }
  }

  // 7. Mettre à jour teamRegistrations
  const registrationsSnap = await db.collection('teamRegistrations').get()
  for (const doc of registrationsSnap.docs) {
    const data = doc.data()
    let needsUpdate = false
    const updateData: any = {}

    // Email de l'entraîneur
    if (data.coach?.email?.toLowerCase() === oldEmail.toLowerCase()) {
      updateData['coach.email'] = newEmail
      needsUpdate = true
    }

    // Email du capitaine
    if (data.captain?.email?.toLowerCase() === oldEmail.toLowerCase()) {
      updateData['captain.email'] = newEmail
      needsUpdate = true
    }

    // Emails des joueurs
    if (data.players && Array.isArray(data.players)) {
      const updatedPlayers = data.players.map((player: any) => {
        if (player.email?.toLowerCase() === oldEmail.toLowerCase()) {
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
      await doc.ref.update(updateData)
      console.log(`✅ teamRegistrations: ${data.teamName}`)
      updated++
    }
  }

  // 8. Mettre à jour Firebase Auth
  if (userUID) {
    try {
      await auth.updateUser(userUID, { email: newEmail })
      console.log(`✅ Firebase Auth mis à jour`)
    } catch (error: any) {
      console.error(`❌ Erreur lors de la mise à jour de Firebase Auth: ${error.message}`)
      return
    }
  }

  console.log('')
  console.log(`✅ Terminé ! ${updated} document(s) Firestore mis à jour`)
  if (userUID) {
    console.log(`✅ Firebase Auth mis à jour`)
  }
  console.log('')
  console.log(`📧 Tu peux maintenant envoyer l'email de réinitialisation à: ${newEmail}`)
}

updateKarimEmail()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
