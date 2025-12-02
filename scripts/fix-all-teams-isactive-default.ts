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

async function fixAllTeamsIsActiveDefault() {
  console.log('🔧 Ajout du champ isActive à toutes les équipes...\n')
  
  // Récupérer toutes les équipes
  const teamsSnap = await db.collection('teams').get()
  console.log(`📊 ${teamsSnap.size} équipe(s) trouvée(s)\n`)
  
  let updated = 0
  let alreadySet = 0
  
  for (const doc of teamsSnap.docs) {
    const data = doc.data()
    const teamName = data.name || 'Sans nom'
    
    // Si isActive n'existe pas, le définir à true par défaut
    if (data.isActive === undefined) {
      console.log(`📝 ${teamName}: Ajout de isActive: true`)
      await doc.ref.update({
        isActive: true
      })
      updated++
    } else {
      console.log(`✅ ${teamName}: isActive déjà défini (${data.isActive})`)
      alreadySet++
    }
  }
  
  console.log(`\n✅ Correction terminée:`)
  console.log(`   - ${updated} équipe(s) mise(s) à jour`)
  console.log(`   - ${alreadySet} équipe(s) déjà configurée(s)`)
}

fixAllTeamsIsActiveDefault()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

