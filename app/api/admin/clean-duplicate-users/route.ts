import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST() {
  try {
    console.log('🔍 Recherche des doublons users/players/coaches...')

    // Récupérer tous les emails des joueurs et coaches
    const [playerAccountsSnap, coachAccountsSnap, usersSnap] = await Promise.all([
      adminDb.collection('playerAccounts').get(),
      adminDb.collection('coachAccounts').get(),
      adminDb.collection('users').get()
    ])

    const playerEmails = new Set(
      playerAccountsSnap.docs.map(doc => doc.data().email?.toLowerCase()).filter(Boolean)
    )
    const coachEmails = new Set(
      coachAccountsSnap.docs.map(doc => doc.data().email?.toLowerCase()).filter(Boolean)
    )

    console.log(`📊 ${playerEmails.size} joueurs, ${coachEmails.size} coaches`)

    const toDelete: string[] = []
    const report: any[] = []

    // Vérifier chaque user
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data()
      const email = userData.email?.toLowerCase()

      if (!email) continue

      // Si l'email existe dans playerAccounts ou coachAccounts
      if (playerEmails.has(email) || coachEmails.has(email)) {
        const type = playerEmails.has(email) ? 'joueur' : 'coach'
        toDelete.push(userDoc.id)
        report.push({
          id: userDoc.id,
          email: email,
          type: type,
          action: 'supprimé de users'
        })
      }
    }

    console.log(`🗑️ ${toDelete.length} doublons trouvés`)

    // Supprimer les doublons
    for (const docId of toDelete) {
      await adminDb.collection('users').doc(docId).delete()
      console.log(`✅ Supprimé: ${docId}`)
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${toDelete.length} compte(s) user basique(s) supprimé(s) (doublons avec joueurs/coaches)`,
      deleted: toDelete.length,
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
