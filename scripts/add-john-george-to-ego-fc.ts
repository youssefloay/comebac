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

async function addJohnGeorge() {
  console.log('🔧 Ajout de John George à Ego Fc...\n')
  
  const teamId = '96nQ60wYDCUru3BOJie7'
  const teamName = 'Ego Fc'
  
  // 1. Récupérer les données depuis teamRegistrations
  const regSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', teamName)
    .get()
  
  if (regSnap.empty) {
    console.error('❌ Inscription non trouvée')
    return
  }
  
  const regData = regSnap.docs[0].data()
  const players = regData.players || []
  const johnGeorge = players.find((p: any) => 
    p.firstName === 'John' && p.lastName === 'George'
  )
  
  if (!johnGeorge) {
    console.error('❌ John George non trouvé dans teamRegistrations')
    return
  }
  
  console.log('📝 Données de John George:')
  console.log(`   Prénom: ${johnGeorge.firstName}`)
  console.log(`   Nom: ${johnGeorge.lastName}`)
  console.log(`   Numéro: ${johnGeorge.jerseyNumber || johnGeorge.number || 'N/A'}`)
  console.log(`   Position: ${johnGeorge.position || 'N/A'}`)
  console.log(`   Email: ${johnGeorge.email || 'MANQUANT'}`)
  
  // 2. Créer un email temporaire basé sur le nom
  const tempEmail = `john.george.ego@temp.comebac.com`
  console.log(`\n📧 Email temporaire créé: ${tempEmail}`)
  console.log('   ⚠️  À remplacer par le vrai email plus tard\n')
  
  // 3. Ajouter à playerAccounts
  console.log('📝 Ajout à playerAccounts...')
  const newPA: any = {
    email: tempEmail,
    firstName: johnGeorge.firstName,
    lastName: johnGeorge.lastName,
    teamId: teamId,
    teamName: teamName,
    jerseyNumber: johnGeorge.jerseyNumber || johnGeorge.number || 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    isTemporaryEmail: true // Flag pour indiquer que l'email est temporaire
  }
  
  if (johnGeorge.position) newPA.position = johnGeorge.position
  if (johnGeorge.birthDate) newPA.birthDate = johnGeorge.birthDate
  if (johnGeorge.height !== undefined) newPA.height = johnGeorge.height
  if (johnGeorge.foot) newPA.foot = johnGeorge.foot
  if (johnGeorge.tshirtSize) newPA.tshirtSize = johnGeorge.tshirtSize
  if (johnGeorge.grade) newPA.grade = johnGeorge.grade
  if (johnGeorge.phone) newPA.phone = johnGeorge.phone
  if (johnGeorge.nickname) newPA.nickname = johnGeorge.nickname
  
  await db.collection('playerAccounts').add(newPA)
  console.log('   ✅ Ajouté à playerAccounts')
  
  // 4. Ajouter à teams.players
  console.log('\n📝 Ajout à teams.players...')
  const teamDoc = await db.collection('teams').doc(teamId).get()
  if (teamDoc.exists) {
    const teamData = teamDoc.data()
    const currentPlayers = teamData?.players || []
    
    // Vérifier s'il existe déjà
    const exists = currentPlayers.some((p: any) => 
      p.firstName === 'John' && p.lastName === 'George'
    )
    
    if (!exists) {
      const newPlayer: any = {
        firstName: johnGeorge.firstName,
        lastName: johnGeorge.lastName,
        email: tempEmail,
        number: johnGeorge.jerseyNumber || johnGeorge.number || 1,
        jerseyNumber: johnGeorge.jerseyNumber || johnGeorge.number || 1
      }
      
      if (johnGeorge.position) newPlayer.position = johnGeorge.position
      if (johnGeorge.birthDate) newPlayer.birthDate = johnGeorge.birthDate
      if (johnGeorge.height !== undefined) newPlayer.height = johnGeorge.height
      if (johnGeorge.foot) newPlayer.foot = johnGeorge.foot
      if (johnGeorge.tshirtSize) newPlayer.tshirtSize = johnGeorge.tshirtSize
      if (johnGeorge.grade) newPlayer.grade = johnGeorge.grade
      if (johnGeorge.phone) newPlayer.phone = johnGeorge.phone
      
      const updatedPlayers = [...currentPlayers, newPlayer]
      await teamDoc.ref.update({
        players: updatedPlayers,
        updatedAt: new Date()
      })
      console.log('   ✅ Ajouté à teams.players')
    } else {
      console.log('   ✅ Déjà présent dans teams.players')
    }
  }
  
  // 5. Ajouter à players
  console.log('\n📝 Ajout à players...')
  const existingPlayersSnap = await db.collection('players')
    .where('teamId', '==', teamId)
    .where('email', '==', tempEmail)
    .limit(1)
    .get()
  
  if (existingPlayersSnap.empty) {
    const newPlayer: any = {
      email: tempEmail,
      firstName: johnGeorge.firstName,
      lastName: johnGeorge.lastName,
      name: `${johnGeorge.firstName} ${johnGeorge.lastName}`,
      teamId: teamId,
      teamName: teamName,
      number: johnGeorge.jerseyNumber || johnGeorge.number || 1,
      jerseyNumber: johnGeorge.jerseyNumber || johnGeorge.number || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    if (johnGeorge.position) newPlayer.position = johnGeorge.position
    if (johnGeorge.birthDate) newPlayer.birthDate = johnGeorge.birthDate
    if (johnGeorge.height !== undefined) newPlayer.height = johnGeorge.height
    if (johnGeorge.foot) newPlayer.foot = johnGeorge.foot
    if (johnGeorge.tshirtSize) newPlayer.tshirtSize = johnGeorge.tshirtSize
    if (johnGeorge.grade) newPlayer.grade = johnGeorge.grade
    
    await db.collection('players').add(newPlayer)
    console.log('   ✅ Ajouté à players')
  } else {
    console.log('   ✅ Déjà présent dans players')
  }
  
  // 6. Mettre à jour teamRegistrations avec l'email temporaire
  console.log('\n📝 Mise à jour de teamRegistrations...')
  const updatedRegPlayers = players.map((p: any) => {
    if (p.firstName === 'John' && p.lastName === 'George' && !p.email) {
      return {
        ...p,
        email: tempEmail
      }
    }
    return p
  })
  
  await regSnap.docs[0].ref.update({
    players: updatedRegPlayers,
    updatedAt: new Date()
  })
  console.log('   ✅ teamRegistrations mis à jour')
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ John George ajouté à Ego Fc!')
  console.log(`📧 Email temporaire: ${tempEmail}`)
  console.log('⚠️  IMPORTANT: Remplacer cet email par le vrai email de John George')
  console.log('\n' + '='.repeat(60))
}

addJohnGeorge()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

