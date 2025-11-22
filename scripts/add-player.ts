#!/usr/bin/env node

import { resolve } from 'path'
import { config } from 'dotenv'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { generateWelcomeEmail, sendEmail } from '../lib/email-service'
import { getPasswordResetActionCodeSettings } from '../lib/password-reset'

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
const auth = getAuth()

interface PlayerData {
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  height: number
  tshirtSize: string
  position: string
  foot: string
  jerseyNumber: number
}

async function addPlayerToTeam(teamName: string, player: PlayerData) {
  try {
    console.log(`🔍 Recherche de l'équipe "${teamName}"...`)
    
    // 1. Trouver l'équipe
    const teamsSnap = await db.collection('teams').get()
    let team = teamsSnap.docs.find(doc => 
      doc.data().name?.toLowerCase() === teamName.toLowerCase()
    )
    
    let teamId: string
    let finalTeamName: string
    
    if (!team) {
      // Chercher dans teamRegistrations
      const registrationsSnap = await db.collection('teamRegistrations').get()
      const registration = registrationsSnap.docs.find(doc => 
        doc.data().teamName?.toLowerCase() === teamName.toLowerCase()
      )
      
      if (!registration) {
        console.error(`❌ Équipe "${teamName}" non trouvée`)
        console.log('\nÉquipes disponibles:')
        teamsSnap.docs.forEach(doc => {
          console.log(`  - ${doc.data().name}`)
        })
        return
      }
      
      teamId = registration.id
      finalTeamName = registration.data().teamName
    } else {
      teamId = team.id
      finalTeamName = team.data().name
    }
    
    console.log(`✅ Équipe trouvée: ${finalTeamName} (${teamId})`)
    
    const email = player.email
    
    // 2. Nettoyer les doublons dans players
    const playersSnap = await db.collection('players')
      .where('email', '==', email)
      .get()
    
    if (!playersSnap.empty) {
      console.log(`⚠️  ${playersSnap.size} doublon(s) trouvé(s) dans players, suppression...`)
      for (const doc of playersSnap.docs) {
        await doc.ref.delete()
      }
    }
    
    // 3. Ajouter dans players
    console.log('📝 Ajout dans players...')
    await db.collection('players').add({
      name: `${player.firstName} ${player.lastName}`,
      number: player.jerseyNumber,
      position: player.position,
      teamId: teamId,
      nationality: 'Égypte',
      isCaptain: false,
      email: player.email,
      phone: player.phone,
      firstName: player.firstName,
      lastName: player.lastName,
      birthDate: player.birthDate,
      height: player.height,
      tshirtSize: player.tshirtSize,
      strongFoot: player.foot === 'droite' || player.foot === 'Droitier' ? 'Droit' : player.foot === 'gauche' || player.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
      overall: 75,
      seasonStats: {
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log('✅ Joueur ajouté dans players')
    
    // 4. Nettoyer les doublons dans playerAccounts
    const accountsSnap = await db.collection('playerAccounts')
      .where('email', '==', email)
      .get()
    
    if (!accountsSnap.empty) {
      console.log(`⚠️  ${accountsSnap.size} compte(s) en doublon dans playerAccounts, suppression...`)
      for (const doc of accountsSnap.docs) {
        await doc.ref.delete()
      }
    }
    
    // 5. Créer le compte dans playerAccounts
    console.log('📝 Création du compte playerAccounts...')
    await db.collection('playerAccounts').add({
      email: player.email,
      firstName: player.firstName,
      lastName: player.lastName,
      phone: player.phone,
      birthDate: player.birthDate,
      teamId: teamId,
      teamName: finalTeamName,
      photo: '',
      isActingCoach: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log('✅ Compte playerAccounts créé')
    
    // 6. Créer/Vérifier le compte Firebase Auth
    let userRecord
    try {
      userRecord = await auth.getUserByEmail(email)
      console.log('✅ Compte Firebase Auth existe déjà')
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: email,
          emailVerified: false,
          password: Math.random().toString(36).slice(-8) + 'Aa1!',
          displayName: `${player.firstName} ${player.lastName}`
        })
        console.log('✅ Compte Firebase Auth créé')
      } else {
        throw error
      }
    }
    
    // 7. Envoyer l'email
    console.log('📧 Envoi de l\'email...')
    try {
      const resetLink = await auth.generatePasswordResetLink(email, getPasswordResetActionCodeSettings(email))
      const emailData = generateWelcomeEmail(
        `${player.firstName} ${player.lastName}`,
        finalTeamName,
        resetLink,
        email
      )
      
      const emailResult = await sendEmail(emailData)
      
      if (emailResult.success) {
        console.log('✅ Email envoyé avec succès')
      } else {
        console.error('❌ Erreur envoi email:', emailResult.error)
      }
      
      console.log('\n✅ Joueur ajouté avec succès!')
      console.log(`   Nom: ${player.firstName} ${player.lastName}`)
      console.log(`   Email: ${email}`)
      console.log(`   Équipe: ${finalTeamName}`)
      console.log(`   Numéro: ${player.jerseyNumber}`)
      
    } catch (emailError: any) {
      console.error('❌ Erreur envoi email:', emailError.message)
      console.log('\n⚠️  Joueur ajouté mais email non envoyé')
    }
    
  } catch (error: any) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

// Données du joueur
const playerData: PlayerData = {
  firstName: 'Sergio',
  lastName: 'Armani',
  email: 'sergioarmani2009@gmail.com',
  phone: '01277418081',
  birthDate: '2009-06-27', // Format YYYY-MM-DD
  height: 181,
  tshirtSize: 'XL',
  position: 'Milieu',
  foot: 'droite',
  jerseyNumber: 6
}

// Ajouter le joueur à l'équipe "Devils"
addPlayerToTeam('Devils', playerData)
  .then(() => {
    console.log('\n✅ Terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

