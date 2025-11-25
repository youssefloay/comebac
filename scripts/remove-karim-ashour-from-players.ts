/**
 * Script pour supprimer Karim Ashour (kikoashour@gmail.com) des collections de joueurs
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

async function removeKarimAshourFromPlayers() {
  console.log('🗑️  Suppression de Karim Ashour des collections de joueurs')
  console.log(`   Email: ${EMAIL}`)
  console.log('='.repeat(60))
  console.log()

  try {
    let removed = 0

    // 1. Supprimer de playerAccounts
    console.log('1️⃣ Suppression de playerAccounts...')
    const playerAccountsSnap = await adminDb.collection('playerAccounts')
      .where('email', '==', EMAIL)
      .get()
    
    if (!playerAccountsSnap.empty) {
      for (const doc of playerAccountsSnap.docs) {
        const data = doc.data()
        await doc.ref.delete()
        console.log(`   ✅ Supprimé: ${data.firstName} ${data.lastName} (ID: ${doc.id})`)
        removed++
      }
    } else {
      console.log('   ℹ️  Aucun compte trouvé dans playerAccounts')
    }
    console.log()

    // 2. Supprimer de la collection players
    console.log('2️⃣ Suppression de players...')
    const playersSnap = await adminDb.collection('players')
      .where('email', '==', EMAIL)
      .get()
    
    if (!playersSnap.empty) {
      for (const doc of playersSnap.docs) {
        const data = doc.data()
        await doc.ref.delete()
        console.log(`   ✅ Supprimé: ${data.name || `${data.firstName} ${data.lastName}`} (ID: ${doc.id})`)
        removed++
      }
    } else {
      console.log('   ℹ️  Aucun joueur trouvé dans players')
    }
    console.log()

    // 3. Retirer de teams.players
    console.log('3️⃣ Retrait de teams.players...')
    const teamsSnap = await adminDb.collection('teams').get()
    let removedFromTeams = 0
    
    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      if (teamData.players && Array.isArray(teamData.players)) {
        const originalLength = teamData.players.length
        const updatedPlayers = teamData.players.filter((p: any) => 
          p.email?.toLowerCase() !== EMAIL.toLowerCase()
        )
        
        if (updatedPlayers.length < originalLength) {
          await teamDoc.ref.update({ players: updatedPlayers })
          console.log(`   ✅ Retiré de l'équipe: ${teamData.name} (ID: ${teamDoc.id})`)
          removedFromTeams++
        }
      }
    }
    
    if (removedFromTeams === 0) {
      console.log('   ℹ️  Non trouvé dans teams.players')
    }
    console.log()

    // Résumé
    console.log('='.repeat(60))
    console.log('📊 RÉSUMÉ:')
    console.log(`   ✅ ${removed} document(s) supprimé(s) des collections`)
    console.log(`   ✅ Retiré de ${removedFromTeams} équipe(s)`)
    console.log()
    console.log('✅ Karim Ashour a été retiré des collections de joueurs')
    console.log('   Il reste uniquement dans coachAccounts (s\'il y est)')

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

removeKarimAshourFromPlayers().catch(console.error)

