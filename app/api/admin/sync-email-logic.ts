import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

/**
 * Fonction réutilisable pour synchroniser un email dans toutes les collections
 */
export async function syncEmailEverywhere(oldEmail: string, newEmail: string) {
  const oldEmailLower = oldEmail.toLowerCase().trim()
  const newEmailLower = newEmail.toLowerCase().trim()

  if (oldEmailLower === newEmailLower) {
    throw new Error('Les emails sont identiques')
  }

  console.log(`🔄 Synchronisation email: ${oldEmail} → ${newEmail}`)

  const updates: any[] = []
  let authUpdated = false

  // 1. Mettre à jour Firebase Auth
  try {
    const user = await adminAuth.getUserByEmail(oldEmail)
    await adminAuth.updateUser(user.uid, {
      email: newEmail,
      emailVerified: false
    })
    authUpdated = true
    updates.push({ collection: 'Firebase Auth', uid: user.uid })
    console.log(`✅ Firebase Auth mis à jour (UID: ${user.uid})`)
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      try {
        const user = await adminAuth.getUserByEmail(newEmail)
        console.log(`ℹ️  Firebase Auth déjà à jour (UID: ${user.uid})`)
        authUpdated = true
      } catch {
        console.log(`⚠️  Aucun compte Firebase Auth trouvé`)
      }
    }
  }

  // 2. Mettre à jour playerAccounts
  const playerAccountsSnap = await adminDb.collection('playerAccounts')
    .where('email', '==', oldEmail)
    .get()

  for (const doc of playerAccountsSnap.docs) {
    await doc.ref.update({
      email: newEmail,
      updatedAt: Timestamp.now()
    })
    updates.push({ collection: 'playerAccounts', id: doc.id })
  }

  // 3. Mettre à jour coachAccounts
  const coachAccountsSnap = await adminDb.collection('coachAccounts')
    .where('email', '==', oldEmail)
    .get()

  for (const doc of coachAccountsSnap.docs) {
    await doc.ref.update({
      email: newEmail,
      updatedAt: Timestamp.now()
    })
    updates.push({ collection: 'coachAccounts', id: doc.id })
  }

  // 4. Mettre à jour players
  const playersSnap = await adminDb.collection('players')
    .where('email', '==', oldEmail)
    .get()

  for (const doc of playersSnap.docs) {
    await doc.ref.update({
      email: newEmail,
      updatedAt: Timestamp.now()
    })
    updates.push({ collection: 'players', id: doc.id })
  }

  // 5. Mettre à jour teams.players et teams.coach
  const teamsSnap = await adminDb.collection('teams').get()
  let teamsUpdated = 0

  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data()
    let teamNeedsUpdate = false
    const teamUpdates: any = {}

    if (teamData.coach?.email === oldEmail) {
      teamUpdates.coach = { ...teamData.coach, email: newEmail }
      teamNeedsUpdate = true
    }

    if (teamData.players && Array.isArray(teamData.players)) {
      const updatedPlayers = teamData.players.map((player: any) => 
        player.email === oldEmail ? { ...player, email: newEmail } : player
      )

      if (updatedPlayers.some((p: any, i: number) => p.email !== teamData.players[i]?.email)) {
        teamUpdates.players = updatedPlayers
        teamNeedsUpdate = true
      }
    }

    if (teamNeedsUpdate) {
      await teamDoc.ref.update({
        ...teamUpdates,
        updatedAt: Timestamp.now()
      })
      teamsUpdated++
      updates.push({ collection: 'teams', id: teamDoc.id, name: teamData.name })
    }
  }

  // 6. Mettre à jour teamRegistrations
  const registrationsSnap = await adminDb.collection('teamRegistrations').get()
  let registrationsUpdated = 0

  for (const regDoc of registrationsSnap.docs) {
    const regData = regDoc.data()
    let needsUpdate = false
    const regUpdates: any = {}

    if (regData.captain?.email === oldEmail) {
      regUpdates.captain = { ...regData.captain, email: newEmail }
      needsUpdate = true
    }

    if (regData.coach?.email === oldEmail) {
      regUpdates.coach = { ...regData.coach, email: newEmail }
      needsUpdate = true
    }

    if (regData.players && Array.isArray(regData.players)) {
      const updatedPlayers = regData.players.map((player: any) => 
        player.email === oldEmail ? { ...player, email: newEmail } : player
      )

      if (updatedPlayers.some((p: any, i: number) => p.email !== regData.players[i]?.email)) {
        regUpdates.players = updatedPlayers
        needsUpdate = true
      }
    }

    if (needsUpdate) {
      await regDoc.ref.update({
        ...regUpdates,
        lastUpdatedAt: Timestamp.now()
      })
      registrationsUpdated++
      updates.push({ collection: 'teamRegistrations', id: regDoc.id, name: regData.teamName })
    }
  }

  // 7. Mettre à jour users
  const usersSnap = await adminDb.collection('users')
    .where('email', '==', oldEmail)
    .get()

  for (const doc of usersSnap.docs) {
    await doc.ref.update({ email: newEmail })
    updates.push({ collection: 'users', id: doc.id })
  }

  // 8. Mettre à jour userProfiles
  const profilesSnap = await adminDb.collection('userProfiles')
    .where('email', '==', oldEmail)
    .get()

  for (const doc of profilesSnap.docs) {
    await doc.ref.update({ email: newEmail })
    updates.push({ collection: 'userProfiles', id: doc.id })
  }

  return {
    success: true,
    updates,
    authUpdated,
    summary: {
      playerAccounts: playerAccountsSnap.size,
      coachAccounts: coachAccountsSnap.size,
      players: playersSnap.size,
      teams: teamsUpdated,
      teamRegistrations: registrationsUpdated,
      users: usersSnap.size,
      userProfiles: profilesSnap.size
    }
  }
}

