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

async function detailedComparison() {
  console.log('🔍 Comparaison détaillée Saints...\n')
  
  const teamId = 'MHBdumu4cSU6ExLRlrrj'
  
  // 1. teams.players
  const teamDoc = await db.collection('teams').doc(teamId).get()
  const teamData = teamDoc.data()
  const teamsPlayers = teamData?.players || []
  
  const teamsEmails = new Map<string, any>()
  teamsPlayers.forEach((p: any) => {
    const email = p.email?.toLowerCase()?.trim()
    if (email) {
      teamsEmails.set(email, p)
    }
  })
  
  console.log(`📊 teams.players (${teamsEmails.size} joueurs):`)
  teamsEmails.forEach((player, email) => {
    console.log(`   - ${player.firstName} ${player.lastName} (${email})`)
  })
  
  // 2. playerAccounts
  const allPA = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  const paEmails = new Map<string, any>()
  allPA.docs.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (email) {
      paEmails.set(email, { ...data, id: doc.id })
    }
  })
  
  console.log(`\n📊 playerAccounts (${paEmails.size} joueurs):`)
  paEmails.forEach((data, email) => {
    console.log(`   - ${data.firstName} ${data.lastName} (${email})`)
  })
  
  // 3. Comparaison
  console.log('\n📊 Comparaison:\n')
  
  const inPA_NotInTeams: string[] = []
  paEmails.forEach((data, email) => {
    if (!teamsEmails.has(email)) {
      inPA_NotInTeams.push(email)
    }
  })
  
  const inTeams_NotInPA: string[] = []
  teamsEmails.forEach((player, email) => {
    if (!paEmails.has(email)) {
      inTeams_NotInPA.push(email)
    }
  })
  
  if (inPA_NotInTeams.length > 0) {
    console.log(`❌ Joueurs dans playerAccounts mais PAS dans teams.players (${inPA_NotInTeams.length}):`)
    inPA_NotInTeams.forEach(email => {
      const data = paEmails.get(email)
      console.log(`   - ${data.firstName} ${data.lastName} (${email})`)
      console.log(`     ID: ${data.id}`)
    })
  }
  
  if (inTeams_NotInPA.length > 0) {
    console.log(`\n❌ Joueurs dans teams.players mais PAS dans playerAccounts (${inTeams_NotInPA.length}):`)
    inTeams_NotInPA.forEach(email => {
      const player = teamsEmails.get(email)
      console.log(`   - ${player.firstName} ${player.lastName} (${email})`)
    })
  }
  
  if (inPA_NotInTeams.length === 0 && inTeams_NotInPA.length === 0) {
    console.log('✅ Tous les joueurs correspondent!')
  }
  
  console.log('\n✅ Comparaison terminée')
}

detailedComparison()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

