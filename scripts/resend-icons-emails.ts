#!/usr/bin/env node

/**
 * Script pour renvoyer les emails aux joueurs ICONS qui n'ont jamais été connectés
 * 
 * Usage:
 *   npm run resend-icons-emails
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { sendEmail, generateWelcomeEmail } from '../lib/email-service'
import * as readline from 'readline'

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('📧 Renvoi des emails aux joueurs ICONS')
  console.log('=' .repeat(60))
  console.log()

  try {
    // 1. Chercher l'équipe ICONS
    const registrationsSnap = await db.collection('teamRegistrations')
      .where('teamName', '==', 'ICONS')
      .get()

    if (registrationsSnap.empty) {
      console.log('❌ Équipe ICONS non trouvée')
      rl.close()
      return
    }

    const registration = registrationsSnap.docs[0]
    const regData = registration.data()

    if (!regData.teamId) {
      console.log('❌ L\'équipe n\'a pas encore été approuvée')
      rl.close()
      return
    }

    // 2. Récupérer les joueurs qui n'ont jamais été connectés
    const playersToEmail: any[] = []

    console.log('🔍 Vérification des joueurs...')
    console.log()

    for (const player of regData.players) {
      try {
        const userRecord = await auth.getUserByEmail(player.email)
        
        // Si jamais connecté, ajouter à la liste
        if (!userRecord.metadata.lastSignInTime) {
          playersToEmail.push({
            ...player,
            uid: userRecord.uid
          })
          console.log(`📧 ${player.firstName} ${player.lastName} (${player.email}) - Jamais connecté`)
        } else {
          console.log(`✅ ${player.firstName} ${player.lastName} (${player.email}) - Déjà connecté`)
        }
      } catch (error: any) {
        console.log(`⚠️  ${player.firstName} ${player.lastName} (${player.email}) - Compte non trouvé`)
      }
    }

    console.log()
    console.log('─'.repeat(60))
    console.log(`Total à contacter: ${playersToEmail.length} joueur(s)`)
    console.log()

    if (playersToEmail.length === 0) {
      console.log('✅ Tous les joueurs se sont déjà connectés!')
      rl.close()
      return
    }

    // 3. Demander confirmation
    const confirm = await question(`Envoyer les emails à ces ${playersToEmail.length} joueur(s)? (oui/non): `)
    if (confirm.toLowerCase() !== 'oui') {
      console.log('❌ Annulé')
      rl.close()
      return
    }

    console.log()
    console.log('📧 Envoi des emails en cours...')
    console.log()

    // 4. Envoyer les emails
    let successCount = 0
    let errorCount = 0

    for (const player of playersToEmail) {
      try {
        // Générer un nouveau lien de réinitialisation
        const resetLink = await auth.generatePasswordResetLink(player.email)
        
        // Envoyer l'email
        const emailContent = generateWelcomeEmail(
          `${player.firstName} ${player.lastName}`,
          regData.teamName,
          resetLink,
          player.email
        )
        
        const result = await sendEmail(emailContent)
        
        if (result.success) {
          console.log(`✅ Email envoyé à ${player.firstName} ${player.lastName} (${player.email})`)
          successCount++
        } else {
          console.log(`❌ Échec pour ${player.firstName} ${player.lastName} (${player.email})`)
          console.log(`   Erreur: ${result.error}`)
          errorCount++
        }
      } catch (error: any) {
        console.log(`❌ Erreur pour ${player.firstName} ${player.lastName} (${player.email})`)
        console.log(`   ${error.message}`)
        errorCount++
      }
    }

    console.log()
    console.log('=' .repeat(60))
    console.log('📊 Résumé:')
    console.log(`✅ Emails envoyés: ${successCount}`)
    console.log(`❌ Échecs: ${errorCount}`)
    console.log()
    
    if (successCount > 0) {
      console.log('💡 Les joueurs vont recevoir un email avec un lien pour créer leur mot de passe.')
      console.log('   Le lien est valable pendant 24 heures.')
    }

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
