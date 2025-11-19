import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { accountId, accountType, email } = await request.json()

    if (!accountId || !accountType || !email) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    console.log(`🗑️ Suppression complète: ${accountType} ${email}`)

    const report: any = {
      email,
      accountType,
      deleted: {
        players: 0,
        playerAccounts: 0,
        coachAccounts: 0,
        firebaseAuth: false,
        teamRegistrations: 0
      }
    }

    // 1. Supprimer de la collection players
    const playersSnap = await adminDb.collection('players')
      .where('email', '==', email)
      .get()
    
    for (const doc of playersSnap.docs) {
      await doc.ref.delete()
      report.deleted.players++
      console.log(`✅ Supprimé de players: ${doc.id}`)
    }

    // 2. Supprimer de playerAccounts ou coachAccounts selon le type
    if (accountType === 'player') {
      const playerAccountsSnap = await adminDb.collection('playerAccounts')
        .where('email', '==', email)
        .get()
      
      for (const doc of playerAccountsSnap.docs) {
        await doc.ref.delete()
        report.deleted.playerAccounts++
        console.log(`✅ Supprimé de playerAccounts: ${doc.id}`)
      }
    } else if (accountType === 'coach') {
      // Supprimer aussi par ID si fourni
      if (accountId) {
        try {
          await adminDb.collection('coachAccounts').doc(accountId).delete()
          report.deleted.coachAccounts++
          console.log(`✅ Supprimé de coachAccounts: ${accountId}`)
        } catch (error) {
          console.log('⚠️ Coach account déjà supprimé ou non trouvé')
        }
      }
      
      // Supprimer aussi par email
      const coachAccountsSnap = await adminDb.collection('coachAccounts')
        .where('email', '==', email)
        .get()
      
      for (const doc of coachAccountsSnap.docs) {
        await doc.ref.delete()
        report.deleted.coachAccounts++
        console.log(`✅ Supprimé de coachAccounts: ${doc.id}`)
      }
    }

    // 3. Supprimer de Firebase Auth
    try {
      const userRecord = await adminAuth.getUserByEmail(email)
      await adminAuth.deleteUser(userRecord.uid)
      report.deleted.firebaseAuth = true
      console.log(`✅ Supprimé de Firebase Auth: ${userRecord.uid}`)
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        console.error('Erreur suppression Auth:', error)
      }
    }

    // 4. Retirer des teamRegistrations (dans le tableau players)
    const registrationsSnap = await adminDb.collection('teamRegistrations').get()
    
    for (const regDoc of registrationsSnap.docs) {
      const regData = regDoc.data()
      if (regData.players && Array.isArray(regData.players)) {
        const originalLength = regData.players.length
        const filteredPlayers = regData.players.filter((p: any) => p.email !== email)
        
        if (filteredPlayers.length < originalLength) {
          await regDoc.ref.update({ players: filteredPlayers })
          report.deleted.teamRegistrations++
          console.log(`✅ Retiré de teamRegistrations: ${regDoc.id}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${accountType === 'coach' ? 'Entraîneur' : 'Joueur'} ${email} supprimé complètement de la base de données`,
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
