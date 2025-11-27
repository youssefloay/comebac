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

interface FixStats {
  accountsFixed: number
  playerAccountsFixed: number
  coachAccountsFixed: number
  playersFixed: number
  teamsFixed: number
  teamRegistrationsFixed: number
  errors: string[]
}

const stats: FixStats = {
  accountsFixed: 0,
  playerAccountsFixed: 0,
  coachAccountsFixed: 0,
  playersFixed: 0,
  teamsFixed: 0,
  teamRegistrationsFixed: 0,
  errors: []
}

/**
 * Corriger les emails @gmaill.com en @gmail.com dans toutes les collections
 */
async function fixGmaillEmails() {
  console.log('🔧 Correction des emails @gmaill.com → @gmail.com...\n')
  
  // 1. Corriger accounts
  console.log('📋 1. Correction dans accounts...')
  const accountsSnap = await db.collection('accounts').get()
  
  for (const accountDoc of accountsSnap.docs) {
    const accountData = accountDoc.data()
    const email = accountData.email
    
    if (email && email.includes('@gmaill.com')) {
      const newEmail = email.replace('@gmaill.com', '@gmail.com')
      
      try {
        await accountDoc.ref.update({
          email: newEmail,
          updatedAt: new Date()
        })
        stats.accountsFixed++
        console.log(`   ✅ ${email} → ${newEmail}`)
      } catch (error: any) {
        stats.errors.push(`Erreur account ${email}: ${error.message}`)
      }
    }
  }
  
  // 2. Corriger playerAccounts
  console.log('\n📋 2. Correction dans playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts').get()
  
  for (const playerDoc of playerAccountsSnap.docs) {
    const playerData = playerDoc.data()
    const email = playerData.email
    
    if (email && email.includes('@gmaill.com')) {
      const newEmail = email.replace('@gmaill.com', '@gmail.com')
      
      try {
        await playerDoc.ref.update({
          email: newEmail,
          updatedAt: new Date()
        })
        stats.playerAccountsFixed++
        console.log(`   ✅ ${email} → ${newEmail}`)
      } catch (error: any) {
        stats.errors.push(`Erreur playerAccount ${email}: ${error.message}`)
      }
    }
  }
  
  // 3. Corriger coachAccounts
  console.log('\n📋 3. Correction dans coachAccounts...')
  const coachAccountsSnap = await db.collection('coachAccounts').get()
  
  for (const coachDoc of coachAccountsSnap.docs) {
    const coachData = coachDoc.data()
    const email = coachData.email
    
    if (email && email.includes('@gmaill.com')) {
      const newEmail = email.replace('@gmaill.com', '@gmail.com')
      
      try {
        await coachDoc.ref.update({
          email: newEmail,
          updatedAt: new Date()
        })
        stats.coachAccountsFixed++
        console.log(`   ✅ ${email} → ${newEmail}`)
      } catch (error: any) {
        stats.errors.push(`Erreur coachAccount ${email}: ${error.message}`)
      }
    }
  }
  
  // 4. Corriger players
  console.log('\n📋 4. Correction dans players...')
  const playersSnap = await db.collection('players').get()
  
  for (const playerDoc of playersSnap.docs) {
    const playerData = playerDoc.data()
    const email = playerData.email
    
    if (email && email.includes('@gmaill.com')) {
      const newEmail = email.replace('@gmaill.com', '@gmail.com')
      
      try {
        await playerDoc.ref.update({
          email: newEmail,
          updatedAt: new Date()
        })
        stats.playersFixed++
        console.log(`   ✅ ${email} → ${newEmail}`)
      } catch (error: any) {
        stats.errors.push(`Erreur player ${email}: ${error.message}`)
      }
    }
  }
  
  // 5. Corriger teams (dans coach.email et players[].email)
  console.log('\n📋 5. Correction dans teams...')
  const teamsSnap = await db.collection('teams').get()
  
  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data()
    let needsUpdate = false
    const updates: any = {}
    
    // Corriger coach.email
    if (teamData.coach?.email && teamData.coach.email.includes('@gmaill.com')) {
      updates['coach.email'] = teamData.coach.email.replace('@gmaill.com', '@gmail.com')
      needsUpdate = true
    }
    
    // Corriger players[].email
    if (teamData.players && Array.isArray(teamData.players)) {
      const updatedPlayers = teamData.players.map((player: any) => {
        if (player.email && player.email.includes('@gmaill.com')) {
          needsUpdate = true
          return {
            ...player,
            email: player.email.replace('@gmaill.com', '@gmail.com')
          }
        }
        return player
      })
      
      if (needsUpdate && updatedPlayers.some((p: any, i: number) => 
        p.email !== teamData.players[i]?.email
      )) {
        updates.players = updatedPlayers
      }
    }
    
    if (needsUpdate) {
      try {
        updates.updatedAt = new Date()
        await teamDoc.ref.update(updates)
        stats.teamsFixed++
        console.log(`   ✅ Équipe ${teamData.name || teamDoc.id} corrigée`)
      } catch (error: any) {
        stats.errors.push(`Erreur team ${teamDoc.id}: ${error.message}`)
      }
    }
  }
  
  // 6. Corriger teamRegistrations (dans captain, coach.email et players[].email)
  console.log('\n📋 6. Correction dans teamRegistrations...')
  const registrationsSnap = await db.collection('teamRegistrations').get()
  
  for (const regDoc of registrationsSnap.docs) {
    const regData = regDoc.data()
    let needsUpdate = false
    const updates: any = {}
    
    // Corriger captain
    if (regData.captain && regData.captain.email && regData.captain.email.includes('@gmaill.com')) {
      updates['captain.email'] = regData.captain.email.replace('@gmaill.com', '@gmail.com')
      needsUpdate = true
    }
    
    // Corriger coach.email
    if (regData.coach?.email && regData.coach.email.includes('@gmaill.com')) {
      updates['coach.email'] = regData.coach.email.replace('@gmaill.com', '@gmail.com')
      needsUpdate = true
    }
    
    // Corriger players[].email
    if (regData.players && Array.isArray(regData.players)) {
      const updatedPlayers = regData.players.map((player: any) => {
        if (player.email && player.email.includes('@gmaill.com')) {
          needsUpdate = true
          return {
            ...player,
            email: player.email.replace('@gmaill.com', '@gmail.com')
          }
        }
        return player
      })
      
      if (needsUpdate && updatedPlayers.some((p: any, i: number) => 
        p.email !== regData.players[i]?.email
      )) {
        updates.players = updatedPlayers
      }
    }
    
    if (needsUpdate) {
      try {
        updates.updatedAt = new Date()
        await regDoc.ref.update(updates)
        stats.teamRegistrationsFixed++
        console.log(`   ✅ Inscription ${regData.teamName || regDoc.id} corrigée`)
      } catch (error: any) {
        stats.errors.push(`Erreur registration ${regDoc.id}: ${error.message}`)
      }
    }
  }
  
  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ DE LA CORRECTION\n')
  console.log(`✅ Accounts corrigés: ${stats.accountsFixed}`)
  console.log(`✅ PlayerAccounts corrigés: ${stats.playerAccountsFixed}`)
  console.log(`✅ CoachAccounts corrigés: ${stats.coachAccountsFixed}`)
  console.log(`✅ Players corrigés: ${stats.playersFixed}`)
  console.log(`✅ Teams corrigés: ${stats.teamsFixed}`)
  console.log(`✅ TeamRegistrations corrigés: ${stats.teamRegistrationsFixed}`)
  
  const totalFixed = stats.accountsFixed + stats.playerAccountsFixed + 
                     stats.coachAccountsFixed + stats.playersFixed + 
                     stats.teamsFixed + stats.teamRegistrationsFixed
  
  console.log(`\n📊 Total: ${totalFixed} corrections effectuées`)
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ Erreurs: ${stats.errors.length}`)
    stats.errors.slice(0, 10).forEach(e => console.log(`   - ${e}`))
  } else {
    console.log('\n✅ Aucune erreur!')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Correction terminée!')
}

// Exécuter la correction
if (require.main === module) {
  console.log('⚠️  Ce script va corriger tous les emails @gmaill.com en @gmail.com')
  console.log('   dans toutes les collections de la base de données.\n')
  console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...\n')
  
  setTimeout(() => {
    fixGmaillEmails()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Erreur:', error)
        process.exit(1)
      })
  }, 5000)
}

export { fixGmaillEmails }

