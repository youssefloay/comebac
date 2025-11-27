import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

config({ path: resolve(process.cwd(), '.env.local') })

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

async function fixAdamUsername() {
  console.log('🔧 Correction du username d\'Adam Mohamed...\n')
  
  const email = 'gendy051@gmail.com'
  
  const userProfilesSnap = await db.collection('userProfiles')
    .where('email', '==', email)
    .get()
  
  if (!userProfilesSnap.empty) {
    const doc = userProfilesSnap.docs[0]
    const data = doc.data()
    console.log(`📝 UserProfile trouvé (ID: ${doc.id}):`)
    console.log(`   Avant: Username="${data.username}"`)
    
    await doc.ref.update({
      username: 'adam',
      updatedAt: new Date()
    })
    
    console.log(`   ✅ Mis à jour: Username="adam"`)
  } else {
    console.log('❌ Aucun userProfile trouvé')
  }
  
  console.log('\n✅ Correction terminée!')
}

fixAdamUsername()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

