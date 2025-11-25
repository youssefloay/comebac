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

async function checkMichaelWaguihReplacement() {
  console.log('🔍 Vérification du remplacement de Mark Samir par Michael Waguih...')
  console.log('============================================================\n')

  const markSamirEmail = 'mark.samir@example.com' // À ajuster selon l'email réel
  const michaelWaguihEmail = 'michael.waguih@example.com' // À ajuster selon l'email réel

  // Chercher dans toutes les collections
  console.log('1️⃣ Recherche dans teamRegistrations...')
  const registrationsSnap = await db.collection('teamRegistrations').get()
  let foundMarkInRegistrations = false
  let foundMichaelInRegistrations = false
  let teamName = ''

  for (const doc of registrationsSnap.docs) {
    const data = doc.data()
    if (data.players && Array.isArray(data.players)) {
      const markPlayer = data.players.find((p: any) => 
        p.email?.toLowerCase().includes('mark') || 
        p.email?.toLowerCase().includes('samir') ||
        (p.firstName?.toLowerCase().includes('mark') && p.lastName?.toLowerCase().includes('samir'))
      )
      const michaelPlayer = data.players.find((p: any) => 
        p.email?.toLowerCase().includes('michael') || 
        p.email?.toLowerCase().includes('waguih') ||
        (p.firstName?.toLowerCase().includes('michael') && p.lastName?.toLowerCase().includes('waguih'))
      )

      if (markPlayer) {
        foundMarkInRegistrations = true
        teamName = data.teamName || ''
        console.log(`   ✅ Mark Samir trouvé dans l'inscription "${data.teamName}":`)
        console.log(`      - Email: ${markPlayer.email}`)
        console.log(`      - Nom: ${markPlayer.firstName} ${markPlayer.lastName}`)
      }

      if (michaelPlayer) {
        foundMichaelInRegistrations = true
        if (!teamName) teamName = data.teamName || ''
        console.log(`   ✅ Michael Waguih trouvé dans l'inscription "${data.teamName}":`)
        console.log(`      - Email: ${michaelPlayer.email}`)
        console.log(`      - Nom: ${michaelPlayer.firstName} ${michaelPlayer.lastName}`)
      }
    }
  }

  if (!foundMarkInRegistrations && !foundMichaelInRegistrations) {
    console.log('   ⚠️  Aucun joueur trouvé dans teamRegistrations')
  }

  console.log('\n2️⃣ Recherche dans teams...')
  const teamsSnap = await db.collection('teams').get()
  let foundMarkInTeams = false
  let foundMichaelInTeams = false

  for (const doc of teamsSnap.docs) {
    const data = doc.data()
    if (data.players && Array.isArray(data.players)) {
      const markPlayer = data.players.find((p: any) => 
        p.email?.toLowerCase().includes('mark') || 
        p.email?.toLowerCase().includes('samir') ||
        (p.firstName?.toLowerCase().includes('mark') && p.lastName?.toLowerCase().includes('samir'))
      )
      const michaelPlayer = data.players.find((p: any) => 
        p.email?.toLowerCase().includes('michael') || 
        p.email?.toLowerCase().includes('waguih') ||
        (p.firstName?.toLowerCase().includes('michael') && p.lastName?.toLowerCase().includes('waguih'))
      )

      if (markPlayer) {
        foundMarkInTeams = true
        console.log(`   ✅ Mark Samir trouvé dans l'équipe "${data.name}":`)
        console.log(`      - Email: ${markPlayer.email}`)
        console.log(`      - Nom: ${markPlayer.firstName} ${markPlayer.lastName}`)
      }

      if (michaelPlayer) {
        foundMichaelInTeams = true
        console.log(`   ✅ Michael Waguih trouvé dans l'équipe "${data.name}":`)
        console.log(`      - Email: ${michaelPlayer.email}`)
        console.log(`      - Nom: ${michaelPlayer.firstName} ${michaelPlayer.lastName}`)
      }
    }
  }

  if (!foundMarkInTeams && !foundMichaelInTeams) {
    console.log('   ⚠️  Aucun joueur trouvé dans teams')
  }

  console.log('\n3️⃣ Recherche dans players...')
  const playersSnap = await db.collection('players').get()
  let foundMarkInPlayers = false
  let foundMichaelInPlayers = false

  for (const doc of playersSnap.docs) {
    const data = doc.data()
    const isMark = 
      data.email?.toLowerCase().includes('mark') || 
      data.email?.toLowerCase().includes('samir') ||
      (data.firstName?.toLowerCase().includes('mark') && data.lastName?.toLowerCase().includes('samir'))
    const isMichael = 
      data.email?.toLowerCase().includes('michael') || 
      data.email?.toLowerCase().includes('waguih') ||
      (data.firstName?.toLowerCase().includes('michael') && data.lastName?.toLowerCase().includes('waguih'))

    if (isMark) {
      foundMarkInPlayers = true
      console.log(`   ✅ Mark Samir trouvé dans players:`)
      console.log(`      - ID: ${doc.id}`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - Équipe: ${data.teamId || 'N/A'}`)
    }

    if (isMichael) {
      foundMichaelInPlayers = true
      console.log(`   ✅ Michael Waguih trouvé dans players:`)
      console.log(`      - ID: ${doc.id}`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - Équipe: ${data.teamId || 'N/A'}`)
    }
  }

  if (!foundMarkInPlayers && !foundMichaelInPlayers) {
    console.log('   ⚠️  Aucun joueur trouvé dans players')
  }

  console.log('\n4️⃣ Recherche dans playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts').get()
  let foundMarkInAccounts = false
  let foundMichaelInAccounts = false

  for (const doc of playerAccountsSnap.docs) {
    const data = doc.data()
    const isMark = 
      data.email?.toLowerCase().includes('mark') || 
      data.email?.toLowerCase().includes('samir') ||
      (data.firstName?.toLowerCase().includes('mark') && data.lastName?.toLowerCase().includes('samir'))
    const isMichael = 
      data.email?.toLowerCase().includes('michael') || 
      data.email?.toLowerCase().includes('waguih') ||
      (data.firstName?.toLowerCase().includes('michael') && data.lastName?.toLowerCase().includes('waguih'))

    if (isMark) {
      foundMarkInAccounts = true
      console.log(`   ✅ Mark Samir trouvé dans playerAccounts:`)
      console.log(`      - ID: ${doc.id}`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - Équipe: ${data.teamId || 'N/A'}`)
    }

    if (isMichael) {
      foundMichaelInAccounts = true
      console.log(`   ✅ Michael Waguih trouvé dans playerAccounts:`)
      console.log(`      - ID: ${doc.id}`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - Équipe: ${data.teamId || 'N/A'}`)
    }
  }

  if (!foundMarkInAccounts && !foundMichaelInAccounts) {
    console.log('   ⚠️  Aucun joueur trouvé dans playerAccounts')
  }

  console.log('\n============================================================')
  console.log('📊 RÉSUMÉ:')
  console.log('============================================================')
  console.log(`Mark Samir:`)
  console.log(`   - teamRegistrations: ${foundMarkInRegistrations ? '✅ OUI' : '❌ NON'}`)
  console.log(`   - teams: ${foundMarkInTeams ? '✅ OUI' : '❌ NON'}`)
  console.log(`   - players: ${foundMarkInPlayers ? '✅ OUI' : '❌ NON'}`)
  console.log(`   - playerAccounts: ${foundMarkInAccounts ? '✅ OUI' : '❌ NON'}`)
  console.log(`\nMichael Waguih:`)
  console.log(`   - teamRegistrations: ${foundMichaelInRegistrations ? '✅ OUI' : '❌ NON'}`)
  console.log(`   - teams: ${foundMichaelInTeams ? '✅ OUI' : '❌ NON'}`)
  console.log(`   - players: ${foundMichaelInPlayers ? '✅ OUI' : '❌ NON'}`)
  console.log(`   - playerAccounts: ${foundMichaelInAccounts ? '✅ OUI' : '❌ NON'}`)
  
  if (foundMarkInRegistrations || foundMarkInTeams || foundMarkInPlayers || foundMarkInAccounts) {
    console.log('\n⚠️  ATTENTION: Mark Samir est encore présent dans certaines collections!')
  }
  
  if (foundMichaelInRegistrations && foundMichaelInTeams && foundMichaelInPlayers && foundMichaelInAccounts) {
    console.log('\n✅ Michael Waguih est présent dans toutes les collections!')
  } else if (foundMichaelInRegistrations || foundMichaelInTeams || foundMichaelInPlayers || foundMichaelInAccounts) {
    console.log('\n⚠️  Michael Waguih n\'est pas présent dans toutes les collections!')
  }
}

checkMichaelWaguihReplacement().catch(console.error)

