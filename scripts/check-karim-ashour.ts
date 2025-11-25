/**
 * Script pour vérifier qui est Karim Ashour (kikoashour@gmail.com)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
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

const adminDb = getFirestore()
const adminAuth = getAuth()

const EMAIL = 'kikoashour@gmail.com'

async function checkKarimAshour() {
  console.log('🔍 Recherche d\'informations sur Karim Ashour')
  console.log(`   Email: ${EMAIL}`)
  console.log('='.repeat(60))
  console.log()

  try {
    // 1. Vérifier dans Firebase Auth
    console.log('1️⃣ Firebase Auth:')
    try {
      const user = await adminAuth.getUserByEmail(EMAIL)
      console.log(`   ✅ Compte trouvé (UID: ${user.uid})`)
      console.log(`   Email vérifié: ${user.emailVerified}`)
      console.log(`   Créé le: ${user.metadata.creationTime}`)
      console.log(`   Dernière connexion: ${user.metadata.lastSignInTime || 'Jamais'}`)
    } catch (error: any) {
      console.log(`   ❌ Compte non trouvé: ${error.message}`)
    }
    console.log()

    // 2. Vérifier dans coachAccounts
    console.log('2️⃣ coachAccounts:')
    const coachAccountsSnap = await adminDb.collection('coachAccounts')
      .where('email', '==', EMAIL)
      .get()
    
    if (!coachAccountsSnap.empty) {
      coachAccountsSnap.docs.forEach(doc => {
        const data = doc.data()
        console.log(`   ✅ Entraîneur trouvé (ID: ${doc.id})`)
        console.log(`   Nom: ${data.firstName} ${data.lastName}`)
        console.log(`   Équipe: ${data.teamName} (ID: ${data.teamId})`)
        console.log(`   Téléphone: ${data.phone || 'N/A'}`)
        console.log(`   Créé le: ${data.createdAt?.toDate?.() || data.createdAt || 'N/A'}`)
      })
    } else {
      console.log('   ❌ Aucun compte entraîneur trouvé')
    }
    console.log()

    // 3. Vérifier dans playerAccounts
    console.log('3️⃣ playerAccounts:')
    const playerAccountsSnap = await adminDb.collection('playerAccounts')
      .where('email', '==', EMAIL)
      .get()
    
    if (!playerAccountsSnap.empty) {
      playerAccountsSnap.docs.forEach(doc => {
        const data = doc.data()
        console.log(`   ✅ Compte joueur trouvé (ID: ${doc.id})`)
        console.log(`   Nom: ${data.firstName} ${data.lastName}`)
        console.log(`   Surnom: ${data.nickname || 'N/A'}`)
        console.log(`   Équipe: ${data.teamName} (ID: ${data.teamId})`)
        console.log(`   Position: ${data.position || 'N/A'}`)
        console.log(`   Numéro: ${data.jerseyNumber || 'N/A'}`)
        console.log(`   Coach intérimaire: ${data.isActingCoach ? 'Oui' : 'Non'}`)
        console.log(`   Créé le: ${data.createdAt?.toDate?.() || data.createdAt || 'N/A'}`)
      })
    } else {
      console.log('   ❌ Aucun compte joueur trouvé')
    }
    console.log()

    // 4. Vérifier dans la collection players
    console.log('4️⃣ players:')
    const playersSnap = await adminDb.collection('players')
      .where('email', '==', EMAIL)
      .get()
    
    if (!playersSnap.empty) {
      playersSnap.docs.forEach(doc => {
        const data = doc.data()
        console.log(`   ✅ Joueur trouvé (ID: ${doc.id})`)
        console.log(`   Nom: ${data.name || `${data.firstName} ${data.lastName}`}`)
        console.log(`   Équipe: ${data.teamId || 'N/A'}`)
        console.log(`   Position: ${data.position || 'N/A'}`)
        console.log(`   Numéro: ${data.number || data.jerseyNumber || 'N/A'}`)
        console.log(`   Est entraîneur: ${data.isCoach ? 'Oui' : 'Non'}`)
        console.log(`   Est capitaine: ${data.isCaptain ? 'Oui' : 'Non'}`)
      })
    } else {
      console.log('   ❌ Aucun joueur trouvé')
    }
    console.log()

    // 5. Vérifier dans teams.players
    console.log('5️⃣ teams (dans le tableau players):')
    const teamsSnap = await adminDb.collection('teams').get()
    let foundInTeams = false
    
    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      if (teamData.players && Array.isArray(teamData.players)) {
        const player = teamData.players.find((p: any) => 
          p.email?.toLowerCase() === EMAIL.toLowerCase()
        )
        if (player) {
          foundInTeams = true
          console.log(`   ✅ Trouvé dans l'équipe: ${teamData.name} (ID: ${teamDoc.id})`)
          console.log(`   Nom: ${player.firstName || player.name?.split(' ')[0] || ''} ${player.lastName || player.name?.split(' ').slice(1).join(' ') || ''}`)
          console.log(`   Position: ${player.position || 'N/A'}`)
          console.log(`   Numéro: ${player.jerseyNumber || player.number || 'N/A'}`)
          console.log(`   Est entraîneur: ${player.isCoach ? 'Oui' : 'Non'}`)
        }
      }
    }
    
    if (!foundInTeams) {
      console.log('   ❌ Non trouvé dans les équipes')
    }
    console.log()

    // 6. Résumé
    console.log('='.repeat(60))
    console.log('📊 RÉSUMÉ:')
    const isCoach = !coachAccountsSnap.empty
    const isPlayer = !playerAccountsSnap.empty || !playersSnap.empty
    
    if (isCoach) {
      console.log('   ✅ C\'est un ENTRAÎNEUR')
      const coachData = coachAccountsSnap.docs[0].data()
      console.log(`   Équipe: ${coachData.teamName}`)
    }
    
    if (isPlayer) {
      console.log('   ⚠️  AUSSI trouvé comme JOUEUR')
      if (isCoach) {
        console.log('   ⚠️  PROBLÈME: Présent à la fois comme entraîneur ET joueur!')
      }
    }
    
    if (!isCoach && !isPlayer) {
      console.log('   ❌ Non trouvé dans la base de données')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

checkKarimAshour().catch(console.error)

