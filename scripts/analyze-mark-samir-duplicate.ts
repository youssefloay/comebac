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

async function analyzeMarkSamir() {
  console.log('🔍 Analyse détaillée de Mark Samir...\n')
  
  const email1 = 'shereef.zoumi@gmail.com'
  const email2 = 'marksamir515@gmail.com'
  
  console.log('📋 Comparaison des deux entrées:\n')
  
  // playerAccounts
  const pa1 = await db.collection('playerAccounts')
    .where('email', '==', email1)
    .limit(1)
    .get()
  
  const pa2 = await db.collection('playerAccounts')
    .where('email', '==', email2)
    .limit(1)
    .get()
  
  console.log('1️⃣ shereef.zoumi@gmail.com:')
  if (!pa1.empty) {
    const data1 = pa1.docs[0].data()
    console.log(`   ID: ${pa1.docs[0].id}`)
    console.log(`   Créé: ${data1.createdAt?.toDate() || 'N/A'}`)
    console.log(`   Modifié: ${data1.updatedAt?.toDate() || 'N/A'}`)
    console.log(`   Numéro: ${data1.jerseyNumber || data1.number || 'N/A'}`)
    console.log(`   Position: ${data1.position || 'N/A'}`)
    console.log(`   Téléphone: ${data1.phone || 'N/A'}`)
  }
  
  console.log('\n2️⃣ marksamir515@gmail.com:')
  if (!pa2.empty) {
    const data2 = pa2.docs[0].data()
    console.log(`   ID: ${pa2.docs[0].id}`)
    console.log(`   Créé: ${data2.createdAt?.toDate() || 'N/A'}`)
    console.log(`   Modifié: ${data2.updatedAt?.toDate() || 'N/A'}`)
    console.log(`   Numéro: ${data2.jerseyNumber || data2.number || 'N/A'}`)
    console.log(`   Position: ${data2.position || 'N/A'}`)
    console.log(`   Téléphone: ${data2.phone || 'N/A'}`)
  }
  
  // Vérifier dans teamRegistrations (source originale)
  console.log('\n📋 Source originale (teamRegistrations):')
  const regSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', 'Santos ')
    .get()
  
  if (!regSnap.empty) {
    const regData = regSnap.docs[0].data()
    const players = regData.players || []
    const markInReg = players.find((p: any) => 
      p.firstName === 'Mark' && p.lastName === 'Samir'
    )
    
    if (markInReg) {
      console.log(`   Email dans l'inscription: ${markInReg.email || 'MANQUANT'}`)
      console.log(`   Numéro: ${markInReg.jerseyNumber || markInReg.number || 'N/A'}`)
      console.log(`   Téléphone: ${markInReg.phone || 'N/A'}`)
    }
  }
  
  console.log('\n✅ Analyse terminée')
  console.log('\n💡 Recommandation:')
  console.log('   - Vérifier quel email est le bon (probablement celui dans teamRegistrations)')
  console.log('   - Supprimer l\'entrée avec le mauvais email')
  console.log('   - Synchroniser toutes les collections avec le bon email')
}

analyzeMarkSamir()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

