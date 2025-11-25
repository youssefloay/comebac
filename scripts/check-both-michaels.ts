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

async function checkBothMichaels() {
  console.log('🔍 Vérification des deux Michaels dans l\'équipe Saints...')
  console.log('============================================================\n')

  const saintsTeamId = 'MHBdumu4cSU6ExLRlrrj'
  const michaelWaguihEmail = 'michaelawaguih0@gmail.com'
  const naguiEmail = 'michaelnagui033@gmail.com'

  // 1. Vérifier dans teamRegistrations
  console.log('1️⃣ teamRegistrations:')
  const registrationsSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', 'Saints')
    .get()

  if (!registrationsSnap.empty) {
    const regData = registrationsSnap.docs[0].data()
    if (regData.players && Array.isArray(regData.players)) {
      console.log(`   📋 Liste des joueurs dans l'inscription:`)
      regData.players.forEach((p: any, i: number) => {
        const isWaguih = p.email?.toLowerCase().includes('waguih') || p.email === michaelWaguihEmail
        const isNagui = p.email?.toLowerCase().includes('nagui') || p.email === naguiEmail
        const marker = isWaguih ? ' 👤 (Michael Waguih)' : isNagui ? ' 👤 (Nagui Micheal)' : ''
        console.log(`      ${i + 1}. ${p.firstName} ${p.lastName} (${p.email})${marker}`)
      })
    }
  }

  // 2. Vérifier dans teams.players
  console.log('\n2️⃣ teams.players:')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Saints')
    .get()

  if (!teamsSnap.empty) {
    const teamData = teamsSnap.docs[0].data()
    if (teamData.players && Array.isArray(teamData.players)) {
      console.log(`   📋 Liste des joueurs dans teams.players:`)
      teamData.players.forEach((p: any, i: number) => {
        const isWaguih = p.email?.toLowerCase().includes('waguih') || p.email === michaelWaguihEmail
        const isNagui = p.email?.toLowerCase().includes('nagui') || p.email === naguiEmail
        const marker = isWaguih ? ' 👤 (Michael Waguih)' : isNagui ? ' 👤 (Nagui Micheal)' : ''
        console.log(`      ${i + 1}. ${p.firstName} ${p.lastName} (${p.email})${marker}`)
      })
    }
  }

  // 3. Vérifier dans players
  console.log('\n3️⃣ players:')
  const playersSnap = await db.collection('players')
    .where('teamId', '==', saintsTeamId)
    .get()

  console.log(`   📋 Liste des joueurs dans players pour Saints:`)
  playersSnap.docs.forEach((doc, i) => {
    const data = doc.data()
    const isWaguih = data.email?.toLowerCase().includes('waguih') || data.email === michaelWaguihEmail
    const isNagui = data.email?.toLowerCase().includes('nagui') || data.email === naguiEmail
    const marker = isWaguih ? ' 👤 (Michael Waguih)' : isNagui ? ' 👤 (Nagui Micheal)' : ''
    console.log(`      ${i + 1}. ${data.firstName} ${data.lastName} (${data.email})${marker}`)
  })

  // 4. Vérifier dans playerAccounts
  console.log('\n4️⃣ playerAccounts:')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('teamId', '==', saintsTeamId)
    .get()

  console.log(`   📋 Liste des comptes dans playerAccounts pour Saints:`)
  playerAccountsSnap.docs.forEach((doc, i) => {
    const data = doc.data()
    const isWaguih = data.email?.toLowerCase().includes('waguih') || data.email === michaelWaguihEmail
    const isNagui = data.email?.toLowerCase().includes('nagui') || data.email === naguiEmail
    const marker = isWaguih ? ' 👤 (Michael Waguih)' : isNagui ? ' 👤 (Nagui Micheal)' : ''
    console.log(`      ${i + 1}. ${data.firstName} ${data.lastName} (${data.email})${marker}`)
  })

  // 5. Recherche spécifique de Michael Waguih
  console.log('\n5️⃣ Recherche spécifique de Michael Waguih (michaelawaguih0@gmail.com):')
  const waguihInPlayers = playersSnap.docs.find(doc => 
    doc.data().email?.toLowerCase() === michaelWaguihEmail.toLowerCase()
  )
  const waguihInAccounts = playerAccountsSnap.docs.find(doc => 
    doc.data().email?.toLowerCase() === michaelWaguihEmail.toLowerCase()
  )

  if (waguihInPlayers) {
    const data = waguihInPlayers.data()
    console.log(`   ✅ Trouvé dans players:`)
    console.log(`      - ID: ${waguihInPlayers.id}`)
    console.log(`      - Email: ${data.email}`)
    console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
    console.log(`      - Team ID: ${data.teamId}`)
  } else {
    console.log(`   ❌ NON trouvé dans players`)
  }

  if (waguihInAccounts) {
    const data = waguihInAccounts.data()
    console.log(`   ✅ Trouvé dans playerAccounts:`)
    console.log(`      - ID: ${waguihInAccounts.id}`)
    console.log(`      - Email: ${data.email}`)
    console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
    console.log(`      - Team ID: ${data.teamId}`)
  } else {
    console.log(`   ❌ NON trouvé dans playerAccounts`)
  }

  console.log('\n============================================================')
  console.log('📊 CONCLUSION:')
  console.log('============================================================')
}

checkBothMichaels().catch(console.error)

