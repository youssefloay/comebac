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

async function addRaoufAsmar() {
  console.log('🔍 Recherche de Raouf Asmar "Roro"...\n')
  
  const email = 'raoufasmar2@gmail.com'
  const teamName = 'Les Lions sacrés'
  
  // 1. Trouver l'équipe
  const teamsSnap = await db.collection('teams')
    .where('name', '==', teamName)
    .get()
  
  if (teamsSnap.empty) {
    console.error('❌ Équipe "Les Lions sacrés" non trouvée')
    return
  }
  
  const teamDoc = teamsSnap.docs[0]
  const teamId = teamDoc.id
  const teamData = teamDoc.data()
  
  console.log(`✅ Équipe trouvée: ${teamName} (${teamId})`)
  
  // 2. Trouver le joueur dans teams.players
  const playerInTeam = teamData.players?.find((p: any) => p.email === email)
  
  if (!playerInTeam) {
    console.error('❌ Joueur non trouvé dans teams.players')
    return
  }
  
  console.log('✅ Données du joueur trouvées dans teams.players:')
  console.log(`   - Nom: ${playerInTeam.firstName} ${playerInTeam.lastName}`)
  console.log(`   - Surnom: ${playerInTeam.nickname || 'N/A'}`)
  console.log(`   - Email: ${playerInTeam.email}`)
  console.log(`   - Numéro: ${playerInTeam.jerseyNumber || playerInTeam.number || 'N/A'}`)
  console.log(`   - Taille T-shirt: ${playerInTeam.tshirtSize || 'N/A'}`)
  console.log('')
  
  // 3. Vérifier si déjà dans playerAccounts
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (!playerAccountsSnap.empty) {
    console.log('⚠️  Joueur déjà présent dans playerAccounts, mise à jour...')
    const existingDoc = playerAccountsSnap.docs[0]
    await existingDoc.ref.update({
      firstName: playerInTeam.firstName,
      lastName: playerInTeam.lastName,
      nickname: playerInTeam.nickname || '',
      email: email,
      phone: playerInTeam.phone || '',
      birthDate: playerInTeam.birthDate || '',
      height: playerInTeam.height || 0,
      tshirtSize: playerInTeam.tshirtSize || '',
      position: playerInTeam.position || '',
      foot: playerInTeam.foot || playerInTeam.strongFoot || '',
      jerseyNumber: playerInTeam.jerseyNumber || playerInTeam.number || 0,
      number: playerInTeam.jerseyNumber || playerInTeam.number || 0,
      teamId: teamId,
      teamName: teamName,
      updatedAt: new Date()
    })
    console.log(`✅ playerAccounts mis à jour: ${existingDoc.id}`)
  } else {
    console.log('📝 Création dans playerAccounts...')
    const playerAccountRef = await db.collection('playerAccounts').add({
      firstName: playerInTeam.firstName,
      lastName: playerInTeam.lastName,
      nickname: playerInTeam.nickname || '',
      email: email,
      phone: playerInTeam.phone || '',
      birthDate: playerInTeam.birthDate || '',
      height: playerInTeam.height || 0,
      tshirtSize: playerInTeam.tshirtSize || '',
      position: playerInTeam.position || '',
      foot: playerInTeam.foot || playerInTeam.strongFoot || '',
      jerseyNumber: playerInTeam.jerseyNumber || playerInTeam.number || 0,
      number: playerInTeam.jerseyNumber || playerInTeam.number || 0,
      teamId: teamId,
      teamName: teamName,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log(`✅ playerAccounts créé: ${playerAccountRef.id}`)
  }
  
  // 4. Vérifier si déjà dans players
  const playersSnap = await db.collection('players')
    .where('email', '==', email)
    .get()
  
  if (!playersSnap.empty) {
    console.log('⚠️  Joueur déjà présent dans players, mise à jour...')
    const existingDoc = playersSnap.docs[0]
    await existingDoc.ref.update({
      firstName: playerInTeam.firstName,
      lastName: playerInTeam.lastName,
      nickname: playerInTeam.nickname || '',
      email: email,
      phone: playerInTeam.phone || '',
      birthDate: playerInTeam.birthDate || '',
      height: playerInTeam.height || 0,
      tshirtSize: playerInTeam.tshirtSize || '',
      position: playerInTeam.position || '',
      foot: playerInTeam.foot || playerInTeam.strongFoot || '',
      jerseyNumber: playerInTeam.jerseyNumber || playerInTeam.number || 0,
      number: playerInTeam.jerseyNumber || playerInTeam.number || 0,
      teamId: teamId,
      teamName: teamName,
      updatedAt: new Date()
    })
    console.log(`✅ players mis à jour: ${existingDoc.id}`)
  } else {
    console.log('📝 Création dans players...')
    const playerRef = await db.collection('players').add({
      firstName: playerInTeam.firstName,
      lastName: playerInTeam.lastName,
      nickname: playerInTeam.nickname || '',
      email: email,
      phone: playerInTeam.phone || '',
      birthDate: playerInTeam.birthDate || '',
      height: playerInTeam.height || 0,
      tshirtSize: playerInTeam.tshirtSize || '',
      position: playerInTeam.position || '',
      foot: playerInTeam.foot || playerInTeam.strongFoot || '',
      jerseyNumber: playerInTeam.jerseyNumber || playerInTeam.number || 0,
      number: playerInTeam.jerseyNumber || playerInTeam.number || 0,
      teamId: teamId,
      teamName: teamName,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log(`✅ players créé: ${playerRef.id}`)
  }
  
  console.log('\n✅ Synchronisation terminée pour Raouf Asmar "Roro"')
}

addRaoufAsmar()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

