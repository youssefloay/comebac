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

async function addAliSabry() {
  console.log('🔧 Ajout d\'Ali Sabry à Road To Glory...\n')
  
  const teamId = '6HKmkOQEhvZqAfOt1cGT'
  const teamName = 'Road To Glory'
  
  // 1. Récupérer les données depuis teamRegistrations
  const regSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', teamName)
    .get()
  
  if (regSnap.empty) {
    console.error('❌ Inscription non trouvée')
    return
  }
  
  const regData = regSnap.docs[0].data()
  const aliSabry = regData.players?.find((p: any) => 
    p.email?.toLowerCase()?.trim() === 'aleyeldingasser@gmail.com' ||
    p.firstName === 'Ali' && p.lastName === 'Sabry'
  )
  
  if (!aliSabry) {
    console.error('❌ Ali Sabry non trouvé dans teamRegistrations')
    return
  }
  
  console.log('✅ Données trouvées dans teamRegistrations:')
  console.log(`   Nom: ${aliSabry.firstName} ${aliSabry.lastName}`)
  console.log(`   Email: ${aliSabry.email}`)
  console.log(`   Numéro: ${aliSabry.jerseyNumber || aliSabry.number}`)
  console.log(`   Position: ${aliSabry.position || 'N/A'}`)
  
  // 2. Vérifier s'il existe déjà dans playerAccounts
  const existingPA = await db.collection('playerAccounts')
    .where('email', '==', aliSabry.email)
    .limit(1)
    .get()
  
  if (!existingPA.empty) {
    // Mettre à jour l'existant
    const existingDoc = existingPA.docs[0]
    const existingData = existingDoc.data()
    
    console.log('\n📝 Mise à jour du playerAccount existant...')
    
    const updates: any = {
      teamId: teamId,
      teamName: teamName,
      firstName: aliSabry.firstName,
      lastName: aliSabry.lastName,
      jerseyNumber: aliSabry.jerseyNumber || aliSabry.number,
      updatedAt: new Date()
    }
    
    if (aliSabry.position) updates.position = aliSabry.position
    if (aliSabry.birthDate) updates.birthDate = aliSabry.birthDate
    if (aliSabry.height !== undefined) updates.height = aliSabry.height
    if (aliSabry.foot) updates.foot = aliSabry.foot
    if (aliSabry.tshirtSize) updates.tshirtSize = aliSabry.tshirtSize
    if (aliSabry.grade) updates.grade = aliSabry.grade
    if (aliSabry.phone) updates.phone = aliSabry.phone
    
    await existingDoc.ref.update(updates)
    console.log('✅ PlayerAccount mis à jour')
  } else {
    // Créer un nouveau playerAccount
    console.log('\n📝 Création d\'un nouveau playerAccount...')
    
    const newPlayerAccount: any = {
      email: aliSabry.email,
      firstName: aliSabry.firstName,
      lastName: aliSabry.lastName,
      teamId: teamId,
      teamName: teamName,
      jerseyNumber: aliSabry.jerseyNumber || aliSabry.number,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    if (aliSabry.position) newPlayerAccount.position = aliSabry.position
    if (aliSabry.birthDate) newPlayerAccount.birthDate = aliSabry.birthDate
    if (aliSabry.height !== undefined) newPlayerAccount.height = aliSabry.height
    if (aliSabry.foot) newPlayerAccount.foot = aliSabry.foot
    if (aliSabry.tshirtSize) newPlayerAccount.tshirtSize = aliSabry.tshirtSize
    if (aliSabry.grade) newPlayerAccount.grade = aliSabry.grade
    if (aliSabry.phone) newPlayerAccount.phone = aliSabry.phone
    
    await db.collection('playerAccounts').add(newPlayerAccount)
    console.log('✅ PlayerAccount créé')
  }
  
  // 3. Mettre à jour teams.players
  console.log('\n📝 Mise à jour de teams.players...')
  const teamDoc = await db.collection('teams').doc(teamId).get()
  if (teamDoc.exists) {
    const teamData = teamDoc.data()
    const currentPlayers = teamData?.players || []
    
    // Vérifier si Ali Sabry est déjà dans teams.players
    const aliInPlayers = currentPlayers.find((p: any) => 
      p.email?.toLowerCase()?.trim() === 'aleyeldingasser@gmail.com'
    )
    
    if (!aliInPlayers) {
      const newPlayer: any = {
        firstName: aliSabry.firstName,
        lastName: aliSabry.lastName,
        email: aliSabry.email,
        number: aliSabry.jerseyNumber || aliSabry.number,
        jerseyNumber: aliSabry.jerseyNumber || aliSabry.number
      }
      
      if (aliSabry.position) newPlayer.position = aliSabry.position
      if (aliSabry.birthDate) newPlayer.birthDate = aliSabry.birthDate
      if (aliSabry.height !== undefined) newPlayer.height = aliSabry.height
      if (aliSabry.foot) newPlayer.foot = aliSabry.foot
      if (aliSabry.tshirtSize) newPlayer.tshirtSize = aliSabry.tshirtSize
      if (aliSabry.grade) newPlayer.grade = aliSabry.grade
      if (aliSabry.phone) newPlayer.phone = aliSabry.phone
      
      const updatedPlayers = [...currentPlayers, newPlayer]
      await teamDoc.ref.update({
        players: updatedPlayers,
        updatedAt: new Date()
      })
      console.log('✅ teams.players mis à jour (10 joueurs maintenant)')
    } else {
      console.log('✅ Ali Sabry déjà présent dans teams.players')
    }
  }
  
  console.log('\n✅ Ajout terminé! Road To Glory a maintenant 10 joueurs.')
}

addAliSabry()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

