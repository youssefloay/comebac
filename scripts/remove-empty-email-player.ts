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

async function removeEmptyEmailPlayer() {
  console.log('🔧 Suppression du joueur avec email vide dans Ego Fc...\n')
  
  const teamId = '96nQ60wYDCUru3BOJie7'
  
  const playersSnap = await db.collection('players')
    .where('teamId', '==', teamId)
    .get()
  
  for (const playerDoc of playersSnap.docs) {
    const playerData = playerDoc.data()
    const email = playerData.email?.toLowerCase()?.trim()
    
    if (!email || email === '') {
      console.log(`📝 Joueur trouvé sans email (ID: ${playerDoc.id})`)
      console.log(`   Nom: ${playerData.firstName || playerData.name || 'N/A'}`)
      
      await playerDoc.ref.delete()
      console.log(`   ✅ Supprimé`)
    }
  }
  
  console.log('\n✅ Nettoyage terminé')
}

removeEmptyEmailPlayer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

