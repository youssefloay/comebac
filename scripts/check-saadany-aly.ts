import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

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

async function checkSaadanyAly() {
  console.log('🔍 Vérification du compte Saadany Aly...\n')
  
  const email = 'alywael304@gmail.com'
  const name = 'Saadany Aly'
  
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
      console.log(`     Numéro: ${data.jerseyNumber || data.number || 'N/A'}`)
      console.log(`     Position: ${data.position || 'N/A'}`)
      console.log('')
    })
    console.log('✅ Le bouton "Joueur" DEVRAIT apparaître dans le menu !')
  } else {
    console.log('   ❌ Non trouvé dans playerAccounts')
    console.log('   ⚠️  Le bouton "Joueur" NE s\'affichera PAS dans le menu')
    console.log('')
    
    // 3. Chercher dans players (collection principale)
    console.log('📋 3. Recherche dans players (collection principale):')
    const playersSnap = await db.collection('players')
      .where('email', '==', email)
      .get()
    
    if (!playersSnap.empty) {
      console.log(`✅ Trouvé dans players (${playersSnap.size} document(s)):`)
      playersSnap.forEach(doc => {
        const data = doc.data()
        console.log(`   - ID: ${doc.id}`)
        console.log(`     Email: ${data.email}`)
        console.log(`     Nom: ${data.firstName} ${data.lastName}`)
        console.log(`     Surnom: ${data.nickname || 'N/A'}`)
        console.log(`     Équipe: ${data.teamName || 'N/A'} (${data.teamId || 'N/A'})`)
        console.log(`     Numéro: ${data.number || 'N/A'}`)
        console.log('')
      })
      console.log('💡 Le joueur existe dans players mais n\'a pas de compte playerAccount')
      console.log('💡 Il faut créer un compte via /api/admin/create-account-by-email')
    } else {
      console.log('   ❌ Non trouvé dans players non plus')
    }
  }
  
  // 4. Vérifier avec différentes variantes d'email (au cas où)
  console.log('\n📋 4. Vérification avec variantes d\'email:')
  const emailVariants = [
    email,
    email.toLowerCase(),
    email.trim(),
    email.toLowerCase().trim(),
    'alywael304@GMAIL.com',
    'Alywael304@gmail.com'
  ]
  
  for (const variant of [...new Set(emailVariants)]) {
    const variantSnap = await db.collection('playerAccounts')
      .where('email', '==', variant)
      .get()
    
    if (!variantSnap.empty) {
      console.log(`   ✅ Trouvé avec "${variant}"`)
      variantSnap.forEach(doc => {
        const data = doc.data()
        console.log(`      - Email stocké: "${data.email}"`)
        console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      })
    }
  }
  
  console.log('\n✅ Vérification terminée')
}

checkSaadanyAly()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  })




