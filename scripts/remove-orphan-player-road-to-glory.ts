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

async function removeOrphanPlayer() {
  console.log('🔧 Suppression du joueur orphelin dans players...\n')
  
  const teamId = '6HKmkOQEhvZqAfOt1cGT'
  const orphanEmail = 'aleyeldingasser@gmail.com'
  
  // Trouver le joueur dans players
  const playersSnap = await db.collection('players')
    .where('teamId', '==', teamId)
    .where('email', '==', orphanEmail)
    .get()
  
  if (playersSnap.empty) {
    console.log('❌ Joueur non trouvé dans players')
    return
  }
  
  console.log(`📊 ${playersSnap.size} document(s) trouvé(s) pour ${orphanEmail}`)
  
  for (const playerDoc of playersSnap.docs) {
    const playerData = playerDoc.data()
    console.log(`\n📝 Document ID: ${playerDoc.id}`)
    console.log(`   Nom: ${playerData.firstName || playerData.name || 'N/A'}`)
    console.log(`   Email: ${playerData.email}`)
    
    try {
      await playerDoc.ref.delete()
      console.log(`   ✅ Document supprimé`)
    } catch (error: any) {
      console.error(`   ❌ Erreur lors de la suppression: ${error.message}`)
    }
  }
  
  console.log('\n✅ Suppression terminée')
}

removeOrphanPlayer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

