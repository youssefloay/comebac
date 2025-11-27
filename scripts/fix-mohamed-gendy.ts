import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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

async function fixMohamedGendy() {
  console.log('🔧 Correction de Mohamed Gendy...\n')
  
  const email = 'gendy051@gmail.com'
  const correctFirstName = 'Mohamed'
  const correctLastName = 'Gendy'
  const correctUsername = 'mohamedgendy' // ou 'gendy' si préféré
  
  // 1. Corriger userProfiles
  console.log('📋 1. Correction de userProfiles...')
  const profilesSnap = await db.collection('userProfiles')
    .where('email', '==', email)
    .get()
  
  if (!profilesSnap.empty) {
    for (const doc of profilesSnap.docs) {
      const data = doc.data()
      console.log(`   📝 Profile trouvé (ID: ${doc.id}):`)
      console.log(`      Avant: FullName="${data.fullName}", Username="${data.username}", Rôle="${data.role || 'N/A'}"`)
      
      await doc.ref.update({
        firstName: correctFirstName,
        lastName: correctLastName,
        fullName: `${correctFirstName} ${correctLastName}`,
        username: correctUsername,
        role: 'player',
        updatedAt: new Date()
      })
      
      console.log(`      ✅ Mis à jour: FullName="${correctFirstName} ${correctLastName}", Username="${correctUsername}", Rôle="player"`)
      console.log('')
    }
  } else {
    console.log('   ❌ Aucun profile trouvé')
  }
  
  // 2. Corriger playerAccounts
  console.log('📋 2. Correction de playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (!playerAccountsSnap.empty) {
    for (const doc of playerAccountsSnap.docs) {
      const data = doc.data()
      console.log(`   📝 PlayerAccount trouvé (ID: ${doc.id}):`)
      console.log(`      Avant: Nom="${data.firstName} ${data.lastName}"`)
      
      await doc.ref.update({
        firstName: correctFirstName,
        lastName: correctLastName,
        updatedAt: new Date()
      })
      
      console.log(`      ✅ Mis à jour: Nom="${correctFirstName} ${correctLastName}"`)
      console.log('')
    }
  } else {
    console.log('   ❌ Aucun playerAccount trouvé')
  }
  
  // 3. Corriger accounts
  console.log('📋 3. Correction de accounts...')
  const accountsSnap = await db.collection('accounts')
    .where('email', '==', email)
    .get()
  
  if (!accountsSnap.empty) {
    for (const doc of accountsSnap.docs) {
      const data = doc.data()
      console.log(`   📝 Account trouvé (ID: ${doc.id}):`)
      console.log(`      Avant: Nom="${data.firstName} ${data.lastName}", Rôle="${data.role || 'N/A'}"`)
      
      await doc.ref.update({
        firstName: correctFirstName,
        lastName: correctLastName,
        role: 'player',
        updatedAt: new Date()
      })
      
      console.log(`      ✅ Mis à jour: Nom="${correctFirstName} ${correctLastName}", Rôle="player"`)
      console.log('')
    }
  } else {
    console.log('   ❌ Aucun account trouvé')
  }
  
  // 4. Vérifier players
  console.log('📋 4. Vérification de players...')
  const playersSnap = await db.collection('players')
    .where('email', '==', email)
    .get()
  
  if (!playersSnap.empty) {
    for (const doc of playersSnap.docs) {
      const data = doc.data()
      console.log(`   📝 Player trouvé (ID: ${doc.id}):`)
      console.log(`      Avant: Nom="${data.firstName} ${data.lastName}"`)
      
      await doc.ref.update({
        firstName: correctFirstName,
        lastName: correctLastName,
        updatedAt: new Date()
      })
      
      console.log(`      ✅ Mis à jour: Nom="${correctFirstName} ${correctLastName}"`)
      console.log('')
    }
  } else {
    console.log('   ℹ️  Aucun player trouvé (peut être normal)')
  }
  
  // 5. Vérifier teams.players
  console.log('📋 5. Vérification de teams.players...')
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
  console.log('✅ Correction terminée!')
  console.log(`   Mohamed Gendy est maintenant correctement configuré partout`)
  console.log(`   - Nom: ${correctFirstName} ${correctLastName}`)
  console.log(`   - Username: ${correctUsername}`)
  console.log(`   - Rôle: player`)
  console.log('\n' + '='.repeat(60))
}

fixMohamedGendy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

