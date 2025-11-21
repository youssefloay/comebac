#!/usr/bin/env node

/**
 * Script pour mettre à jour l'équipe Se7en avec les vrais emails et 3 nouveaux joueurs
 * 
 * Usage:
 *   npm run update-se7en-team
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
  console.log('🔄 Mise à jour de l\'équipe Se7en')
  console.log('=' .repeat(60))
  console.log()

  try {
    // Chercher l'inscription Se7en
    const registrationsSnap = await db.collection('teamRegistrations')
      .where('teamName', '==', 'Se7en')
      .where('status', '==', 'pending')
      .get()

    if (registrationsSnap.empty) {
      console.log('❌ Inscription Se7en non trouvée (status: pending)')
      rl.close()
      return
    }

    const doc = registrationsSnap.docs[0]
    console.log(`✅ Inscription trouvée: ${doc.id}`)
    console.log()

    // Nouveaux joueurs avec vrais emails
    const updatedPlayers = [
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
        email: 'ali.h.elazrak@gmail.com', // Vrai email
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
        email: 'karimsharawy48@gmail.com', // Vrai email
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
        email: 'Elmekkawyzeineldin@gmail.com', // Vrai email
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
        email: 'sergioarmani2009@gmail.com', // Vrai email
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
        email: 'yassinhelmy82@gmail.com', // Vrai email
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
        email: 'mustafa.osman.1837@ebis-cordia.net', // Vrai email
        phone: '0127603379',
        birthDate: '2008-08-27',
        age: calculateAge('2008-08-27'),
        height: 175,
        tshirtSize: 'M',
        position: 'Défenseur',
        foot: 'Droitier',
        jerseyNumber: 5,
        grade: 'Terminale'
      },
      // 3 NOUVEAUX JOUEURS
      {
        firstName: 'Ali',
        lastName: 'Karim',
        nickname: 'Koko',
        email: 'eliali@gmail.com',
        phone: '01003290865',
        birthDate: '2008-08-15',
        age: calculateAge('2008-08-15'),
        height: 175,
        tshirtSize: 'M',
        position: 'Défenseur',
        foot: 'Gaucher',
        jerseyNumber: 19,
        grade: 'Terminale'
      },
      {
        firstName: 'Tony',
        lastName: 'Ramy',
        nickname: 'Tony',
        email: 'Tonyshafik@icloud.com',
        phone: '01004399260',
        birthDate: '2008-06-18',
        age: calculateAge('2008-06-18'),
        height: 176,
        tshirtSize: 'M',
        position: 'Défenseur',
        foot: 'Droitier',
        jerseyNumber: 12,
        grade: 'Terminale'
      },
      {
        firstName: 'Hegazy',
        lastName: 'Akram',
        nickname: 'Akram Hegazy',
        email: 'akram.walaa.254@ebis-cordia.net',
        phone: '01288376603',
        birthDate: '2008-09-09',
        age: calculateAge('2008-09-09'),
        height: 185,
        tshirtSize: 'L',
        position: 'Défenseur',
        foot: 'Droitier',
        jerseyNumber: 8,
        grade: 'Terminale'
      }
    ]

    console.log('📝 Mise à jour avec:')
    console.log(`   - 7 joueurs existants avec vrais emails`)
    console.log(`   - 3 nouveaux joueurs`)
    console.log(`   - Total: ${updatedPlayers.length} joueurs`)
    console.log()

    const confirm = await question('Confirmer la mise à jour? (oui/non): ')
    if (confirm.toLowerCase() !== 'oui') {
      console.log('❌ Annulé')
      rl.close()
      return
    }

    // Mettre à jour l'inscription
    await db.collection('teamRegistrations').doc(doc.id).update({
      players: updatedPlayers,
      lastUpdatedAt: Timestamp.now(),
      lastUpdatedBy: 'admin-script',
      needsAdminValidation: false // Pas besoin de validation puisque c'est l'admin qui fait la mise à jour
    })

    console.log()
    console.log('✅ Équipe Se7en mise à jour avec succès!')
    console.log()
    console.log('👥 Joueurs mis à jour:')
    updatedPlayers.forEach((player, index) => {
      console.log(`  ${index + 1}. ${player.firstName} ${player.lastName} (${player.nickname})`)
      console.log(`     Email: ${player.email}`)
      console.log(`     N°${player.jerseyNumber} | ${player.position}`)
      console.log()
    })
    console.log('=' .repeat(60))
    console.log('✅ Mise à jour terminée!')
    console.log()
    console.log('📧 Prochaine étape:')
    console.log('   Approuve l\'inscription dans /admin/team-registrations')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
