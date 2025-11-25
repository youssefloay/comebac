import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

async function addMichaelWaguihToCollections() {
  console.log('➕ Ajout de Michael Waguih dans players et playerAccounts...')
  console.log('============================================================\n')

  const saintsTeamId = 'MHBdumu4cSU6ExLRlrrj'
  const michaelWaguihEmail = 'michaelawaguih0@gmail.com'

  // 1. Récupérer les données de Michael Waguih depuis teams.players
  console.log('1️⃣ Récupération des données depuis teams.players...')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Saints')
    .get()

  if (teamsSnap.empty) {
    console.log('   ❌ Équipe Saints non trouvée')
    return
  }

  const teamData = teamsSnap.docs[0].data()
  const michaelPlayer = teamData.players?.find((p: any) => 
    p.email?.toLowerCase() === michaelWaguihEmail.toLowerCase()
  )

  if (!michaelPlayer) {
    console.log('   ❌ Michael Waguih non trouvé dans teams.players')
    return
  }

  console.log(`   ✅ Données trouvées:`)
  console.log(`      - Email: ${michaelPlayer.email}`)
  console.log(`      - Nom: ${michaelPlayer.firstName} ${michaelPlayer.lastName}`)
  console.log(`      - Position: ${michaelPlayer.position || 'N/A'}`)
  console.log(`      - Numéro: ${michaelPlayer.number || 'N/A'}`)

  // 2. Ajouter dans players
  console.log('\n2️⃣ Ajout dans players...')
  const existingPlayer = await db.collection('players')
    .where('email', '==', michaelWaguihEmail)
    .limit(1)
    .get()

  if (!existingPlayer.empty) {
    const existingData = existingPlayer.docs[0].data()
    console.log(`   ℹ️  Joueur existe déjà dans players (ID: ${existingPlayer.docs[0].id})`)
    console.log(`      - Team ID actuel: ${existingData.teamId || 'N/A'}`)
    
    if (existingData.teamId !== saintsTeamId) {
      await db.collection('players').doc(existingPlayer.docs[0].id).update({
        teamId: saintsTeamId,
        name: `${michaelPlayer.firstName} ${michaelPlayer.lastName}`,
        firstName: michaelPlayer.firstName,
        lastName: michaelPlayer.lastName,
        number: michaelPlayer.number || 0,
        position: michaelPlayer.position || '',
        email: michaelPlayer.email,
        phone: michaelPlayer.phone || '',
        birthDate: michaelPlayer.birthDate || '',
        age: michaelPlayer.age || 0,
        height: michaelPlayer.height || 0,
        tshirtSize: michaelPlayer.tshirtSize || 'M',
        strongFoot: michaelPlayer.strongFoot || 'Droit',
        updatedAt: Timestamp.now()
      })
      console.log(`   ✅ Joueur mis à jour avec le bon teamId`)
    } else {
      console.log(`   ✅ Joueur a déjà le bon teamId`)
    }
  } else {
    const playerData = {
      name: `${michaelPlayer.firstName} ${michaelPlayer.lastName}`,
      firstName: michaelPlayer.firstName,
      lastName: michaelPlayer.lastName,
      number: michaelPlayer.number || 0,
      position: michaelPlayer.position || '',
      teamId: saintsTeamId,
      nationality: 'Égypte',
      email: michaelPlayer.email,
      phone: michaelPlayer.phone || '',
      birthDate: michaelPlayer.birthDate || '',
      age: michaelPlayer.age || 0,
      height: michaelPlayer.height || 0,
      tshirtSize: michaelPlayer.tshirtSize || 'M',
      strongFoot: michaelPlayer.strongFoot || 'Droit',
      isCaptain: michaelPlayer.isCaptain || false,
      overall: 75,
      seasonStats: {
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    await db.collection('players').add(playerData)
    console.log(`   ✅ Joueur ajouté dans players`)
  }

  // 3. Ajouter dans playerAccounts
  console.log('\n3️⃣ Ajout dans playerAccounts...')
  const existingAccount = await db.collection('playerAccounts')
    .where('email', '==', michaelWaguihEmail)
    .limit(1)
    .get()

  if (!existingAccount.empty) {
    const existingData = existingAccount.docs[0].data()
    console.log(`   ℹ️  Compte existe déjà dans playerAccounts (ID: ${existingAccount.docs[0].id})`)
    console.log(`      - Team ID actuel: ${existingData.teamId || 'N/A'}`)
    
    if (existingData.teamId !== saintsTeamId) {
      await db.collection('playerAccounts').doc(existingAccount.docs[0].id).update({
        teamId: saintsTeamId,
        teamName: 'Saints',
        firstName: michaelPlayer.firstName,
        lastName: michaelPlayer.lastName,
        nickname: michaelPlayer.nickname || '',
        email: michaelPlayer.email,
        phone: michaelPlayer.phone || '',
        position: michaelPlayer.position || '',
        jerseyNumber: michaelPlayer.number || 0,
        birthDate: michaelPlayer.birthDate || '',
        height: michaelPlayer.height || 0,
        tshirtSize: michaelPlayer.tshirtSize || 'M',
        foot: michaelPlayer.strongFoot === 'Droit' ? 'Droitier' : michaelPlayer.strongFoot === 'Gauche' ? 'Gaucher' : 'Ambidextre',
        role: 'player',
        updatedAt: Timestamp.now()
      })
      console.log(`   ✅ Compte mis à jour avec le bon teamId`)
    } else {
      console.log(`   ✅ Compte a déjà le bon teamId`)
    }
  } else {
    const accountData = {
      firstName: michaelPlayer.firstName,
      lastName: michaelPlayer.lastName,
      nickname: michaelPlayer.nickname || '',
      email: michaelPlayer.email,
      phone: michaelPlayer.phone || '',
      position: michaelPlayer.position || '',
      jerseyNumber: michaelPlayer.number || 0,
      teamId: saintsTeamId,
      teamName: 'Saints',
      birthDate: michaelPlayer.birthDate || '',
      height: michaelPlayer.height || 0,
      tshirtSize: michaelPlayer.tshirtSize || 'M',
      foot: michaelPlayer.strongFoot === 'Droit' ? 'Droitier' : michaelPlayer.strongFoot === 'Gauche' ? 'Gaucher' : 'Ambidextre',
      role: 'player',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    await db.collection('playerAccounts').add(accountData)
    console.log(`   ✅ Compte ajouté dans playerAccounts`)
  }

  console.log('\n============================================================')
  console.log('✅ Opération terminée!')
  console.log('============================================================')
  console.log('\n💡 Michael Waguih devrait maintenant apparaître dans "Gestion des Équipes"')
  console.log('   Rafraîchissez la page si nécessaire')
}

addMichaelWaguihToCollections().catch(console.error)

