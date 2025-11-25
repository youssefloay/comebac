import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
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
const auth = getAuth()

async function checkMichaelWaguihNewEmail() {
  console.log('🔍 Vérification de Michael Waguih avec le nouvel email...')
  console.log('============================================================\n')

  const newEmail = 'michaelwaguih0@gmail.com'
  const oldEmail = 'michaelawaguih0@gmail.com'
  const saintsTeamId = 'MHBdumu4cSU6ExLRlrrj'

  // 1. Vérifier dans Firebase Auth
  console.log('1️⃣ Vérification dans Firebase Auth...')
  try {
    const user = await auth.getUserByEmail(newEmail)
    console.log(`   ✅ Compte Auth trouvé avec le nouvel email:`)
    console.log(`      - UID: ${user.uid}`)
    console.log(`      - Email: ${user.email}`)
    console.log(`      - Email vérifié: ${user.emailVerified}`)
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`   ❌ Aucun compte Auth trouvé avec ${newEmail}`)
    } else {
      console.log(`   ⚠️  Erreur: ${error.message}`)
    }
  }

  try {
    const user = await auth.getUserByEmail(oldEmail)
    console.log(`   ⚠️  Compte Auth trouvé avec l'ancien email:`)
    console.log(`      - UID: ${user.uid}`)
    console.log(`      - Email: ${user.email}`)
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`   ✅ Aucun compte Auth avec l'ancien email (normal)`)
    }
  }

  // 2. Vérifier dans playerAccounts
  console.log('\n2️⃣ Vérification dans playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', 'in', [newEmail, oldEmail])
    .get()

  if (playerAccountsSnap.empty) {
    console.log('   ❌ Aucun compte trouvé avec ces emails')
  } else {
    for (const doc of playerAccountsSnap.docs) {
      const data = doc.data()
      console.log(`   📋 Compte trouvé (ID: ${doc.id}):`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - Team ID: ${data.teamId || 'N/A'}`)
      console.log(`      - UID: ${data.uid || 'N/A'}`)
    }
  }

  // 3. Vérifier dans teams.players
  console.log('\n3️⃣ Vérification dans teams.players...')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Saints')
    .get()

  if (!teamsSnap.empty) {
    const teamData = teamsSnap.docs[0].data()
    if (teamData.players && Array.isArray(teamData.players)) {
      const michaelPlayer = teamData.players.find((p: any) => 
        p.email?.toLowerCase() === newEmail.toLowerCase() ||
        p.email?.toLowerCase() === oldEmail.toLowerCase()
      )
      
      if (michaelPlayer) {
        console.log(`   📋 Joueur trouvé dans teams.players:`)
        console.log(`      - Email: ${michaelPlayer.email}`)
        console.log(`      - Nom: ${michaelPlayer.firstName} ${michaelPlayer.lastName}`)
      } else {
        console.log(`   ❌ Joueur non trouvé dans teams.players`)
      }
    }
  }

  // 4. Vérifier dans players
  console.log('\n4️⃣ Vérification dans players...')
  const playersSnap = await db.collection('players')
    .where('teamId', '==', saintsTeamId)
    .get()

  const michaelPlayer = playersSnap.docs.find(doc => {
    const data = doc.data()
    return data.email?.toLowerCase() === newEmail.toLowerCase() ||
           data.email?.toLowerCase() === oldEmail.toLowerCase()
  })

  if (michaelPlayer) {
    const data = michaelPlayer.data()
    console.log(`   📋 Joueur trouvé dans players:`)
    console.log(`      - ID: ${michaelPlayer.id}`)
    console.log(`      - Email: ${data.email}`)
    console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
  } else {
    console.log(`   ❌ Joueur non trouvé dans players`)
  }

  console.log('\n============================================================')
  console.log('📊 CONCLUSION:')
  console.log('============================================================')
  console.log('Si aucun compte Auth n\'existe avec le nouvel email,')
  console.log('il faut créer le compte Firebase Auth ou mettre à jour l\'email.')
}

checkMichaelWaguihNewEmail().catch(console.error)

