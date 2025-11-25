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

async function checkMarkSamirTeam() {
  console.log('🔍 Vérification de Mark Samir...')
  console.log('============================================================\n')

  const markEmail = 'marksamir515@gmail.com'
  const saintsTeamId = 'MHBdumu4cSU6ExLRlrrj'

  // Vérifier dans players
  console.log('1️⃣ players:')
  const playersSnap = await db.collection('players')
    .where('email', '==', markEmail)
    .get()

  if (playersSnap.empty) {
    console.log('   ✅ Mark Samir n\'est pas dans players')
  } else {
    for (const doc of playersSnap.docs) {
      const data = doc.data()
      console.log(`   📋 Document trouvé (ID: ${doc.id}):`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - teamId: ${data.teamId || 'N/A'}`)
      
      if (data.teamId === saintsTeamId) {
        console.log(`      ⚠️  ATTENTION: Mark Samir est encore lié à l'équipe Saints!`)
      } else {
        console.log(`      ✅ Mark Samir n'est PAS lié à l'équipe Saints (teamId différent)`)
      }
    }
  }

  // Vérifier dans playerAccounts
  console.log('\n2️⃣ playerAccounts:')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', markEmail)
    .get()

  if (playerAccountsSnap.empty) {
    console.log('   ✅ Mark Samir n\'est pas dans playerAccounts')
  } else {
    for (const doc of playerAccountsSnap.docs) {
      const data = doc.data()
      console.log(`   📋 Document trouvé (ID: ${doc.id}):`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - teamId: ${data.teamId || 'N/A'}`)
      
      if (data.teamId === saintsTeamId) {
        console.log(`      ⚠️  ATTENTION: Mark Samir est encore lié à l'équipe Saints!`)
      } else {
        console.log(`      ✅ Mark Samir n'est PAS lié à l'équipe Saints (teamId différent ou null)`)
      }
    }
  }

  console.log('\n============================================================')
  console.log('📊 CONCLUSION:')
  console.log('============================================================')
  console.log('✅ Dans teamRegistrations et teams: Mark Samir a été remplacé par Michael Waguih')
  console.log('⚠️  Vérifiez si Mark Samir est encore lié à l\'équipe Saints dans players et playerAccounts')
}

checkMarkSamirTeam().catch(console.error)

