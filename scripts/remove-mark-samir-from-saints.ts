import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

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

const db = getFirestore()

async function removeMarkSamirFromSaints() {
  console.log('🔧 Retrait de Mark Samir de l\'équipe Saints...')
  console.log('============================================================\n')

  const markEmail = 'marksamir515@gmail.com'
  const saintsTeamId = 'MHBdumu4cSU6ExLRlrrj'

  // Retirer de playerAccounts
  console.log('1️⃣ Retrait de playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', markEmail)
    .where('teamId', '==', saintsTeamId)
    .get()

  if (playerAccountsSnap.empty) {
    console.log('   ℹ️  Aucun compte trouvé avec cet email et ce teamId')
  } else {
    for (const doc of playerAccountsSnap.docs) {
      const data = doc.data()
      console.log(`   📋 Compte trouvé (ID: ${doc.id}):`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - teamId actuel: ${data.teamId}`)
      
      await db.collection('playerAccounts').doc(doc.id).update({
        teamId: FieldValue.delete(),
        teamName: FieldValue.delete(),
        updatedAt: new Date()
      })
      
      console.log(`   ✅ teamId et teamName retirés du compte`)
    }
  }

  // Vérifier aussi dans players (au cas où)
  console.log('\n2️⃣ Vérification dans players...')
  const playersSnap = await db.collection('players')
    .where('email', '==', markEmail)
    .where('teamId', '==', saintsTeamId)
    .get()

  if (playersSnap.empty) {
    console.log('   ✅ Aucun joueur trouvé avec cet email et ce teamId')
  } else {
    for (const doc of playersSnap.docs) {
      const data = doc.data()
      console.log(`   ⚠️  Joueur trouvé (ID: ${doc.id}):`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - teamId actuel: ${data.teamId}`)
      
      await db.collection('players').doc(doc.id).delete()
      console.log(`   ✅ Joueur supprimé de players`)
    }
  }

  console.log('\n============================================================')
  console.log('✅ Opération terminée!')
  console.log('============================================================')
}

removeMarkSamirFromSaints().catch(console.error)

