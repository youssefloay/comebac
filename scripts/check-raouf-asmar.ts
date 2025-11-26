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

async function checkRaoufAsmar() {
  console.log('🔍 Recherche de Raouf Asmar "Roro"...\n')
  
  const email = 'raoufasmar2@gmail.com'
  const name = 'Raouf Asmar'
  const nickname = 'Roro'
  
  // 1. Chercher dans playerAccounts
  console.log('📋 1. Recherche dans playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (!playerAccountsSnap.empty) {
    console.log(`✅ Trouvé dans playerAccounts (${playerAccountsSnap.size} document(s)):`)
    playerAccountsSnap.forEach(doc => {
      const data = doc.data()
      console.log(`   - ID: ${doc.id}`)
      console.log(`     Email: ${data.email}`)
      console.log(`     Nom: ${data.firstName} ${data.lastName}`)
      console.log(`     Surnom: ${data.nickname || 'N/A'}`)
      console.log(`     Équipe: ${data.teamName || 'N/A'} (${data.teamId || 'N/A'})`)
      console.log(`     Numéro: ${data.jerseyNumber || data.number || 'N/A'}`)
      console.log(`     Taille T-shirt: ${data.tshirtSize || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Non trouvé dans playerAccounts')
  }
  
  // 2. Chercher dans players
  console.log('📋 2. Recherche dans players...')
  const playersSnap = await db.collection('players')
    .where('email', '==', email)
    .get()
  
  if (!playersSnap.empty) {
    console.log(`✅ Trouvé dans players (${playersSnap.size} document(s)):`)
    playersSnap.forEach(doc => {
      const data = doc.data()
      console.log(`   - ID: ${doc.id}`)
      console.log(`     Email: ${data.email}`)
      console.log(`     Nom: ${data.firstName} ${data.lastName}`)
      console.log(`     Surnom: ${data.nickname || 'N/A'}`)
      console.log(`     Équipe: ${data.teamName || 'N/A'} (${data.teamId || 'N/A'})`)
      console.log(`     Numéro: ${data.jerseyNumber || data.number || 'N/A'}`)
      console.log(`     Taille T-shirt: ${data.tshirtSize || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Non trouvé dans players')
  }
  
  // 3. Chercher dans teams.players
  console.log('📋 3. Recherche dans teams.players...')
  const teamsSnap = await db.collection('teams').get()
  let foundInTeams = false
  
  teamsSnap.forEach(teamDoc => {
    const teamData = teamDoc.data()
    if (teamData.players && Array.isArray(teamData.players)) {
      const player = teamData.players.find((p: any) => 
        p.email === email || 
        (p.firstName && p.lastName && `${p.firstName} ${p.lastName}`.includes('Raouf')) ||
        p.nickname === nickname
      )
      
      if (player) {
        foundInTeams = true
        console.log(`✅ Trouvé dans l'équipe "${teamData.name}" (${teamDoc.id}):`)
        console.log(`   - Email: ${player.email || 'N/A'}`)
        console.log(`   - Nom: ${player.firstName} ${player.lastName}`)
        console.log(`   - Surnom: ${player.nickname || 'N/A'}`)
        console.log(`   - Numéro: ${player.jerseyNumber || player.number || 'N/A'}`)
        console.log(`   - Taille T-shirt: ${player.tshirtSize || 'N/A'}`)
        console.log('')
      }
    }
  })
  
  if (!foundInTeams) {
    console.log('   ❌ Non trouvé dans teams.players')
  }
  
  // 4. Chercher dans teamRegistrations
  console.log('📋 4. Recherche dans teamRegistrations...')
  const registrationsSnap = await db.collection('teamRegistrations').get()
  let foundInRegistrations = false
  
  registrationsSnap.forEach(regDoc => {
    const regData = regDoc.data()
    if (regData.players && Array.isArray(regData.players)) {
      const player = regData.players.find((p: any) => 
        p.email === email ||
        (p.firstName && p.lastName && `${p.firstName} ${p.lastName}`.includes('Raouf')) ||
        p.nickname === nickname
      )
      
      if (player) {
        foundInRegistrations = true
        console.log(`✅ Trouvé dans l'inscription "${regData.teamName}" (${regDoc.id}):`)
        console.log(`   - Email: ${player.email || 'N/A'}`)
        console.log(`   - Nom: ${player.firstName} ${player.lastName}`)
        console.log(`   - Surnom: ${player.nickname || 'N/A'}`)
        console.log(`   - Numéro: ${player.jerseyNumber || player.number || 'N/A'}`)
        console.log(`   - Taille T-shirt: ${player.tshirtSize || 'N/A'}`)
        console.log(`   - Statut: ${regData.status || 'N/A'}`)
        console.log('')
      }
    }
  })
  
  if (!foundInRegistrations) {
    console.log('   ❌ Non trouvé dans teamRegistrations')
  }
  
  // 5. Recherche par nom/prénom
  console.log('📋 5. Recherche par nom/prénom (Raouf Asmar)...')
  const playersByNameSnap = await db.collection('players')
    .where('firstName', '==', 'Raouf')
    .get()
  
  if (!playersByNameSnap.empty) {
    console.log(`✅ Trouvé ${playersByNameSnap.size} joueur(s) avec le prénom "Raouf":`)
    playersByNameSnap.forEach(doc => {
      const data = doc.data()
      console.log(`   - ID: ${doc.id}`)
      console.log(`     Nom complet: ${data.firstName} ${data.lastName}`)
      console.log(`     Email: ${data.email || 'N/A'}`)
      console.log(`     Surnom: ${data.nickname || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun joueur trouvé avec le prénom "Raouf"')
  }
  
  console.log('\n✅ Recherche terminée')
}

checkRaoufAsmar()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

