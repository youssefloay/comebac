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

async function checkRisingVII() {
  console.log('🔍 Vérification complète de l\'équipe Rising VII...\n')
  
  const teamName = 'Rising VII'
  
  // 1. Trouver l'équipe
  const teamsSnap = await db.collection('teams')
    .where('name', '==', teamName)
    .get()
  
  if (teamsSnap.empty) {
    console.error('❌ Équipe Rising VII non trouvée')
    return
  }
  
  const teamDoc = teamsSnap.docs[0]
  const teamId = teamDoc.id
  const teamData = teamDoc.data()
  const teamPlayers = teamData.players || []
  
  console.log(`✅ Équipe trouvée: ${teamName} (ID: ${teamId})`)
  console.log(`📊 Nombre de joueurs dans teams.players: ${teamPlayers.length}\n`)
  
  // 2. Pour chaque joueur, vérifier toutes les collections
  const issues: any[] = []
  
  for (let i = 0; i < teamPlayers.length; i++) {
    const teamPlayer = teamPlayers[i]
    const email = teamPlayer.email
    const teamPlayerName = `${teamPlayer.firstName || ''} ${teamPlayer.lastName || ''}`.trim()
    
    console.log(`${'='.repeat(60)}`)
    console.log(`📋 Joueur ${i + 1}/${teamPlayers.length}: ${teamPlayerName}`)
    console.log(`   Email: ${email || '❌ MANQUANT'}`)
    console.log(`   Dans teams.players: ${teamPlayerName}`)
    console.log('')
    
    const playerIssues: string[] = []
    
    // Vérifier playerAccounts
    const playerAccountsSnap = await db.collection('playerAccounts')
      .where('email', '==', email)
      .get()
    
    if (playerAccountsSnap.empty) {
      playerIssues.push(`❌ MANQUANT dans playerAccounts`)
    } else {
      const paData = playerAccountsSnap.docs[0].data()
      const paName = `${paData.firstName || ''} ${paData.lastName || ''}`.trim()
      console.log(`   📝 playerAccounts: ${paName}`)
      
      if (paName !== teamPlayerName) {
        playerIssues.push(`⚠️  Nom différent: "${paName}" vs "${teamPlayerName}"`)
      }
      if (paData.teamId !== teamId && paData.teamName !== teamName) {
        playerIssues.push(`⚠️  teamId/teamName incorrect: teamId="${paData.teamId}", teamName="${paData.teamName}"`)
      }
    }
    
    // Vérifier accounts
    const accountsSnap = await db.collection('accounts')
      .where('email', '==', email)
      .get()
    
    if (accountsSnap.empty) {
      playerIssues.push(`❌ MANQUANT dans accounts`)
    } else {
      const accData = accountsSnap.docs[0].data()
      const accName = `${accData.firstName || ''} ${accData.lastName || ''}`.trim()
      console.log(`   📝 accounts: ${accName} (rôle: ${accData.role || 'N/A'})`)
      
      if (accName !== teamPlayerName) {
        playerIssues.push(`⚠️  Nom différent: "${accName}" vs "${teamPlayerName}"`)
      }
      if (accData.role !== 'player') {
        playerIssues.push(`⚠️  Rôle incorrect: "${accData.role}" au lieu de "player"`)
      }
    }
    
    // Vérifier players
    const playersSnap = await db.collection('players')
      .where('email', '==', email)
      .get()
    
    if (playersSnap.empty) {
      playerIssues.push(`❌ MANQUANT dans players`)
    } else {
      const plData = playersSnap.docs[0].data()
      const plName = `${plData.firstName || ''} ${plData.lastName || ''}`.trim()
      console.log(`   📝 players: ${plName}`)
      
      if (plName !== teamPlayerName) {
        playerIssues.push(`⚠️  Nom différent: "${plName}" vs "${teamPlayerName}"`)
      }
      if (plData.teamId !== teamId && plData.teamName !== teamName) {
        playerIssues.push(`⚠️  teamId/teamName incorrect`)
      }
    }
    
    // Vérifier userProfiles
    const userProfilesSnap = await db.collection('userProfiles')
      .where('email', '==', email)
      .get()
    
    if (!userProfilesSnap.empty) {
      const upData = userProfilesSnap.docs[0].data()
      const upName = upData.fullName || `${upData.firstName || ''} ${upData.lastName || ''}`.trim()
      console.log(`   📝 userProfiles: ${upName} (username: ${upData.username || 'N/A'}, rôle: ${upData.role || 'N/A'})`)
      
      if (upName !== teamPlayerName) {
        playerIssues.push(`⚠️  Nom différent: "${upName}" vs "${teamPlayerName}"`)
      }
      if (upData.role !== 'player') {
        playerIssues.push(`⚠️  Rôle incorrect: "${upData.role || 'N/A'}" au lieu de "player"`)
      }
    } else {
      console.log(`   📝 userProfiles: ❌ MANQUANT`)
      playerIssues.push(`❌ MANQUANT dans userProfiles`)
    }
    
    if (playerIssues.length > 0) {
      issues.push({
        player: teamPlayerName,
        email: email,
        issues: playerIssues
      })
      console.log(`\n   ⚠️  PROBLÈMES DÉTECTÉS:`)
      playerIssues.forEach(issue => console.log(`      ${issue}`))
    } else {
      console.log(`\n   ✅ Aucun problème détecté`)
    }
    
    console.log('')
  }
  
  // 3. Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ')
  console.log('='.repeat(60))
  console.log(`Total de joueurs: ${teamPlayers.length}`)
  console.log(`Joueurs avec problèmes: ${issues.length}`)
  console.log(`Joueurs OK: ${teamPlayers.length - issues.length}`)
  
  if (issues.length > 0) {
    console.log('\n⚠️  JOUEURS AVEC PROBLÈMES:')
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.player} (${issue.email})`)
      issue.issues.forEach(i => console.log(`   ${i}`))
    })
  }
  
  console.log('\n' + '='.repeat(60))
}

checkRisingVII()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

