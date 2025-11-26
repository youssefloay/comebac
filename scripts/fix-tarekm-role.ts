import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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

async function fixTarekmRole() {
  console.log('🔧 Correction du rôle pour tarekm20053@gmail.com...\n')
  
  const email = 'tarekm20053@gmail.com'
  
  // 1. Mettre à jour users
  console.log('📝 1. Mise à jour de users...')
  const usersSnap = await db.collection('users')
    .where('email', '==', email)
    .get()
  
  if (!usersSnap.empty) {
    for (const doc of usersSnap.docs) {
      await doc.ref.update({
        role: 'player',
        updatedAt: new Date()
      })
      console.log(`✅ users mis à jour: ${doc.id} -> role: 'player'`)
    }
  } else {
    console.log('   ⚠️  Aucun document trouvé dans users')
  }
  
  // 2. Mettre à jour userProfiles
  console.log('\n📝 2. Mise à jour de userProfiles...')
  const profilesSnap = await db.collection('userProfiles')
    .where('email', '==', email)
    .get()
  
  if (!profilesSnap.empty) {
    for (const doc of profilesSnap.docs) {
      await doc.ref.update({
        role: 'player',
        updatedAt: new Date()
      })
      console.log(`✅ userProfiles mis à jour: ${doc.id} -> role: 'player'`)
    }
  } else {
    console.log('   ⚠️  Aucun document trouvé dans userProfiles')
  }
  
  console.log('\n✅ Correction terminée!')
  console.log('   L\'utilisateur devrait maintenant voir le bouton pour basculer sur l\'interface joueur.')
}

fixTarekmRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

