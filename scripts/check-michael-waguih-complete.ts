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

async function checkMichaelWaguihComplete() {
  console.log('🔍 Vérification complète de Michael Waguih...')
  console.log('============================================================\n')

  const michaelEmails = [
    'michaelnagui033@gmail.com',
    'michaelnagui033@gmaill.com',
    'michaelawaguih0@gmail.com'
  ]
  const saintsTeamId = 'MHBdumu4cSU6ExLRlrrj'

  // 1. Vérifier dans teamRegistrations pour Saints
  console.log('1️⃣ teamRegistrations (Saints):')
  const registrationsSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', 'Saints')
    .get()

  if (registrationsSnap.empty) {
    console.log('   ❌ Aucune inscription trouvée pour Saints')
  } else {
    const regData = registrationsSnap.docs[0].data()
    if (regData.players && Array.isArray(regData.players)) {
      const michaelPlayer = regData.players.find((p: any) => 
        michaelEmails.some(e => p.email?.toLowerCase().includes(e.split('@')[0])) ||
        (p.firstName?.toLowerCase().includes('michael') && p.lastName?.toLowerCase().includes('waguih')) ||
        (p.firstName?.toLowerCase().includes('nagui') && p.lastName?.toLowerCase().includes('micheal'))
      )
      
      if (michaelPlayer) {
        console.log(`   ✅ Trouvé dans l'inscription:`)
        console.log(`      - Email: ${michaelPlayer.email}`)
        console.log(`      - Nom: ${michaelPlayer.firstName} ${michaelPlayer.lastName}`)
      } else {
        console.log(`   ❌ NON trouvé dans l'inscription`)
      }
    }
  }

  // 2. Vérifier dans teams.players pour Saints
  console.log('\n2️⃣ teams.players (Saints):')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Saints')
    .get()

  if (teamsSnap.empty) {
    console.log('   ❌ Équipe Saints non trouvée')
  } else {
    const teamData = teamsSnap.docs[0].data()
    if (teamData.players && Array.isArray(teamData.players)) {
      const michaelPlayer = teamData.players.find((p: any) => 
        michaelEmails.some(e => p.email?.toLowerCase().includes(e.split('@')[0])) ||
        (p.firstName?.toLowerCase().includes('michael') && p.lastName?.toLowerCase().includes('waguih')) ||
        (p.firstName?.toLowerCase().includes('nagui') && p.lastName?.toLowerCase().includes('micheal'))
      )
      
      if (michaelPlayer) {
        console.log(`   ✅ Trouvé dans teams.players:`)
        console.log(`      - Email: ${michaelPlayer.email}`)
        console.log(`      - Nom: ${michaelPlayer.firstName} ${michaelPlayer.lastName}`)
      } else {
        console.log(`   ❌ NON trouvé dans teams.players`)
        console.log(`   📋 Liste des joueurs dans teams.players:`)
        teamData.players.forEach((p: any, i: number) => {
          console.log(`      ${i + 1}. ${p.firstName} ${p.lastName} (${p.email})`)
        })
      }
    }
  }

  // 3. Vérifier dans players avec teamId Saints
  console.log('\n3️⃣ players (teamId = Saints):')
  const playersSnap = await db.collection('players')
    .where('teamId', '==', saintsTeamId)
    .get()

  const michaelInPlayers = playersSnap.docs.find(doc => {
    const data = doc.data()
    return michaelEmails.some(e => data.email?.toLowerCase().includes(e.split('@')[0])) ||
           (data.firstName?.toLowerCase().includes('michael') && data.lastName?.toLowerCase().includes('waguih')) ||
           (data.firstName?.toLowerCase().includes('nagui') && data.lastName?.toLowerCase().includes('micheal'))
  })

  if (michaelInPlayers) {
    const data = michaelInPlayers.data()
    console.log(`   ✅ Trouvé dans players:`)
    console.log(`      - ID: ${michaelInPlayers.id}`)
    console.log(`      - Email: ${data.email}`)
    console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
    console.log(`      - Team ID: ${data.teamId}`)
  } else {
    console.log(`   ❌ NON trouvé dans players pour cette équipe`)
    console.log(`   📋 Liste des joueurs dans players pour Saints:`)
    playersSnap.docs.forEach((doc, i) => {
      const data = doc.data()
      console.log(`      ${i + 1}. ${data.firstName} ${data.lastName} (${data.email})`)
    })
  }

  // 4. Vérifier dans playerAccounts avec teamId Saints
  console.log('\n4️⃣ playerAccounts (teamId = Saints):')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('teamId', '==', saintsTeamId)
    .get()

  const michaelInAccounts = playerAccountsSnap.docs.find(doc => {
    const data = doc.data()
    return michaelEmails.some(e => data.email?.toLowerCase().includes(e.split('@')[0])) ||
           (data.firstName?.toLowerCase().includes('michael') && data.lastName?.toLowerCase().includes('waguih')) ||
           (data.firstName?.toLowerCase().includes('nagui') && data.lastName?.toLowerCase().includes('micheal'))
  })

  if (michaelInAccounts) {
    const data = michaelInAccounts.data()
    console.log(`   ✅ Trouvé dans playerAccounts:`)
    console.log(`      - ID: ${michaelInAccounts.id}`)
    console.log(`      - Email: ${data.email}`)
    console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
    console.log(`      - Team ID: ${data.teamId}`)
  } else {
    console.log(`   ❌ NON trouvé dans playerAccounts pour cette équipe`)
    console.log(`   📋 Liste des comptes dans playerAccounts pour Saints:`)
    playerAccountsSnap.docs.forEach((doc, i) => {
      const data = doc.data()
      console.log(`      ${i + 1}. ${data.firstName} ${data.lastName} (${data.email})`)
    })
  }

  // 5. Chercher Michael Waguih partout (sans filtre teamId)
  console.log('\n5️⃣ Recherche globale de Michael Waguih:')
  const allPlayersSnap = await db.collection('players').get()
  const allAccountsSnap = await db.collection('playerAccounts').get()

  const michaelPlayers = allPlayersSnap.docs.filter(doc => {
    const data = doc.data()
    return michaelEmails.some(e => data.email?.toLowerCase().includes(e.split('@')[0])) ||
           (data.firstName?.toLowerCase().includes('michael') && data.lastName?.toLowerCase().includes('waguih')) ||
           (data.firstName?.toLowerCase().includes('nagui') && data.lastName?.toLowerCase().includes('micheal'))
  })

  const michaelAccounts = allAccountsSnap.docs.filter(doc => {
    const data = doc.data()
    return michaelEmails.some(e => data.email?.toLowerCase().includes(e.split('@')[0])) ||
           (data.firstName?.toLowerCase().includes('michael') && data.lastName?.toLowerCase().includes('waguih')) ||
           (data.firstName?.toLowerCase().includes('nagui') && data.lastName?.toLowerCase().includes('micheal'))
  })

  if (michaelPlayers.length > 0) {
    console.log(`   📋 Trouvé ${michaelPlayers.length} occurrence(s) dans players:`)
    michaelPlayers.forEach(doc => {
      const data = doc.data()
      console.log(`      - ID: ${doc.id}, Email: ${data.email}, Nom: ${data.firstName} ${data.lastName}, Team ID: ${data.teamId || 'N/A'}`)
    })
  } else {
    console.log(`   ❌ Aucune occurrence dans players`)
  }

  if (michaelAccounts.length > 0) {
    console.log(`   📋 Trouvé ${michaelAccounts.length} occurrence(s) dans playerAccounts:`)
    michaelAccounts.forEach(doc => {
      const data = doc.data()
      console.log(`      - ID: ${doc.id}, Email: ${data.email}, Nom: ${data.firstName} ${data.lastName}, Team ID: ${data.teamId || 'N/A'}`)
    })
  } else {
    console.log(`   ❌ Aucune occurrence dans playerAccounts`)
  }

  console.log('\n============================================================')
  console.log('📊 CONCLUSION:')
  console.log('============================================================')
}

checkMichaelWaguihComplete().catch(console.error)

