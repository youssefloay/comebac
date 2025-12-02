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

async function checkIconsStatus() {
  console.log('🔍 Vérification du statut de l\'équipe Icons...\n')
  
  // Chercher Icons
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Icons')
    .get()
  
  if (teamsSnap.empty) {
    console.log('❌ Équipe Icons non trouvée')
    return
  }
  
  teamsSnap.docs.forEach(doc => {
    const data = doc.data()
    console.log(`✅ Équipe Icons trouvée:`)
    console.log(`   - ID: ${doc.id}`)
    console.log(`   - Nom: ${data.name}`)
    console.log(`   - isActive: ${data.isActive} (type: ${typeof data.isActive})`)
    console.log(`   - isActive === false: ${data.isActive === false}`)
    console.log(`   - isActive !== false: ${data.isActive !== false}`)
    console.log(`   - isActive == null: ${data.isActive == null}`)
    console.log(`   - isActive === undefined: ${data.isActive === undefined}`)
    console.log('')
  })
  
  // Tester la requête avec != false
  console.log('📋 Test de la requête where("isActive", "!=", false):')
  const activeQuery = await db.collection('teams')
    .where('isActive', '!=', false)
    .get()
  
  const iconsInActive = activeQuery.docs.find(doc => doc.data().name === 'Icons')
  if (iconsInActive) {
    console.log(`   ⚠️  Icons EST retournée par la requête != false`)
    console.log(`   - Données: ${JSON.stringify(iconsInActive.data())}`)
  } else {
    console.log(`   ✅ Icons N'EST PAS retournée par la requête != false`)
  }
  console.log('')
  
  // Tester la requête avec == true
  console.log('📋 Test de la requête where("isActive", "==", true):')
  const trueQuery = await db.collection('teams')
    .where('isActive', '==', true)
    .get()
  
  const iconsInTrue = trueQuery.docs.find(doc => doc.data().name === 'Icons')
  if (iconsInTrue) {
    console.log(`   ⚠️  Icons EST retournée par la requête == true`)
  } else {
    console.log(`   ✅ Icons N'EST PAS retournée par la requête == true`)
  }
  console.log('')
  
  console.log('✅ Vérification terminée')
}

checkIconsStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

