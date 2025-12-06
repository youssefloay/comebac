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

async function fixOmarSa3idActingCoach() {
  console.log('🔧 Correction du flag isActingCoach pour Omar Sa3id...\n')
  
  const email = 'omarhichamsaied96@gmail.com'
  
  // Trouver Omar Sa3id dans playerAccounts
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (playerAccountsSnap.empty) {
    console.log('❌ Omar Sa3id non trouvé dans playerAccounts')
    return
  }
  
  for (const doc of playerAccountsSnap.docs) {
    const data = doc.data()
    console.log(`📝 Omar Sa3id trouvé:`)
    console.log(`   - ID: ${doc.id}`)
    console.log(`   - Nom: ${data.firstName} ${data.lastName}`)
    console.log(`   - Email: ${data.email}`)
    console.log(`   - teamId: ${data.teamId}`)
    console.log(`   - teamName: ${data.teamName}`)
    console.log(`   - isActingCoach actuel: ${data.isActingCoach || false}`)
    console.log('')
    
    if (data.isActingCoach === true) {
      console.log(`   ⚠️  isActingCoach est à true, correction...`)
      await doc.ref.update({
        isActingCoach: false
      })
      console.log(`   ✅ isActingCoach mis à false`)
    } else {
      console.log(`   ✅ isActingCoach est déjà à false`)
    }
    console.log('')
  }
  
  console.log('✅ Correction terminée')
}

fixOmarSa3idActingCoach()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })





