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

async function fixRoadToGloryTeamsPlayers() {
  console.log('🔧 Synchronisation de teams.players pour "Road To Glory"...\n')
  
  const teamName = 'Road To Glory'
  
  // 1. Récupérer l'équipe
  const teamsSnap = await db.collection('teams')
    .where('name', '==', teamName)
    .get()
  
  if (teamsSnap.empty) {
    console.error('❌ Équipe "Road To Glory" non trouvée dans teams')
    return
  }
  
  const teamDoc = teamsSnap.docs[0]
  const teamId = teamDoc.id
  
  console.log(`✅ Équipe trouvée (ID: ${teamId})\n`)
  
  // 2. Récupérer les joueurs depuis playerAccounts
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  console.log(`📊 ${playerAccountsSnap.size} joueurs trouvés dans playerAccounts\n`)
  
  // 3. Construire le tableau players pour teams.players (filtrer undefined)
  const playersArray = playerAccountsSnap.docs.map(doc => {
    const data = doc.data()
    const player: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      number: data.jerseyNumber || data.number,
      jerseyNumber: data.jerseyNumber || data.number
    }
    
    // Ajouter les champs optionnels seulement s'ils existent
    if (data.position) player.position = data.position
    if (data.birthDate) player.birthDate = data.birthDate
    if (data.height !== undefined) player.height = data.height
    if (data.foot) player.foot = data.foot
    if (data.tshirtSize) player.tshirtSize = data.tshirtSize
    if (data.grade) player.grade = data.grade
    if (data.phone) player.phone = data.phone
    
    return player
  })
  
  // 4. Mettre à jour teams.players
  try {
    await teamDoc.ref.update({
      players: playersArray,
      updatedAt: new Date()
    })
    
    console.log(`✅ teams.players mis à jour avec ${playersArray.length} joueurs`)
    console.log(`\n📝 Liste des joueurs:`)
    playersArray.forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.firstName} ${player.lastName} - #${player.number}`)
    })
    
  } catch (error: any) {
    console.error(`❌ Erreur lors de la mise à jour: ${error.message}`)
  }
  
  console.log('\n✅ Synchronisation terminée')
}

fixRoadToGloryTeamsPlayers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

