#!/usr/bin/env node

/**
 * Script pour lister toutes les équipes enregistrées
 * 
 * Usage:
 *   npx tsx scripts/list-teams.ts
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

const db = getFirestore()

async function main() {
  console.log('📋 Récupération de toutes les équipes...\n')
  
  try {
    const teamsSnapshot = await db.collection('teams').get()
    
    if (teamsSnapshot.empty) {
      console.log('❌ Aucune équipe trouvée.')
      return
    }
    
    console.log(`✅ ${teamsSnapshot.size} équipe(s) trouvée(s):\n`)
    console.log('=' .repeat(80))
    
    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Trier par nom
    teams.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    
    teams.forEach((team, index) => {
      console.log(`\n${index + 1}. ${team.name || '(Sans nom)'}`)
      console.log(`   ID: ${team.id}`)
      if (team.schoolName || team.school) {
        console.log(`   École: ${team.schoolName || team.school}`)
      }
      if (team.teamGrade) {
        console.log(`   Classe: ${team.teamGrade}`)
      }
      if (team.coach && team.coach.firstName && team.coach.lastName) {
        console.log(`   Coach: ${team.coach.firstName} ${team.coach.lastName}`)
      } else {
        console.log(`   Coach: (Non défini)`)
      }
      if (team.color) {
        console.log(`   Couleur: ${team.color}`)
      }
    })
    
    console.log('\n' + '='.repeat(80))
    console.log(`\nTotal: ${teams.length} équipe(s)`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des équipes:', error)
    process.exit(1)
  }
}

main()
  .then(() => {
    console.log('\n✅ Terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

