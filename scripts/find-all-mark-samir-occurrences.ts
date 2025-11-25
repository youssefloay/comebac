import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

async function findAllMarkSamirOccurrences() {
  console.log('🔍 Recherche complète de Mark Samir dans toutes les collections...')
  console.log('============================================================\n')

  const markEmails = [
    'marksamir515@gmail.com',
    'marksamir515@gmaill.com',
    'mark.samir@example.com'
  ]
  const markNames = ['mark', 'samir']

  // 1. teamRegistrations
  console.log('1️⃣ teamRegistrations:')
  const registrationsSnap = await db.collection('teamRegistrations').get()
  let foundInRegistrations = 0
  
  for (const doc of registrationsSnap.docs) {
    const data = doc.data()
    if (data.players && Array.isArray(data.players)) {
      for (const player of data.players) {
        const email = player.email?.toLowerCase() || ''
        const firstName = player.firstName?.toLowerCase() || ''
        const lastName = player.lastName?.toLowerCase() || ''
        
        const isMark = markEmails.some(e => email.includes(e.split('@')[0])) ||
                      (firstName.includes('mark') && lastName.includes('samir'))
        
        if (isMark) {
          foundInRegistrations++
          console.log(`   ⚠️  Trouvé dans "${data.teamName}":`)
          console.log(`      - Email: ${player.email}`)
          console.log(`      - Nom: ${player.firstName} ${player.lastName}`)
          console.log(`      - Document ID: ${doc.id}`)
        }
      }
    }
  }
  
  if (foundInRegistrations === 0) {
    console.log('   ✅ Aucune occurrence trouvée')
  }

  // 2. teams
  console.log('\n2️⃣ teams:')
  const teamsSnap = await db.collection('teams').get()
  let foundInTeams = 0
  
  for (const doc of teamsSnap.docs) {
    const data = doc.data()
    if (data.players && Array.isArray(data.players)) {
      for (const player of data.players) {
        const email = player.email?.toLowerCase() || ''
        const firstName = player.firstName?.toLowerCase() || ''
        const lastName = player.lastName?.toLowerCase() || ''
        
        const isMark = markEmails.some(e => email.includes(e.split('@')[0])) ||
                      (firstName.includes('mark') && lastName.includes('samir'))
        
        if (isMark) {
          foundInTeams++
          console.log(`   ⚠️  Trouvé dans "${data.name}":`)
          console.log(`      - Email: ${player.email}`)
          console.log(`      - Nom: ${player.firstName} ${player.lastName}`)
          console.log(`      - Team ID: ${doc.id}`)
        }
      }
    }
  }
  
  if (foundInTeams === 0) {
    console.log('   ✅ Aucune occurrence trouvée')
  }

  // 3. players
  console.log('\n3️⃣ players:')
  const playersSnap = await db.collection('players').get()
  let foundInPlayers = 0
  
  for (const doc of playersSnap.docs) {
    const data = doc.data()
    const email = data.email?.toLowerCase() || ''
    const firstName = data.firstName?.toLowerCase() || ''
    const lastName = data.lastName?.toLowerCase() || ''
    
    const isMark = markEmails.some(e => email.includes(e.split('@')[0])) ||
                  (firstName.includes('mark') && lastName.includes('samir'))
    
    if (isMark) {
      foundInPlayers++
      console.log(`   ⚠️  Trouvé:`)
      console.log(`      - ID: ${doc.id}`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - Team ID: ${data.teamId || 'N/A'}`)
    }
  }
  
  if (foundInPlayers === 0) {
    console.log('   ✅ Aucune occurrence trouvée')
  }

  // 4. playerAccounts
  console.log('\n4️⃣ playerAccounts:')
  const playerAccountsSnap = await db.collection('playerAccounts').get()
  let foundInAccounts = 0
  
  for (const doc of playerAccountsSnap.docs) {
    const data = doc.data()
    const email = data.email?.toLowerCase() || ''
    const firstName = data.firstName?.toLowerCase() || ''
    const lastName = data.lastName?.toLowerCase() || ''
    
    const isMark = markEmails.some(e => email.includes(e.split('@')[0])) ||
                  (firstName.includes('mark') && lastName.includes('samir'))
    
    if (isMark) {
      foundInAccounts++
      console.log(`   ⚠️  Trouvé:`)
      console.log(`      - ID: ${doc.id}`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - Team ID: ${data.teamId || 'N/A'}`)
    }
  }
  
  if (foundInAccounts === 0) {
    console.log('   ✅ Aucune occurrence trouvée')
  }

  console.log('\n============================================================')
  console.log('📊 RÉSUMÉ:')
  console.log('============================================================')
  console.log(`teamRegistrations: ${foundInRegistrations} occurrence(s)`)
  console.log(`teams: ${foundInTeams} occurrence(s)`)
  console.log(`players: ${foundInPlayers} occurrence(s)`)
  console.log(`playerAccounts: ${foundInAccounts} occurrence(s)`)
  console.log(`\nTotal: ${foundInRegistrations + foundInTeams + foundInPlayers + foundInAccounts} occurrence(s)`)
}

findAllMarkSamirOccurrences().catch(console.error)

