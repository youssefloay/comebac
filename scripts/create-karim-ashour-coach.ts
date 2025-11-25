/**
 * Script pour créer Karim Ashour (kikoashour@gmail.com) comme entraîneur
 */

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

const adminDb = getFirestore()

const EMAIL = 'kikoashour@gmail.com'
const FIRST_NAME = 'Karim'
const LAST_NAME = 'Ashour'
const TEAM_NAME = 'Prime'

async function createKarimAshourCoach() {
  console.log('👨‍🏫 Création du compte entraîneur pour Karim Ashour')
  console.log(`   Email: ${EMAIL}`)
  console.log(`   Nom: ${FIRST_NAME} ${LAST_NAME}`)
  console.log(`   Équipe: ${TEAM_NAME}`)
  console.log('='.repeat(60))
  console.log()

  try {
    // 1. Trouver l'équipe Prime
    console.log('1️⃣ Recherche de l\'équipe Prime...')
    const teamsSnap = await adminDb.collection('teams')
      .where('name', '==', TEAM_NAME)
      .get()
    
    if (teamsSnap.empty) {
      console.log('   ❌ Équipe Prime non trouvée')
      return
    }

    const teamDoc = teamsSnap.docs[0]
    const teamId = teamDoc.id
    const teamData = teamDoc.data()
    
    console.log(`   ✅ Équipe trouvée: ${teamData.name} (ID: ${teamId})`)
    console.log()

    // 2. Vérifier si le compte existe déjà
    console.log('2️⃣ Vérification si le compte existe déjà...')
    const existingCoachSnap = await adminDb.collection('coachAccounts')
      .where('email', '==', EMAIL)
      .get()
    
    if (!existingCoachSnap.empty) {
      const existing = existingCoachSnap.docs[0].data()
      console.log(`   ⚠️  Compte entraîneur existe déjà (ID: ${existingCoachSnap.docs[0].id})`)
      console.log(`   Équipe actuelle: ${existing.teamName}`)
      
      // Mettre à jour si l'équipe est différente
      if (existing.teamId !== teamId) {
        await existingCoachSnap.docs[0].ref.update({
          teamId: teamId,
          teamName: TEAM_NAME,
          updatedAt: new Date()
        })
        console.log(`   ✅ Équipe mise à jour vers: ${TEAM_NAME}`)
      } else {
        console.log(`   ℹ️  Déjà dans la bonne équipe`)
      }
      return
    }
    console.log()

    // 3. Créer le compte entraîneur
    console.log('3️⃣ Création du compte entraîneur...')
    const coachData = {
      email: EMAIL,
      firstName: FIRST_NAME,
      lastName: LAST_NAME,
      teamId: teamId,
      teamName: TEAM_NAME,
      phone: '', // À compléter si nécessaire
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const coachRef = await adminDb.collection('coachAccounts').add(coachData)
    console.log(`   ✅ Compte entraîneur créé (ID: ${coachRef.id})`)
    console.log()

    // 4. Vérifier si l'équipe a déjà un coach dans teams.coach
    console.log('4️⃣ Vérification de teams.coach...')
    if (teamData.coach) {
      console.log(`   ℹ️  L'équipe a déjà un coach: ${teamData.coach.email || teamData.coach.name}`)
    } else {
      // Ajouter le coach dans teams.coach
      await teamDoc.ref.update({
        coach: {
          email: EMAIL,
          firstName: FIRST_NAME,
          lastName: LAST_NAME,
          name: `${FIRST_NAME} ${LAST_NAME}`
        },
        updatedAt: new Date()
      })
      console.log(`   ✅ Coach ajouté dans teams.coach`)
    }
    console.log()

    // Résumé
    console.log('='.repeat(60))
    console.log('📊 RÉSUMÉ:')
    console.log(`   ✅ Karim Ashour est maintenant entraîneur de ${TEAM_NAME}`)
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Équipe ID: ${teamId}`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

createKarimAshourCoach().catch(console.error)

