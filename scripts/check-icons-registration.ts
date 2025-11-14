#!/usr/bin/env node

/**
 * Script pour vérifier le statut de l'inscription ICONS
 * 
 * Usage:
 *   npm run check-icons-registration
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

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
const auth = getAuth()

async function main() {
  console.log('🔍 Vérification de l\'inscription ICONS')
  console.log('=' .repeat(60))
  console.log()

  try {
    // 1. Chercher l'inscription ICONS
    const registrationsSnap = await db.collection('teamRegistrations')
      .where('teamName', '==', 'ICONS')
      .get()

    if (registrationsSnap.empty) {
      console.log('❌ Aucune inscription trouvée pour l\'équipe ICONS')
      return
    }

    const registration = registrationsSnap.docs[0]
    const regData = registration.data()

    console.log('📋 Inscription trouvée:')
    console.log('─'.repeat(60))
    console.log(`ID: ${registration.id}`)
    console.log(`Équipe: ${regData.teamName}`)
    console.log(`École: ${regData.schoolName}`)
    console.log(`Classe: ${regData.teamGrade}`)
    console.log(`Statut: ${regData.status}`)
    console.log(`Soumise le: ${regData.submittedAt?.toDate?.() || 'N/A'}`)
    if (regData.processedAt) {
      console.log(`Traitée le: ${regData.processedAt.toDate()}`)
      console.log(`Traitée par: ${regData.processedBy || 'N/A'}`)
    }
    if (regData.teamId) {
      console.log(`Team ID créé: ${regData.teamId}`)
    }
    console.log()

    // 2. Vérifier si l'équipe a été créée
    if (regData.teamId) {
      const teamDoc = await db.collection('teams').doc(regData.teamId).get()
      if (teamDoc.exists) {
        console.log('✅ Équipe créée dans la base de données')
        console.log()
      } else {
        console.log('⚠️  Équipe non trouvée dans la base de données')
        console.log()
      }

      // 3. Vérifier les joueurs
      const playersSnap = await db.collection('players')
        .where('teamId', '==', regData.teamId)
        .get()

      console.log(`👥 Joueurs créés: ${playersSnap.size}`)
      console.log()

      // 4. Vérifier les comptes joueurs
      console.log('🔐 Vérification des comptes Firebase Auth:')
      console.log('─'.repeat(60))
      
      for (const player of regData.players) {
        try {
          const userRecord = await auth.getUserByEmail(player.email)
          console.log(`✅ ${player.firstName} ${player.lastName} (${player.email})`)
          console.log(`   UID: ${userRecord.uid}`)
          console.log(`   Email vérifié: ${userRecord.emailVerified ? 'Oui' : 'Non'}`)
          console.log(`   Dernière connexion: ${userRecord.metadata.lastSignInTime || 'Jamais'}`)
          console.log()
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            console.log(`❌ ${player.firstName} ${player.lastName} (${player.email})`)
            console.log(`   Compte non créé`)
            console.log()
          } else {
            console.log(`⚠️  ${player.firstName} ${player.lastName} (${player.email})`)
            console.log(`   Erreur: ${error.message}`)
            console.log()
          }
        }
      }

      // 5. Vérifier les playerAccounts
      const playerAccountsSnap = await db.collection('playerAccounts')
        .where('teamId', '==', regData.teamId)
        .get()

      console.log('📊 Comptes joueurs dans playerAccounts:')
      console.log('─'.repeat(60))
      console.log(`Total: ${playerAccountsSnap.size}`)
      console.log()

      if (playerAccountsSnap.size > 0) {
        playerAccountsSnap.forEach(doc => {
          const data = doc.data()
          console.log(`- ${data.firstName} ${data.lastName}`)
          console.log(`  Email: ${data.email}`)
          console.log(`  Statut: ${data.accountStatus || 'N/A'}`)
          console.log(`  Lien reset: ${data.passwordResetLink ? 'Oui' : 'Non'}`)
          console.log()
        })
      }
    } else {
      console.log('⚠️  L\'inscription n\'a pas encore été approuvée')
      console.log()
      console.log('💡 Pour approuver l\'inscription:')
      console.log('   1. Allez sur /admin/team-registrations')
      console.log('   2. Trouvez l\'équipe ICONS')
      console.log('   3. Cliquez sur "Approuver"')
      console.log()
      console.log('   Cela va automatiquement:')
      console.log('   - Créer l\'équipe')
      console.log('   - Créer les joueurs')
      console.log('   - Créer les comptes Firebase Auth')
      console.log('   - Envoyer les emails de bienvenue')
    }

    console.log('=' .repeat(60))

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
