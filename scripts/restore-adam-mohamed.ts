import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

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

async function restoreAdamMohamed() {
  console.log('🔧 Restauration de Adam Mohamed...\n')
  
  const email = 'gendy051@gmail.com'
  const correctFirstName = 'Adam'
  const correctLastName = 'Mohamed'
  const correctUsername = 'adam' // Le username original était "adam"
  
  // Lire la sauvegarde pour récupérer toutes les données
  const backupPath = path.join(process.cwd(), 'backups/2025-11-26T22-35-30-474Z')
  
  let backupPlayerAccount: any = null
  let backupUserProfile: any = null
  
  try {
    const playerAccountsData = JSON.parse(fs.readFileSync(path.join(backupPath, 'playerAccounts.json'), 'utf-8'))
    backupPlayerAccount = playerAccountsData.find((p: any) => p.email === email)
    
    const userProfilesData = JSON.parse(fs.readFileSync(path.join(backupPath, 'userProfiles.json'), 'utf-8'))
    backupUserProfile = userProfilesData.find((p: any) => p.email === email)
  } catch (error) {
    console.error('❌ Erreur lors de la lecture de la sauvegarde:', error)
  }
  
  // 1. Restaurer playerAccounts
  console.log('📋 1. Restauration de playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (!playerAccountsSnap.empty) {
    for (const doc of playerAccountsSnap.docs) {
      const data = doc.data()
      console.log(`   📝 PlayerAccount trouvé (ID: ${doc.id}):`)
      console.log(`      Avant: ${data.firstName} ${data.lastName}`)
      
      const updateData: any = {
        firstName: correctFirstName,
        lastName: correctLastName,
        updatedAt: new Date()
      }
      
      // Restaurer les autres données de la sauvegarde si disponibles
      if (backupPlayerAccount) {
        if (backupPlayerAccount.nickname) updateData.nickname = backupPlayerAccount.nickname
        if (backupPlayerAccount.phone) updateData.phone = backupPlayerAccount.phone
        if (backupPlayerAccount.position) updateData.position = backupPlayerAccount.position
        if (backupPlayerAccount.jerseyNumber !== undefined) updateData.jerseyNumber = backupPlayerAccount.jerseyNumber
        if (backupPlayerAccount.teamId) updateData.teamId = backupPlayerAccount.teamId
        if (backupPlayerAccount.birthDate) updateData.birthDate = backupPlayerAccount.birthDate
        if (backupPlayerAccount.height) updateData.height = backupPlayerAccount.height
        if (backupPlayerAccount.tshirtSize) updateData.tshirtSize = backupPlayerAccount.tshirtSize
      }
      
      await doc.ref.update(updateData)
      console.log(`      ✅ Restauré: ${correctFirstName} ${correctLastName}`)
      console.log('')
    }
  } else {
    console.log('   ❌ Aucun playerAccount trouvé\n')
  }
  
  // 2. Restaurer userProfiles
  console.log('📋 2. Restauration de userProfiles...')
  const userProfilesSnap = await db.collection('userProfiles')
    .where('email', '==', email)
    .get()
  
  if (!userProfilesSnap.empty) {
    for (const doc of userProfilesSnap.docs) {
      const data = doc.data()
      console.log(`   📝 UserProfile trouvé (ID: ${doc.id}):`)
      console.log(`      Avant: FullName="${data.fullName}", Username="${data.username}"`)
      
      const updateData: any = {
        firstName: correctFirstName,
        lastName: correctLastName,
        fullName: `${correctFirstName} ${correctLastName}`,
        username: correctUsername,
        role: 'player',
        updatedAt: new Date()
      }
      
      // Restaurer les autres données de la sauvegarde si disponibles
      if (backupUserProfile) {
        if (backupUserProfile.phone) updateData.phone = backupUserProfile.phone
      }
      
      await doc.ref.update(updateData)
      console.log(`      ✅ Restauré: FullName="${correctFirstName} ${correctLastName}", Username="${correctUsername}"`)
      console.log('')
    }
  } else {
    console.log('   ❌ Aucun userProfile trouvé\n')
  }
  
  // 3. Restaurer accounts
  console.log('📋 3. Restauration de accounts...')
  const accountsSnap = await db.collection('accounts')
    .where('email', '==', email)
    .get()
  
  if (!accountsSnap.empty) {
    for (const doc of accountsSnap.docs) {
      const data = doc.data()
      console.log(`   📝 Account trouvé (ID: ${doc.id}):`)
      console.log(`      Avant: ${data.firstName} ${data.lastName}`)
      
      await doc.ref.update({
        firstName: correctFirstName,
        lastName: correctLastName,
        role: 'player',
        updatedAt: new Date()
      })
      
      console.log(`      ✅ Restauré: ${correctFirstName} ${correctLastName}`)
      console.log('')
    }
  } else {
    console.log('   ❌ Aucun account trouvé\n')
  }
  
  // 4. Restaurer players
  console.log('📋 4. Restauration de players...')
  const playersSnap = await db.collection('players')
    .where('email', '==', email)
    .get()
  
  if (!playersSnap.empty) {
    for (const doc of playersSnap.docs) {
      const data = doc.data()
      console.log(`   📝 Player trouvé (ID: ${doc.id}):`)
      console.log(`      Avant: ${data.firstName} ${data.lastName}`)
      
      await doc.ref.update({
        firstName: correctFirstName,
        lastName: correctLastName,
        updatedAt: new Date()
      })
      
      console.log(`      ✅ Restauré: ${correctFirstName} ${correctLastName}`)
      console.log('')
    }
  } else {
    console.log('   ❌ Aucun player trouvé\n')
  }
  
  // 5. Restaurer teams.players
  console.log('📋 5. Restauration de teams.players...')
  const teamsSnap = await db.collection('teams').get()
  let updatedTeams = 0
  
  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data()
    const players = teamData.players || []
    let needsUpdate = false
    const updatedPlayers = players.map((player: any) => {
      if (player.email === email) {
        if (player.firstName !== correctFirstName || player.lastName !== correctLastName) {
          needsUpdate = true
          return {
            ...player,
            firstName: correctFirstName,
            lastName: correctLastName
          }
        }
      }
      return player
    })
    
    if (needsUpdate) {
      await teamDoc.ref.update({
        players: updatedPlayers,
        updatedAt: new Date()
      })
      updatedTeams++
      console.log(`   ✅ Équipe "${teamData.name}" mise à jour`)
    }
  }
  
  if (updatedTeams === 0) {
    console.log('   ℹ️  Aucune équipe à mettre à jour')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Restauration terminée!')
  console.log(`   Adam Mohamed est maintenant restauré partout`)
  console.log(`   - Nom: ${correctFirstName} ${correctLastName}`)
  console.log(`   - Username: ${correctUsername}`)
  console.log(`   - Rôle: player`)
  console.log('\n' + '='.repeat(60))
}

restoreAdamMohamed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

