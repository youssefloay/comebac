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

async function fixMarkSamir() {
  console.log('🔧 Correction de Mark Samir avec le bon email...\n')
  
  const wrongEmail = 'shereef.zoumi@gmail.com'
  const correctEmail = 'marksamir515@gmail.com'
  const teamId = '5AKP3hWyaz9iPXxb3Bxy'
  const teamName = 'Santos '
  
  // 1. Récupérer les données de shereef.zoumi pour les transférer à marksamir515
  console.log('📋 1. Récupération des données...')
  const wrongPASnap = await db.collection('playerAccounts')
    .where('email', '==', wrongEmail)
    .limit(1)
    .get()
  
  if (wrongPASnap.empty) {
    console.log('   ⚠️  Aucune donnée trouvée pour shereef.zoumi@gmail.com')
  } else {
    const wrongData = wrongPASnap.docs[0].data()
    console.log(`   ✅ Données trouvées pour shereef.zoumi@gmail.com`)
    
    // 2. Vérifier si marksamir515 existe déjà
    const correctPASnap = await db.collection('playerAccounts')
      .where('email', '==', correctEmail)
      .limit(1)
      .get()
    
    if (correctPASnap.empty) {
      // Créer marksamir515 avec les données de shereef.zoumi
      console.log('\n📝 Création de playerAccount pour marksamir515@gmail.com...')
      const newPA: any = {
        email: correctEmail,
        firstName: wrongData.firstName,
        lastName: wrongData.lastName,
        teamId: wrongData.teamId,
        teamName: wrongData.teamName,
        jerseyNumber: wrongData.jerseyNumber || wrongData.number,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      if (wrongData.position) newPA.position = wrongData.position
      if (wrongData.birthDate) newPA.birthDate = wrongData.birthDate
      if (wrongData.height !== undefined) newPA.height = wrongData.height
      if (wrongData.foot) newPA.foot = wrongData.foot
      if (wrongData.tshirtSize) newPA.tshirtSize = wrongData.tshirtSize
      if (wrongData.grade) newPA.grade = wrongData.grade
      if (wrongData.phone) newPA.phone = wrongData.phone
      if (wrongData.nickname) newPA.nickname = wrongData.nickname
      
      await db.collection('playerAccounts').add(newPA)
      console.log('   ✅ PlayerAccount créé')
    } else {
      console.log('   ✅ marksamir515@gmail.com existe déjà dans playerAccounts')
    }
    
    // 3. Supprimer shereef.zoumi de playerAccounts
    console.log('\n📝 Suppression de shereef.zoumi@gmail.com de playerAccounts...')
    await wrongPASnap.docs[0].ref.delete()
    console.log('   ✅ Supprimé')
  }
  
  // 4. Mettre à jour players
  console.log('\n📋 2. Mise à jour de players...')
  const wrongPlayersSnap = await db.collection('players')
    .where('email', '==', wrongEmail)
    .get()
  
  for (const doc of wrongPlayersSnap.docs) {
    const data = doc.data()
    
    // Vérifier si marksamir515 existe déjà dans players
    const correctPlayersSnap = await db.collection('players')
      .where('email', '==', correctEmail)
      .where('teamId', '==', teamId)
      .limit(1)
      .get()
    
    if (correctPlayersSnap.empty) {
      // Créer avec le bon email
      const newPlayer: any = {
        email: correctEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        teamId: teamId,
        teamName: teamName,
        number: data.number || data.jerseyNumber,
        jerseyNumber: data.number || data.jerseyNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      if (data.position) newPlayer.position = data.position
      if (data.birthDate) newPlayer.birthDate = data.birthDate
      if (data.height !== undefined) newPlayer.height = data.height
      if (data.foot) newPlayer.foot = data.foot
      if (data.tshirtSize) newPlayer.tshirtSize = data.tshirtSize
      if (data.grade) newPlayer.grade = data.grade
      
      await db.collection('players').add(newPlayer)
      console.log('   ✅ Player créé avec marksamir515@gmail.com')
    }
    
    // Supprimer l'ancien
    await doc.ref.delete()
    console.log('   ✅ Ancien player supprimé')
  }
  
  // 5. Mettre à jour accounts
  console.log('\n📋 3. Mise à jour de accounts...')
  const wrongAccountsSnap = await db.collection('accounts')
    .where('email', '==', wrongEmail)
    .get()
  
  for (const doc of wrongAccountsSnap.docs) {
    const data = doc.data()
    
    // Vérifier si marksamir515 existe déjà
    const correctAccountsSnap = await db.collection('accounts')
      .where('email', '==', correctEmail)
      .limit(1)
      .get()
    
    if (correctAccountsSnap.empty) {
      // Créer avec le bon email
      const newAccount: any = {
        email: correctEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'player',
        teamId: data.teamId,
        teamName: data.teamName,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      if (data.displayName) newAccount.displayName = data.displayName
      if (data.phone) newAccount.phone = data.phone
      if (data.position) newAccount.position = data.position
      if (data.jerseyNumber) newAccount.jerseyNumber = data.jerseyNumber
      
      await db.collection('accounts').add(newAccount)
      console.log('   ✅ Account créé avec marksamir515@gmail.com')
    }
    
    // Supprimer l'ancien
    await doc.ref.delete()
    console.log('   ✅ Ancien account supprimé')
  }
  
  // 6. Mettre à jour teams.players
  console.log('\n📋 4. Mise à jour de teams.players...')
  const teamDoc = await db.collection('teams').doc(teamId).get()
  if (teamDoc.exists) {
    const teamData = teamDoc.data()
    const players = teamData?.players || []
    
    const updatedPlayers = players.map((p: any) => {
      if (p.email?.toLowerCase()?.trim() === wrongEmail.toLowerCase()) {
        return {
          ...p,
          email: correctEmail
        }
      }
      return p
    })
    
    await teamDoc.ref.update({
      players: updatedPlayers,
      updatedAt: new Date()
    })
    console.log('   ✅ teams.players mis à jour')
  }
  
  // 7. Mettre à jour teamRegistrations
  console.log('\n📋 5. Mise à jour de teamRegistrations...')
  const regSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', teamName)
    .get()
  
  for (const regDoc of regSnap.docs) {
    const regData = regDoc.data()
    const players = regData.players || []
    
    const updatedPlayers = players.map((p: any) => {
      if (p.email?.toLowerCase()?.trim() === wrongEmail.toLowerCase()) {
        return {
          ...p,
          email: correctEmail
        }
      }
      return p
    })
    
    await regDoc.ref.update({
      players: updatedPlayers,
      updatedAt: new Date()
    })
    console.log('   ✅ teamRegistrations mis à jour')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Correction terminée!')
  console.log(`✅ Email correct: ${correctEmail}`)
  console.log(`❌ Email supprimé: ${wrongEmail}`)
  console.log('\n' + '='.repeat(60))
}

fixMarkSamir()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

