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

async function addAliSabryToPlayers() {
  console.log('🔧 Ajout d\'Ali Sabry à la collection players...\n')
  
  const teamId = '6HKmkOQEhvZqAfOt1cGT'
  const teamName = 'Road To Glory'
  const email = 'aleyeldingasser@gmail.com'
  
  // Récupérer les données depuis playerAccounts
  const paSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .where('teamId', '==', teamId)
    .limit(1)
    .get()
  
  if (paSnap.empty) {
    console.error('❌ Ali Sabry non trouvé dans playerAccounts')
    return
  }
  
  const paData = paSnap.docs[0].data()
  console.log('✅ Données trouvées dans playerAccounts')
  
  // Vérifier s'il existe déjà dans players
  const existingPlayers = await db.collection('players')
    .where('email', '==', email)
    .where('teamId', '==', teamId)
    .limit(1)
    .get()
  
  if (!existingPlayers.empty) {
    console.log('✅ Ali Sabry existe déjà dans players')
    return
  }
  
  // Créer un nouveau document dans players
  const newPlayer: any = {
    email: paData.email,
    firstName: paData.firstName,
    lastName: paData.lastName,
    name: `${paData.firstName} ${paData.lastName}`,
    teamId: teamId,
    teamName: teamName,
    number: paData.jerseyNumber || paData.number,
    jerseyNumber: paData.jerseyNumber || paData.number,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  if (paData.position) newPlayer.position = paData.position
  if (paData.birthDate) newPlayer.birthDate = paData.birthDate
  if (paData.height !== undefined) newPlayer.height = paData.height
  if (paData.foot) newPlayer.foot = paData.foot
  if (paData.tshirtSize) newPlayer.tshirtSize = paData.tshirtSize
  if (paData.grade) newPlayer.grade = paData.grade
  
  await db.collection('players').add(newPlayer)
  console.log('✅ Ali Sabry ajouté à la collection players')
  console.log('\n✅ Road To Glory a maintenant 10 joueurs dans toutes les collections!')
}

addAliSabryToPlayers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

