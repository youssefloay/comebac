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

async function verifyGmaillFix() {
  console.log('🔍 Vérification qu\'il ne reste plus d\'emails @gmaill.com...\n')
  
  const found: string[] = []
  
  // Vérifier accounts
  const accountsSnap = await db.collection('accounts').get()
  accountsSnap.forEach(doc => {
    const email = doc.data().email
    if (email && email.includes('@gmaill.com')) {
      found.push(`accounts/${doc.id}: ${email}`)
    }
  })
  
  // Vérifier playerAccounts
  const playerAccountsSnap = await db.collection('playerAccounts').get()
  playerAccountsSnap.forEach(doc => {
    const email = doc.data().email
    if (email && email.includes('@gmaill.com')) {
      found.push(`playerAccounts/${doc.id}: ${email}`)
    }
  })
  
  // Vérifier coachAccounts
  const coachAccountsSnap = await db.collection('coachAccounts').get()
  coachAccountsSnap.forEach(doc => {
    const email = doc.data().email
    if (email && email.includes('@gmaill.com')) {
      found.push(`coachAccounts/${doc.id}: ${email}`)
    }
  })
  
  // Vérifier players
  const playersSnap = await db.collection('players').get()
  playersSnap.forEach(doc => {
    const email = doc.data().email
    if (email && email.includes('@gmaill.com')) {
      found.push(`players/${doc.id}: ${email}`)
    }
  })
  
  // Vérifier teams
  const teamsSnap = await db.collection('teams').get()
  teamsSnap.forEach(doc => {
    const teamData = doc.data()
    if (teamData.coach?.email && teamData.coach.email.includes('@gmaill.com')) {
      found.push(`teams/${doc.id}/coach: ${teamData.coach.email}`)
    }
    if (teamData.players) {
      teamData.players.forEach((player: any, index: number) => {
        if (player.email && player.email.includes('@gmaill.com')) {
          found.push(`teams/${doc.id}/players[${index}]: ${player.email}`)
        }
      })
    }
  })
  
  // Vérifier teamRegistrations
  const registrationsSnap = await db.collection('teamRegistrations').get()
  registrationsSnap.forEach(doc => {
    const regData = doc.data()
    if (regData.captain?.email && regData.captain.email.includes('@gmaill.com')) {
      found.push(`teamRegistrations/${doc.id}/captain: ${regData.captain.email}`)
    }
    if (regData.coach?.email && regData.coach.email.includes('@gmaill.com')) {
      found.push(`teamRegistrations/${doc.id}/coach: ${regData.coach.email}`)
    }
    if (regData.players) {
      regData.players.forEach((player: any, index: number) => {
        if (player.email && player.email.includes('@gmaill.com')) {
          found.push(`teamRegistrations/${doc.id}/players[${index}]: ${player.email}`)
        }
      })
    }
  })
  
  if (found.length === 0) {
    console.log('✅ Aucun email @gmaill.com trouvé! Tous les emails ont été corrigés.')
  } else {
    console.log(`❌ ${found.length} emails @gmaill.com trouvés:`)
    found.forEach(f => console.log(`   - ${f}`))
  }
}

verifyGmaillFix()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

