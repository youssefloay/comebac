/**
 * Script pour mettre à jour le nickname d'Ali Karim de "Kokobos" à "Koko" partout
 * Usage: npx tsx scripts/update-ali-karim-nickname.ts
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

async function updateAliKarimNickname() {
  const playerEmail = 'eliali@gmail.com'
  const oldNickname = 'Kokobos'
  const newNickname = 'Koko'

  console.log(`🔄 Mise à jour du nickname d'Ali Karim`)
  console.log(`   Email: ${playerEmail}`)
  console.log(`   Ancien: "${oldNickname}"`)
  console.log(`   Nouveau: "${newNickname}"`)
  console.log('')

  try {
    let totalUpdated = 0

    // 1. Mettre à jour dans playerAccounts
    console.log('1️⃣ Mise à jour dans playerAccounts...')
    const accountsSnap = await adminDb.collection('playerAccounts')
      .where('email', '==', playerEmail)
      .get()
    
    if (!accountsSnap.empty) {
      for (const doc of accountsSnap.docs) {
        const data = doc.data()
        const currentNickname = data.nickname || ''
        // Mettre à jour si le nickname actuel correspond à l'ancien (insensible à la casse) ou s'il est différent du nouveau
        if (currentNickname.toLowerCase() === oldNickname.toLowerCase() || currentNickname !== newNickname) {
          await doc.ref.update({ nickname: newNickname })
          console.log(`   ✅ Compte joueur mis à jour: ${data.firstName} ${data.lastName}`)
          console.log(`      Ancien: "${currentNickname}" → Nouveau: "${newNickname}"`)
          totalUpdated++
        } else {
          console.log(`   ℹ️  Nickname déjà à jour: "${currentNickname}"`)
        }
      }
    } else {
      console.log('   ⚠️ Aucun compte joueur trouvé')
    }

    // 2. Mettre à jour dans players
    console.log('\n2️⃣ Mise à jour dans players...')
    const playersSnap = await adminDb.collection('players')
      .where('email', '==', playerEmail)
      .get()
    
    if (!playersSnap.empty) {
      for (const doc of playersSnap.docs) {
        const data = doc.data()
        const currentNickname = data.nickname || ''
        if (currentNickname.toLowerCase() === oldNickname.toLowerCase() || currentNickname !== newNickname) {
          await doc.ref.update({ nickname: newNickname })
          console.log(`   ✅ Joueur mis à jour: ${data.name}`)
          console.log(`      Ancien: "${currentNickname}" → Nouveau: "${newNickname}"`)
          totalUpdated++
        } else {
          console.log(`   ℹ️  Nickname déjà à jour: "${currentNickname || 'N/A'}"`)
        }
      }
    } else {
      console.log('   ⚠️ Aucun joueur trouvé')
    }

    // 3. Mettre à jour dans teamRegistrations
    console.log('\n3️⃣ Mise à jour dans teamRegistrations...')
    const registrationsSnap = await adminDb.collection('teamRegistrations').get()
    
    let registrationsUpdated = 0
    for (const doc of registrationsSnap.docs) {
      const data = doc.data()
      let updated = false
      
      // Vérifier les joueurs
      if (data.players && Array.isArray(data.players)) {
        const players = data.players.map((player: any) => {
          if (player.email === playerEmail) {
            const currentNickname = player.nickname || ''
            if (currentNickname.toLowerCase() === oldNickname.toLowerCase() || currentNickname !== newNickname) {
              updated = true
              console.log(`      Ancien: "${currentNickname}" → Nouveau: "${newNickname}"`)
              return { ...player, nickname: newNickname }
            }
          }
          return player
        })
        
        if (updated) {
          await doc.ref.update({ players })
          console.log(`   ✅ Inscription mise à jour: ${data.teamName}`)
          registrationsUpdated++
          totalUpdated++
        }
      }
    }
    
    if (registrationsUpdated === 0) {
      console.log('   ℹ️  Aucune inscription à mettre à jour')
    }

    // 4. Mettre à jour dans teams
    console.log('\n4️⃣ Mise à jour dans teams...')
    const teamsSnap = await adminDb.collection('teams').get()
    
    let teamsUpdated = 0
    for (const doc of teamsSnap.docs) {
      const data = doc.data()
      let updated = false
      
      // Vérifier les joueurs dans l'équipe
      if (data.players && Array.isArray(data.players)) {
        const players = data.players.map((player: any) => {
          if (player.email === playerEmail) {
            const currentNickname = player.nickname || ''
            if (currentNickname.toLowerCase() === oldNickname.toLowerCase() || currentNickname !== newNickname) {
              updated = true
              console.log(`      Ancien: "${currentNickname}" → Nouveau: "${newNickname}"`)
              return { ...player, nickname: newNickname }
            }
          }
          return player
        })
        
        if (updated) {
          await doc.ref.update({ players })
          console.log(`   ✅ Équipe mise à jour: ${data.name}`)
          teamsUpdated++
          totalUpdated++
        }
      }
    }
    
    if (teamsUpdated === 0) {
      console.log('   ℹ️  Aucune équipe à mettre à jour')
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ TERMINÉ! ${totalUpdated} document(s) mis à jour`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  }
}

updateAliKarimNickname().catch(console.error)

