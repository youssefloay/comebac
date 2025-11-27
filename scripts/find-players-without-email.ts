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

async function findPlayersWithoutEmail() {
  console.log('🔍 Recherche de tous les joueurs sans email...\n')
  
  const playersWithoutEmail: Array<{ collection: string; id: string; name: string; team?: string }> = []
  
  // 1. Vérifier playerAccounts
  console.log('📋 1. Vérification de playerAccounts...')
  const paSnap = await db.collection('playerAccounts').get()
  paSnap.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (!email || email === '') {
      playersWithoutEmail.push({
        collection: 'playerAccounts',
        id: doc.id,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Sans nom',
        team: data.teamName
      })
    }
  })
  
  // 2. Vérifier players
  console.log('📋 2. Vérification de players...')
  const playersSnap = await db.collection('players').get()
  playersSnap.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (!email || email === '') {
      playersWithoutEmail.push({
        collection: 'players',
        id: doc.id,
        name: `${data.firstName || data.name || ''} ${data.lastName || ''}`.trim() || 'Sans nom',
        team: data.teamName
      })
    }
  })
  
  // 3. Vérifier teams.players
  console.log('📋 3. Vérification de teams.players...')
  const teamsSnap = await db.collection('teams').get()
  teamsSnap.forEach(teamDoc => {
    const teamData = teamDoc.data()
    const players = teamData.players || []
    players.forEach((player: any, index: number) => {
      const email = player.email?.toLowerCase()?.trim()
      if (!email || email === '') {
        playersWithoutEmail.push({
          collection: `teams.players[${index}]`,
          id: teamDoc.id,
          name: `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Sans nom',
          team: teamData.name
        })
      }
    })
  })
  
  // 4. Vérifier teamRegistrations.players
  console.log('📋 4. Vérification de teamRegistrations.players...')
  const regSnap = await db.collection('teamRegistrations').get()
  regSnap.forEach(regDoc => {
    const regData = regDoc.data()
    const players = regData.players || []
    players.forEach((player: any, index: number) => {
      const email = player.email?.toLowerCase()?.trim()
      if (!email || email === '') {
        playersWithoutEmail.push({
          collection: `teamRegistrations.players[${index}]`,
          id: regDoc.id,
          name: `${player.firstName || ''} ${player.lastName || player.nickname || ''}`.trim() || 'Sans nom',
          team: regData.teamName
        })
      }
    })
  })
  
  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ\n')
  
  if (playersWithoutEmail.length === 0) {
    console.log('✅ Aucun joueur sans email trouvé!')
  } else {
    console.log(`❌ ${playersWithoutEmail.length} joueur(s) sans email trouvé(s):\n`)
    
    playersWithoutEmail.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name}`)
      console.log(`   Collection: ${player.collection}`)
      console.log(`   ID: ${player.id}`)
      if (player.team) {
        console.log(`   Équipe: ${player.team}`)
      }
      console.log('')
    })
  }
  
  console.log('='.repeat(60))
}

findPlayersWithoutEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

