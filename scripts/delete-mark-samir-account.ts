import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
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

async function deleteMarkSamirAccount() {
  console.log('🗑️  Suppression du compte playerAccounts de Mark Samir...')
  console.log('============================================================\n')

  const markEmail = 'marksamir515@gmail.com'

  // Supprimer de playerAccounts
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', markEmail)
    .get()

  if (playerAccountsSnap.empty) {
    console.log('   ℹ️  Aucun compte trouvé')
  } else {
    for (const doc of playerAccountsSnap.docs) {
      const data = doc.data()
      console.log(`   📋 Compte trouvé (ID: ${doc.id}):`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - Team ID: ${data.teamId || 'N/A'}`)
      
      await db.collection('playerAccounts').doc(doc.id).delete()
      console.log(`   ✅ Compte supprimé`)
    }
  }

  console.log('\n============================================================')
  console.log('✅ Suppression terminée!')
  console.log('============================================================')
  console.log('\n💡 Si Mark Samir apparaît encore dans l\'interface:')
  console.log('   1. Rafraîchissez la page (Ctrl+F5 ou Cmd+Shift+R)')
  console.log('   2. Videz le cache du navigateur')
  console.log('   3. Vérifiez que vous êtes sur la bonne équipe')
}

deleteMarkSamirAccount().catch(console.error)

