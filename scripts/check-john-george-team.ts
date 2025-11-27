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

async function checkJohnGeorgeTeam() {
  console.log('🔍 Recherche de John George...\n')
  
  // 1. Vérifier dans teamRegistrations
  console.log('📋 1. teamRegistrations:')
  const regSnap = await db.collection('teamRegistrations').get()
  
  for (const regDoc of regSnap.docs) {
    const regData = regDoc.data()
    const players = regData.players || []
    
    const johnGeorge = players.find((p: any) => 
      p.firstName === 'John' && p.lastName === 'George'
    )
    
    if (johnGeorge) {
      console.log(`   ✅ Trouvé dans l'inscription "${regData.teamName}":`)
      console.log(`      Email: ${johnGeorge.email || 'MANQUANT'}`)
      console.log(`      Numéro: ${johnGeorge.jerseyNumber || johnGeorge.number || 'N/A'}`)
      console.log(`      Position: ${johnGeorge.position || 'N/A'}`)
      console.log(`      Téléphone: ${johnGeorge.phone || 'N/A'}`)
      console.log(`      Statut inscription: ${regData.status || 'N/A'}`)
      console.log('')
    }
  }
  
  // 2. Vérifier dans playerAccounts
  console.log('📋 2. playerAccounts:')
  const paSnap = await db.collection('playerAccounts').get()
  
  for (const doc of paSnap.docs) {
    const data = doc.data()
    if (data.firstName === 'John' && data.lastName === 'George') {
      console.log(`   ✅ Trouvé dans playerAccounts:`)
      console.log(`      Email: ${data.email || 'MANQUANT'}`)
      console.log(`      Équipe: ${data.teamName || 'N/A'}`)
      console.log(`      teamId: ${data.teamId || 'N/A'}`)
      console.log(`      Numéro: ${data.jerseyNumber || data.number || 'N/A'}`)
      console.log('')
    }
  }
  
  // 3. Vérifier dans teams.players
  console.log('📋 3. teams.players:')
  const teamsSnap = await db.collection('teams').get()
  
  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data()
    const players = teamData.players || []
    
    const johnGeorge = players.find((p: any) => 
      p.firstName === 'John' && p.lastName === 'George'
    )
    
    if (johnGeorge) {
      console.log(`   ✅ Trouvé dans l'équipe "${teamData.name}":`)
      console.log(`      Email: ${johnGeorge.email || 'MANQUANT'}`)
      console.log(`      Numéro: ${johnGeorge.number || johnGeorge.jerseyNumber || 'N/A'}`)
      console.log('')
    }
  }
  
  // 4. Vérifier dans players
  console.log('📋 4. players:')
  const playersSnap = await db.collection('players').get()
  
  for (const doc of playersSnap.docs) {
    const data = doc.data()
    if ((data.firstName === 'John' && data.lastName === 'George') ||
        (data.name && data.name.includes('John') && data.name.includes('George'))) {
      console.log(`   ✅ Trouvé dans players:`)
      console.log(`      Email: ${data.email || 'MANQUANT'}`)
      console.log(`      Équipe: ${data.teamName || 'N/A'}`)
      console.log(`      teamId: ${data.teamId || 'N/A'}`)
      console.log('')
    }
  }
  
  console.log('✅ Vérification terminée')
}

checkJohnGeorgeTeam()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

