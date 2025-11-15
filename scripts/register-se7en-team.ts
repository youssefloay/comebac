#!/usr/bin/env node

/**
 * Script pour réinscrire l'équipe Se7en
 * 
 * Usage:
 *   npm run register-se7en-team
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

// Calculer l'âge à partir de la date de naissance
function calculateAge(birthDate: string): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

async function main() {
  console.log('⚽ Script de réinscription de l\'équipe Se7en')
  console.log('=' .repeat(60))
  console.log()

  try {
    console.log('📝 Résumé de l\'inscription:')
    console.log('─'.repeat(60))
    console.log(`Équipe: Se7en`)
    console.log(`École: Lycee International Concordia`)
    console.log(`Classe: Terminale`)
    console.log(`Nombre de joueurs: 7`)
    console.log()
    console.log('⚠️  Note: Les emails seront temporaires (pending-email-X@temp.comebac.com)')
    console.log('   Le capitaine pourra les mettre à jour via un lien unique')
    console.log()

    const confirm = await question('Confirmer l\'inscription? (oui/non): ')
    if (confirm.toLowerCase() !== 'oui') {
      console.log('❌ Annulé')
      rl.close()
      return
    }

    console.log()
    console.log('🚀 Inscription en cours...')
    console.log()

    // Données de l'équipe Se7en avec emails temporaires
    const registrationData = {
      teamName: 'Se7en',
      schoolName: 'Lycee International Concordia',
      teamGrade: 'Terminale',
      captain: {
        firstName: 'Wael',
        lastName: 'Genena',
        email: 'waymaneg@gmail.com', // Email du capitaine est correct
        phone: '01011511177'
      },
      players: [
        {
          firstName: 'Wael',
          lastName: 'Genena',
          nickname: 'Genena',
          email: 'waymaneg@gmail.com',
          phone: '01011511177',
          birthDate: '2008-08-11',
          age: calculateAge('2008-08-11'),
          height: 175,
          tshirtSize: 'M',
          position: 'Attaquant',
          foot: 'Gaucher',
          jerseyNumber: 10,
          grade: 'Terminale'
        },
        {
          firstName: 'Ali',
          lastName: 'Hossam',
          nickname: 'El Azrak',
          email: 'pending-email-se7en-2@temp.comebac.com', // Email temporaire
          phone: '01099024462',
          birthDate: '2008-04-30',
          age: calculateAge('2008-04-30'),
          height: 183,
          tshirtSize: 'L',
          position: 'Gardien',
          foot: 'Droitier',
          jerseyNumber: 1,
          grade: 'Terminale'
        },
        {
          firstName: 'Karim',
          lastName: 'Shaarawy',
          nickname: 'Shaarawy',
          email: 'pending-email-se7en-3@temp.comebac.com',
          phone: '01220006951',
          birthDate: '2008-05-28',
          age: calculateAge('2008-05-28'),
          height: 186,
          tshirtSize: 'XL',
          position: 'Attaquant',
          foot: 'Gaucher',
          jerseyNumber: 7,
          grade: 'Terminale'
        },
        {
          firstName: 'Zein El Din',
          lastName: 'Mekawy',
          nickname: 'Zein',
          email: 'pending-email-se7en-4@temp.comebac.com',
          phone: '01070769951',
          birthDate: '2008-07-06',
          age: calculateAge('2008-07-06'),
          height: 185,
          tshirtSize: 'L',
          position: 'Milieu',
          foot: 'Droitier',
          jerseyNumber: 11,
          grade: 'Terminale'
        },
        {
          firstName: 'Sergio',
          lastName: 'Armani',
          nickname: 'Sergio',
          email: 'pending-email-se7en-5@temp.comebac.com',
          phone: '0127418081',
          birthDate: '2009-06-27',
          age: calculateAge('2009-06-27'),
          height: 181,
          tshirtSize: 'L',
          position: 'Défenseur',
          foot: 'Droitier',
          jerseyNumber: 6,
          grade: 'Terminale'
        },
        {
          firstName: 'Yassin',
          lastName: 'Helmy',
          nickname: 'Helmy',
          email: 'pending-email-se7en-6@temp.comebac.com',
          phone: '0100912022',
          birthDate: '2008-01-01',
          age: calculateAge('2008-01-01'),
          height: 185,
          tshirtSize: 'L',
          position: 'Défenseur',
          foot: 'Droitier',
          jerseyNumber: 2,
          grade: 'Terminale'
        },
        {
          firstName: 'Mostafa',
          lastName: 'Osman',
          nickname: 'Mostafa',
          email: 'pending-email-se7en-7@temp.comebac.com',
          phone: '0127603379',
          birthDate: '2008-08-27',
          age: calculateAge('2008-08-27'),
          height: 175,
          tshirtSize: 'M',
          position: 'Défenseur',
          foot: 'Droitier',
          jerseyNumber: 5,
          grade: 'Terminale'
        }
      ],
      status: 'pending',
      needsEmailUpdate: true, // Flag pour indiquer que les emails doivent être mis à jour
      submittedAt: Timestamp.now(),
      createdAt: Timestamp.now()
    }

    // Insérer dans Firebase
    const docRef = await db.collection('teamRegistrations').add(registrationData)
    
    console.log('✅ Équipe inscrite avec succès!')
    console.log()
    console.log('📊 Détails de l\'inscription:')
    console.log('─'.repeat(60))
    console.log(`ID d'inscription: ${docRef.id}`)
    console.log(`Équipe: ${registrationData.teamName}`)
    console.log(`École: ${registrationData.schoolName}`)
    console.log(`Classe: ${registrationData.teamGrade}`)
    console.log()
    console.log('👥 Joueurs inscrits:')
    registrationData.players.forEach((player, index) => {
      console.log(`  ${index + 1}. ${player.firstName} ${player.lastName} (${player.nickname})`)
      console.log(`     Email: ${player.email}`)
      console.log(`     Position: ${player.position} | N°${player.jerseyNumber}`)
      console.log()
    })
    console.log('─'.repeat(60))
    console.log()
    console.log('📧 Prochaines étapes:')
    console.log('  1. Approuver l\'inscription dans /admin/team-registrations')
    console.log('  2. Générer un lien unique pour le capitaine')
    console.log('  3. Le capitaine mettra à jour les emails des joueurs')
    console.log('  4. Valider les modifications')
    console.log()
    console.log('=' .repeat(60))
    console.log('✅ Inscription terminée!')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
