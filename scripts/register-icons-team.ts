#!/usr/bin/env node

/**
 * Script pour inscrire l'équipe ICONS directement dans Firebase
 * 
 * Usage:
 *   npm run register-icons-team
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
  console.log('⚽ Script d\'inscription de l\'équipe ICONS')
  console.log('=' .repeat(60))
  console.log()

  try {
    // Informations de l'équipe
    const schoolName = 'Elders'
    const teamGrade = 'AUTRE'

    console.log('📝 Résumé de l\'inscription:')
    console.log('─'.repeat(60))
    console.log(`Équipe: ICONS`)
    console.log(`École: ${schoolName}`)
    console.log(`Classe: ${teamGrade}`)
    console.log(`Nombre de joueurs: 7`)
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

    // Données de l'équipe ICONS
    const registrationData = {
      teamName: 'ICONS',
      schoolName: schoolName.trim(),
      teamGrade: teamGrade,
      captain: {
        firstName: 'Omar',
        lastName: 'Sa3id',
        email: 'omarhichamsaied96@gmail.com',
        phone: '01278311195'
      },
      players: [
        {
          firstName: 'Omar',
          lastName: 'Sa3id',
          nickname: 'Sa3id',
          email: 'omarhichamsaied96@gmail.com',
          phone: '01278311195',
          birthDate: '1995-06-27',
          age: calculateAge('1995-06-27'),
          height: 188,
          tshirtSize: 'XL',
          position: 'Milieu',
          foot: 'Droitier',
          jerseyNumber: 8,
          grade: teamGrade
        },
        {
          firstName: 'Hassan',
          lastName: 'el amin',
          nickname: 'Amin',
          email: 'hassanmohamedelamin@gmail.com',
          phone: '01127703557',
          birthDate: '2006-10-04',
          age: calculateAge('2006-10-04'),
          height: 171,
          tshirtSize: 'M',
          position: 'Défenseur',
          foot: 'Droitier',
          jerseyNumber: 5,
          grade: teamGrade
        },
        {
          firstName: 'Ali Hatem',
          lastName: 'El Mowafi',
          nickname: 'MOF',
          email: 'alielmowafi@gmail.com',
          phone: '01002156289',
          birthDate: '1995-08-23',
          age: calculateAge('1995-08-23'),
          height: 185,
          tshirtSize: 'M',
          position: 'Attaquant',
          foot: 'Droitier',
          jerseyNumber: 9,
          grade: teamGrade
        },
        {
          firstName: 'Ossama',
          lastName: 'Mohamed',
          nickname: 'Ossama',
          email: 'ossama5555511@gmail.com',
          phone: '01226955555',
          birthDate: '2006-09-25',
          age: calculateAge('2006-09-25'),
          height: 168,
          tshirtSize: 'M',
          position: 'Milieu',
          foot: 'Droitier',
          jerseyNumber: 11,
          grade: teamGrade
        },
        {
          firstName: 'Yassin',
          lastName: 'Medhat',
          nickname: 'Donatelo',
          email: 'Yassinmedhat7105@gmail.com',
          phone: '0102833325',
          birthDate: '2005-04-01',
          age: calculateAge('2005-04-01'),
          height: 174,
          tshirtSize: 'M',
          position: 'Défenseur',
          foot: 'Droitier',
          jerseyNumber: 7,
          grade: teamGrade
        },
        {
          firstName: 'Yehia',
          lastName: 'sherif',
          nickname: 'Youpi',
          email: 'yehiasherif2007@gmail.com',
          phone: '01202282255',
          birthDate: '2007-02-19',
          age: calculateAge('2007-02-19'),
          height: 176,
          tshirtSize: 'XL',
          position: 'Gardien',
          foot: 'Droitier',
          jerseyNumber: 1,
          grade: teamGrade
        },
        {
          firstName: 'Ahmed',
          lastName: 'Osman',
          nickname: 'A.Osman',
          email: 'Othmana382@gmail.com',
          phone: '01285690656',
          birthDate: '2005-10-18',
          age: calculateAge('2005-10-18'),
          height: 171,
          tshirtSize: 'M',
          position: 'Défenseur',
          foot: 'Droitier',
          jerseyNumber: 6,
          grade: teamGrade
        }
      ],
      status: 'pending',
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
      console.log(`     Position: ${player.position} | N°${player.jerseyNumber} | ${player.foot}`)
      console.log(`     Âge: ${player.age} ans | Taille: ${player.height}cm | T-shirt: ${player.tshirtSize}`)
      console.log()
    })
    console.log('─'.repeat(60))
    console.log()
    console.log('📧 Prochaines étapes:')
    console.log('  1. Un administrateur va examiner l\'inscription')
    console.log(`  2. Le capitaine sera contacté à: ${registrationData.captain.email}`)
    console.log('  3. La validation prend généralement 24-48h')
    console.log()
    console.log('=' .repeat(60))
    console.log('✅ Inscription terminée!')

    // Essayer d'envoyer une notification à l'admin (optionnel)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      await fetch(`${API_URL}/api/notify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: registrationData.teamName,
          schoolName: registrationData.schoolName,
          captainName: `${registrationData.captain.firstName} ${registrationData.captain.lastName}`,
          captainEmail: registrationData.captain.email,
          playersCount: registrationData.players.length
        })
      })
      console.log('📧 Notification envoyée à l\'administrateur')
    } catch (notifError) {
      console.log('⚠️  Notification admin non envoyée (non critique)')
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
