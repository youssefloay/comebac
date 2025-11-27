import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialiser Firebase Admin
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

async function checkSaintsPlayersCount() {
  console.log('🔍 Vérification du nombre de joueurs dans l\'équipe "Saints"...\n')
  
  const teamName = 'Saints'
  
  // 1. Vérifier dans teams
  console.log('📋 1. Collection teams:')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', teamName)
    .get()
  
  if (!teamsSnap.empty) {
    teamsSnap.forEach(teamDoc => {
      const teamData = teamDoc.data()
      const players = teamData.players || []
      console.log(`   ✅ Équipe trouvée (ID: ${teamDoc.id})`)
      console.log(`   📊 Nombre de joueurs dans teams.players: ${players.length}`)
      
      if (players.length > 0) {
        console.log(`   📝 Liste des joueurs:`)
        players.forEach((player: any, index: number) => {
          console.log(`      ${index + 1}. ${player.firstName} ${player.lastName} (${player.email || 'N/A'}) - #${player.number || player.jerseyNumber || 'N/A'}`)
        })
      }
      console.log('')
    })
  } else {
    console.log('   ❌ Équipe non trouvée dans teams\n')
  }
  
  // 2. Vérifier dans teamRegistrations
  console.log('📋 2. Collection teamRegistrations:')
  const registrationsSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', teamName)
    .get()
  
  if (!registrationsSnap.empty) {
    registrationsSnap.forEach(regDoc => {
      const regData = regDoc.data()
      const players = regData.players || []
      console.log(`   ✅ Inscription trouvée (ID: ${regDoc.id}, Statut: ${regData.status || 'N/A'})`)
      console.log(`   📊 Nombre de joueurs dans teamRegistrations.players: ${players.length}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Inscription non trouvée dans teamRegistrations\n')
  }
  
  // 3. Vérifier dans playerAccounts
  console.log('📋 3. Collection playerAccounts:')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('teamName', '==', teamName)
    .get()
  
  console.log(`   📊 Nombre de joueurs dans playerAccounts avec teamName="Saints": ${playerAccountsSnap.size}`)
  
  // Aussi chercher par teamId
  if (!teamsSnap.empty === false) {
    const teamId = teamsSnap.docs[0].id
    const playerAccountsByTeamIdSnap = await db.collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()
    
    console.log(`   📊 Nombre de joueurs dans playerAccounts avec teamId="${teamId}": ${playerAccountsByTeamIdSnap.size}`)
    
    if (playerAccountsByTeamIdSnap.size > 0) {
      console.log(`   📝 Liste des joueurs:`)
      playerAccountsByTeamIdSnap.forEach((doc, index) => {
        const data = doc.data()
        console.log(`      ${index + 1}. ${data.firstName} ${data.lastName} (${data.email || 'N/A'}) - #${data.jerseyNumber || data.number || 'N/A'}`)
      })
    }
  }
  console.log('')
  
  // 4. Vérifier dans players
  console.log('📋 4. Collection players:')
  if (!teamsSnap.empty) {
    const teamId = teamsSnap.docs[0].id
    const playersSnap = await db.collection('players')
      .where('teamId', '==', teamId)
      .get()
    
    console.log(`   📊 Nombre de joueurs dans players avec teamId="${teamId}": ${playersSnap.size}`)
  } else {
    const playersByNameSnap = await db.collection('players')
      .where('teamName', '==', teamName)
      .get()
    
    console.log(`   📊 Nombre de joueurs dans players avec teamName="Saints": ${playersByNameSnap.size}`)
  }
  console.log('')
  
  // 5. Comparaison et analyse
  console.log('📊 Analyse:\n')
  
  if (!teamsSnap.empty) {
    const teamData = teamsSnap.docs[0].data()
    const teamsPlayersCount = teamData.players?.length || 0
    
    const teamId = teamsSnap.docs[0].id
    const playerAccountsCount = (await db.collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()).size
    
    const playersCount = (await db.collection('players')
      .where('teamId', '==', teamId)
      .get()).size
    
    console.log(`   - teams.players: ${teamsPlayersCount}`)
    console.log(`   - playerAccounts: ${playerAccountsCount}`)
    console.log(`   - players: ${playersCount}`)
    
    if (teamsPlayersCount !== playerAccountsCount) {
      console.log(`\n   ⚠️  INCOHÉRENCE: teams.players (${teamsPlayersCount}) ≠ playerAccounts (${playerAccountsCount})`)
      console.log(`   💡 Le nombre affiché dans l'interface vient probablement de teams.players`)
    } else {
      console.log(`\n   ✅ Les comptes sont cohérents`)
    }
  }
  
  console.log('\n✅ Vérification terminée')
}

checkSaintsPlayersCount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

