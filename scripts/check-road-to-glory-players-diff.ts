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

async function checkDifference() {
  console.log('🔍 Vérification de la différence entre players et playerAccounts...\n')
  
  const teamId = '6HKmkOQEhvZqAfOt1cGT'
  
  // Récupérer playerAccounts
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  const playerAccountsEmails = new Set(
    playerAccountsSnap.docs.map(doc => doc.data().email?.toLowerCase()?.trim()).filter(Boolean)
  )
  
  console.log(`📊 PlayerAccounts (${playerAccountsEmails.size}):`)
  playerAccountsSnap.docs.forEach(doc => {
    const data = doc.data()
    console.log(`   - ${data.email} (${data.firstName} ${data.lastName})`)
  })
  
  // Récupérer players
  const playersSnap = await db.collection('players')
    .where('teamId', '==', teamId)
    .get()
  
  const playersEmails = new Set(
    playersSnap.docs.map(doc => doc.data().email?.toLowerCase()?.trim()).filter(Boolean)
  )
  
  console.log(`\n📊 Players (${playersEmails.size}):`)
  playersSnap.docs.forEach(doc => {
    const data = doc.data()
    console.log(`   - ${data.email} (${data.firstName || data.name || 'N/A'})`)
  })
  
  // Trouver les différences
  const inPlayersNotInAccounts = Array.from(playersEmails).filter(email => !playerAccountsEmails.has(email))
  const inAccountsNotInPlayers = Array.from(playerAccountsEmails).filter(email => !playersEmails.has(email))
  
  console.log('\n📊 Différences:')
  if (inPlayersNotInAccounts.length > 0) {
    console.log(`\n❌ Dans players mais PAS dans playerAccounts (${inPlayersNotInAccounts.length}):`)
    inPlayersNotInAccounts.forEach(email => console.log(`   - ${email}`))
  }
  
  if (inAccountsNotInPlayers.length > 0) {
    console.log(`\n❌ Dans playerAccounts mais PAS dans players (${inAccountsNotInPlayers.length}):`)
    inAccountsNotInPlayers.forEach(email => console.log(`   - ${email}`))
  }
  
  if (inPlayersNotInAccounts.length === 0 && inAccountsNotInPlayers.length === 0) {
    console.log('✅ Aucune différence! Les deux collections sont synchronisées.')
  }
}

checkDifference()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

