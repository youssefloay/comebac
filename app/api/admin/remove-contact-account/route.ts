import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST() {
  try {
    const email = 'contact@comebac.com'
    console.log(`🗑️ Suppression complète de ${email}...`)

    const report: any = {
      email,
      deleted: {
        players: 0,
        playerAccounts: 0,
        coachAccounts: 0,
        users: 0,
        userProfiles: 0,
        teamRegistrations: 0,
        firebaseAuth: false
      }
    }

    // 1. Supprimer de players
    const playersSnap = await adminDb.collection('players')
      .where('email', '==', email)
      .get()
    
    for (const doc of playersSnap.docs) {
      await doc.ref.delete()
      report.deleted.players++
    }

    // 2. Supprimer de playerAccounts
    const playerAccountsSnap = await adminDb.collection('playerAccounts')
      .where('email', '==', email)
      .get()
    
    for (const doc of playerAccountsSnap.docs) {
      await doc.ref.delete()
      report.deleted.playerAccounts++
    }

    // 3. Supprimer de coachAccounts
    const coachAccountsSnap = await adminDb.collection('coachAccounts')
      .where('email', '==', email)
      .get()
    
    for (const doc of coachAccountsSnap.docs) {
      await doc.ref.delete()
      report.deleted.coachAccounts++
    }

    // 4. Supprimer de users
    const usersSnap = await adminDb.collection('users')
      .where('email', '==', email)
      .get()
    
    for (const doc of usersSnap.docs) {
      await doc.ref.delete()
      report.deleted.users++
    }

    // 5. Supprimer de userProfiles
    const userProfilesSnap = await adminDb.collection('userProfiles')
      .where('email', '==', email)
      .get()
    
    for (const doc of userProfilesSnap.docs) {
      await doc.ref.delete()
      report.deleted.userProfiles++
    }

    // 6. Retirer des teamRegistrations
    const registrationsSnap = await adminDb.collection('teamRegistrations').get()
    
    for (const regDoc of registrationsSnap.docs) {
      const regData = regDoc.data()
      if (regData.players && Array.isArray(regData.players)) {
        const originalLength = regData.players.length
        const filteredPlayers = regData.players.filter((p: any) => p.email !== email)
        
        if (filteredPlayers.length < originalLength) {
          await regDoc.ref.update({ players: filteredPlayers })
          report.deleted.teamRegistrations++
        }
      }
    }

    // 7. Supprimer de Firebase Auth
    try {
      const userRecord = await adminAuth.getUserByEmail(email)
      await adminAuth.deleteUser(userRecord.uid)
      report.deleted.firebaseAuth = true
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        console.error('Erreur suppression Auth:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ Compte ${email} supprimé complètement de la base de données`,
      report
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
