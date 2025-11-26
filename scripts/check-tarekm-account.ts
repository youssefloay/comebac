import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialiser Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }

  initializeApp({
    credential: cert(serviceAccount)
  })
}

const db = getFirestore()
const auth = getAuth()

async function checkTarekmAccount() {
  console.log('🔍 Recherche du compte tarekm20053@gmail.com...\n')
  
  const email = 'tarekm20053@gmail.com'
  
  // 1. Vérifier dans Firebase Auth
  console.log('📋 1. Firebase Auth:')
  try {
    const userRecord = await auth.getUserByEmail(email)
    console.log(`✅ Utilisateur trouvé dans Firebase Auth:`)
    console.log(`   - UID: ${userRecord.uid}`)
    console.log(`   - Email: ${userRecord.email}`)
    console.log(`   - Email vérifié: ${userRecord.emailVerified}`)
    console.log(`   - Créé le: ${userRecord.metadata.creationTime}`)
    console.log(`   - Dernière connexion: ${userRecord.metadata.lastSignInTime || 'Jamais'}`)
    console.log('')
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log('   ❌ Utilisateur non trouvé dans Firebase Auth')
    } else {
      console.error('   ❌ Erreur:', error.message)
    }
    console.log('')
  }
  
  // 2. Vérifier dans playerAccounts
  console.log('📋 2. playerAccounts:')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (!playerAccountsSnap.empty) {
    console.log(`✅ Trouvé dans playerAccounts (${playerAccountsSnap.size} document(s)):`)
    playerAccountsSnap.forEach(doc => {
      const data = doc.data()
      console.log(`   - ID: ${doc.id}`)
      console.log(`     Email: ${data.email}`)
      console.log(`     Nom: ${data.firstName} ${data.lastName}`)
      console.log(`     Surnom: ${data.nickname || 'N/A'}`)
      console.log(`     Équipe: ${data.teamName || 'N/A'} (${data.teamId || 'N/A'})`)
      console.log(`     UID: ${data.uid || 'N/A'}`)
      console.log(`     Position: ${data.position || 'N/A'}`)
      console.log(`     Numéro: ${data.jerseyNumber || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Non trouvé dans playerAccounts')
    console.log('')
  }
  
  // 3. Vérifier dans users
  console.log('📋 3. users:')
  const usersSnap = await db.collection('users')
    .where('email', '==', email)
    .get()
  
  if (!usersSnap.empty) {
    console.log(`✅ Trouvé dans users (${usersSnap.size} document(s)):`)
    usersSnap.forEach(doc => {
      const data = doc.data()
      console.log(`   - ID: ${doc.id}`)
      console.log(`     Email: ${data.email}`)
      console.log(`     Rôle: ${data.role || 'N/A'}`)
      console.log(`     UID: ${data.uid || 'N/A'}`)
      console.log(`     Display Name: ${data.displayName || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Non trouvé dans users')
    console.log('')
  }
  
  // 4. Vérifier dans userProfiles
  console.log('📋 4. userProfiles:')
  const profilesSnap = await db.collection('userProfiles')
    .where('email', '==', email)
    .get()
  
  if (!profilesSnap.empty) {
    console.log(`✅ Trouvé dans userProfiles (${profilesSnap.size} document(s)):`)
    profilesSnap.forEach(doc => {
      const data = doc.data()
      console.log(`   - ID: ${doc.id}`)
      console.log(`     Email: ${data.email}`)
      console.log(`     Rôle: ${data.role || 'N/A'}`)
      console.log(`     UID: ${data.uid || 'N/A'}`)
      console.log(`     Full Name: ${data.fullName || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Non trouvé dans userProfiles')
    console.log('')
  }
  
  // 5. Vérifier dans coachAccounts
  console.log('📋 5. coachAccounts:')
  const coachAccountsSnap = await db.collection('coachAccounts')
    .where('email', '==', email)
    .get()
  
  if (!coachAccountsSnap.empty) {
    console.log(`✅ Trouvé dans coachAccounts (${coachAccountsSnap.size} document(s)):`)
    coachAccountsSnap.forEach(doc => {
      const data = doc.data()
      console.log(`   - ID: ${doc.id}`)
      console.log(`     Email: ${data.email}`)
      console.log(`     Nom: ${data.firstName} ${data.lastName}`)
      console.log(`     Équipe: ${data.teamName || 'N/A'} (${data.teamId || 'N/A'})`)
      console.log('')
    })
  } else {
    console.log('   ❌ Non trouvé dans coachAccounts')
    console.log('')
  }
  
  console.log('\n✅ Recherche terminée')
}

checkTarekmAccount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

