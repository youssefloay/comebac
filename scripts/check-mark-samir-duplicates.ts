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

async function checkMarkSamir() {
  console.log('🔍 Vérification de Mark Samir...\n')
  
  const emails = ['shereef.zoumi@gmail.com', 'marksamir515@gmail.com']
  
  // 1. Vérifier playerAccounts
  console.log('📋 1. playerAccounts:')
  for (const email of emails) {
    const paSnap = await db.collection('playerAccounts')
      .where('email', '==', email)
      .get()
    
    if (!paSnap.empty) {
      paSnap.forEach(doc => {
        const data = doc.data()
        console.log(`   ✅ ${email}:`)
        console.log(`      ID: ${doc.id}`)
        console.log(`      Nom: ${data.firstName} ${data.lastName}`)
        console.log(`      Équipe: ${data.teamName || 'N/A'}`)
        console.log(`      teamId: ${data.teamId || 'N/A'}`)
        console.log('')
      })
    }
  }
  
  // 2. Vérifier players
  console.log('📋 2. players:')
  for (const email of emails) {
    const playersSnap = await db.collection('players')
      .where('email', '==', email)
      .get()
    
    if (!playersSnap.empty) {
      playersSnap.forEach(doc => {
        const data = doc.data()
        console.log(`   ✅ ${email}:`)
        console.log(`      ID: ${doc.id}`)
        console.log(`      Nom: ${data.firstName || data.name} ${data.lastName || ''}`)
        console.log(`      Équipe: ${data.teamName || 'N/A'}`)
        console.log(`      teamId: ${data.teamId || 'N/A'}`)
        console.log('')
      })
    }
  }
  
  // 3. Vérifier accounts
  console.log('📋 3. accounts:')
  for (const email of emails) {
    const accountsSnap = await db.collection('accounts')
      .where('email', '==', email)
      .get()
    
    if (!accountsSnap.empty) {
      accountsSnap.forEach(doc => {
        const data = doc.data()
        console.log(`   ✅ ${email}:`)
        console.log(`      ID: ${doc.id}`)
        console.log(`      Nom: ${data.firstName} ${data.lastName}`)
        console.log(`      Rôle: ${data.role || 'N/A'}`)
        console.log('')
      })
    }
  }
  
  // 4. Vérifier teams.players
  console.log('📋 4. teams.players:')
  const teamsSnap = await db.collection('teams').get()
  teamsSnap.forEach(teamDoc => {
    const teamData = teamDoc.data()
    const players = teamData.players || []
    
    players.forEach((player: any) => {
      const playerEmail = player.email?.toLowerCase()?.trim()
      if (emails.some(e => e.toLowerCase() === playerEmail)) {
        console.log(`   ✅ ${playerEmail} dans équipe "${teamData.name}":`)
        console.log(`      Nom: ${player.firstName} ${player.lastName}`)
        console.log(`      Numéro: ${player.number || player.jerseyNumber || 'N/A'}`)
        console.log('')
      }
    })
  })
  
  // 5. Vérifier teamRegistrations
  console.log('📋 5. teamRegistrations:')
  const regSnap = await db.collection('teamRegistrations').get()
  regSnap.forEach(regDoc => {
    const regData = regDoc.data()
    const players = regData.players || []
    
    players.forEach((player: any) => {
      const playerEmail = player.email?.toLowerCase()?.trim()
      if (emails.some(e => e.toLowerCase() === playerEmail)) {
        console.log(`   ✅ ${playerEmail} dans inscription "${regData.teamName}":`)
        console.log(`      Nom: ${player.firstName} ${player.lastName}`)
        console.log(`      Numéro: ${player.jerseyNumber || player.number || 'N/A'}`)
        console.log('')
      }
    })
  })
  
  console.log('✅ Vérification terminée')
}

checkMarkSamir()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

