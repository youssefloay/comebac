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

async function fixAllTeamsTeamName() {
  console.log('🔧 Vérification et correction de tous les teamName pour toutes les équipes...\n')
  
  // 1. Récupérer toutes les équipes
  console.log('📋 1. Récupération de toutes les équipes...')
  const teamsSnap = await db.collection('teams').get()
  console.log(`✅ ${teamsSnap.size} équipe(s) trouvée(s)\n`)
  
  let totalPlayersChecked = 0
  let totalPlayersFixed = 0
  const issues: Array<{teamName: string, playerName: string, issue: string}> = []
  
  // 2. Pour chaque équipe, vérifier tous les joueurs
  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data()
    const teamId = teamDoc.id
    const teamName = teamData.name
    
    if (!teamName) {
      console.log(`⚠️  Équipe ${teamId} sans nom, ignorée\n`)
      continue
    }
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📋 Équipe: "${teamName}" (ID: ${teamId})`)
    console.log(`${'='.repeat(60)}`)
    
    // Récupérer tous les joueurs de cette équipe dans playerAccounts
    const playersSnap = await db.collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()
    
    console.log(`   📊 ${playersSnap.size} joueur(s) trouvé(s) dans playerAccounts\n`)
    
    if (playersSnap.empty) {
      console.log(`   ⚠️  Aucun joueur trouvé pour cette équipe\n`)
      continue
    }
    
    // Vérifier chaque joueur
    for (const playerDoc of playersSnap.docs) {
      totalPlayersChecked++
      const playerData = playerDoc.data()
      const playerName = `${playerData.firstName || ''} ${playerData.lastName || ''}`.trim()
      const currentTeamName = playerData.teamName
      const currentTeamId = playerData.teamId
      
      // Vérifier si le teamName est manquant ou incorrect
      if (!currentTeamName || currentTeamName !== teamName) {
        console.log(`   📝 ${playerName} (${playerData.email || 'N/A'})`)
        console.log(`      - teamName actuel: ${currentTeamName || '❌ MANQUANT'}`)
        console.log(`      - teamId actuel: ${currentTeamId || '❌ MANQUANT'}`)
        
        // Vérifier aussi si le teamId est correct
        if (currentTeamId !== teamId) {
          console.log(`      ⚠️  teamId incorrect aussi!`)
          issues.push({
            teamName,
            playerName,
            issue: `teamId incorrect: ${currentTeamId} au lieu de ${teamId}`
          })
        }
        
        // Mettre à jour
        try {
          await playerDoc.ref.update({
            teamName: teamName,
            teamId: teamId
          })
          
          console.log(`      ✅ Mis à jour: teamName="${teamName}", teamId="${teamId}"`)
          totalPlayersFixed++
        } catch (error: any) {
          console.log(`      ❌ Erreur lors de la mise à jour: ${error.message}`)
          issues.push({
            teamName,
            playerName,
            issue: `Erreur de mise à jour: ${error.message}`
          })
        }
        console.log('')
      }
    }
    
    // Afficher un résumé pour cette équipe
    const playersWithIssues = playersSnap.docs.filter(doc => {
      const data = doc.data()
      return !data.teamName || data.teamName !== teamName || data.teamId !== teamId
    })
    
    if (playersWithIssues.length === 0) {
      console.log(`   ✅ Tous les joueurs sont à jour pour cette équipe\n`)
    }
  }
  
  // 3. Résumé final
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ FINAL')
  console.log(`${'='.repeat(60)}`)
  console.log(`   - Équipes vérifiées: ${teamsSnap.size}`)
  console.log(`   - Joueurs vérifiés: ${totalPlayersChecked}`)
  console.log(`   - Joueurs corrigés: ${totalPlayersFixed}`)
  
  if (issues.length > 0) {
    console.log(`\n   ⚠️  ${issues.length} problème(s) non résolu(s):`)
    issues.forEach((issue, index) => {
      console.log(`      ${index + 1}. ${issue.playerName} (${issue.teamName}): ${issue.issue}`)
    })
  } else {
    console.log(`\n   ✅ Aucun problème restant!`)
  }
  
  // 4. Vérifier aussi les joueurs sans équipe
  console.log(`\n${'='.repeat(60)}`)
  console.log('📋 Joueurs sans équipe (teamId manquant ou null)')
  console.log(`${'='.repeat(60)}`)
  const playersWithoutTeamSnap = await db.collection('playerAccounts')
    .where('teamId', '==', null)
    .get()
  
  if (playersWithoutTeamSnap.empty) {
    // Essayer avec une autre méthode pour trouver les joueurs sans teamId
    const allPlayersSnap = await db.collection('playerAccounts').get()
    const playersWithoutTeam = allPlayersSnap.docs.filter(doc => {
      const data = doc.data()
      return !data.teamId
    })
    
    if (playersWithoutTeam.length > 0) {
      console.log(`   ⚠️  ${playersWithoutTeam.length} joueur(s) sans teamId:`)
      playersWithoutTeam.forEach((doc, index) => {
        const data = doc.data()
        console.log(`      ${index + 1}. ${data.firstName} ${data.lastName} (${data.email || 'N/A'})`)
      })
    } else {
      console.log(`   ✅ Aucun joueur sans équipe trouvé`)
    }
  } else {
    console.log(`   ⚠️  ${playersWithoutTeamSnap.size} joueur(s) sans teamId:`)
    playersWithoutTeamSnap.docs.forEach((doc, index) => {
      const data = doc.data()
      console.log(`      ${index + 1}. ${data.firstName} ${data.lastName} (${data.email || 'N/A'})`)
    })
  }
  
  console.log(`\n✅ Vérification terminée`)
}

fixAllTeamsTeamName()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

