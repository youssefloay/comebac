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

async function analyzeOptimizations() {
  console.log('🔍 Analyse approfondie de la base de données...\n')
  
  const issues: string[] = []
  const recommendations: string[] = []
  const stats: any = {}
  
  // 1. Analyser les données orphelines
  console.log('📋 1. Analyse des données orphelines...\n')
  
  // Joueurs sans équipe dans playerAccounts
  const playerAccountsSnap = await db.collection('playerAccounts').get()
  let playersWithoutTeam = 0
  let playersWithInvalidTeam = 0
  
  playerAccountsSnap.forEach(doc => {
    const data = doc.data()
    if (!data.teamId || !data.teamName) {
      playersWithoutTeam++
    } else {
      // Vérifier si l'équipe existe
      // (on ne peut pas le faire directement ici, mais on peut le noter)
    }
  })
  
  if (playersWithoutTeam > 0) {
    issues.push(`${playersWithoutTeam} joueurs dans playerAccounts sans équipe (teamId/teamName manquant)`)
    recommendations.push('Nettoyer les joueurs sans équipe ou les assigner à une équipe')
  }
  
  console.log(`   - Joueurs sans équipe: ${playersWithoutTeam}`)
  
  // Joueurs dans players sans équipe
  const playersSnap = await db.collection('players').get()
  let playersWithoutTeamInPlayers = 0
  
  playersSnap.forEach(doc => {
    const data = doc.data()
    if (!data.teamId) {
      playersWithoutTeamInPlayers++
    }
  })
  
  if (playersWithoutTeamInPlayers > 0) {
    issues.push(`${playersWithoutTeamInPlayers} joueurs dans players sans teamId`)
  }
  
  console.log(`   - Joueurs dans players sans équipe: ${playersWithoutTeamInPlayers}`)
  
  // Équipes sans joueurs
  const teamsSnap = await db.collection('teams').get()
  let teamsWithoutPlayers = 0
  
  teamsSnap.forEach(doc => {
    const data = doc.data()
    if (!data.players || data.players.length === 0) {
      teamsWithoutPlayers++
    }
  })
  
  if (teamsWithoutPlayers > 0) {
    issues.push(`${teamsWithoutPlayers} équipes sans joueurs`)
  }
  
  console.log(`   - Équipes sans joueurs: ${teamsWithoutPlayers}\n`)
  
  // 2. Analyser les incohérences de données
  console.log('📋 2. Analyse des incohérences de données...\n')
  
  let inconsistentEmails = 0
  let inconsistentNames = 0
  let missingRequiredFields = 0
  
  // Comparer playerAccounts et players
  const playerAccountsMap = new Map<string, any>()
  playerAccountsSnap.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (email) {
      playerAccountsMap.set(email, data)
    }
  })
  
  playersSnap.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (email && playerAccountsMap.has(email)) {
      const accountData = playerAccountsMap.get(email)!
      
      // Vérifier les incohérences
      if (accountData.firstName !== data.firstName || accountData.lastName !== data.lastName) {
        inconsistentNames++
      }
      
      if (accountData.email !== data.email) {
        inconsistentEmails++
      }
      
      // Vérifier les champs requis
      if (!data.firstName || !data.lastName || !data.email) {
        missingRequiredFields++
      }
    }
  })
  
  if (inconsistentEmails > 0) {
    issues.push(`${inconsistentEmails} incohérences d'email entre playerAccounts et players`)
  }
  if (inconsistentNames > 0) {
    issues.push(`${inconsistentNames} incohérences de nom entre playerAccounts et players`)
  }
  if (missingRequiredFields > 0) {
    issues.push(`${missingRequiredFields} documents avec champs requis manquants`)
  }
  
  console.log(`   - Incohérences d'email: ${inconsistentEmails}`)
  console.log(`   - Incohérences de nom: ${inconsistentNames}`)
  console.log(`   - Champs requis manquants: ${missingRequiredFields}\n`)
  
  // 3. Analyser les performances
  console.log('📋 3. Analyse des performances...\n')
  
  // Compter les documents par collection
  stats.playerAccounts = playerAccountsSnap.size
  stats.players = playersSnap.size
  stats.teams = teamsSnap.size
  
  const registrationsSnap = await db.collection('teamRegistrations').get()
  stats.teamRegistrations = registrationsSnap.size
  
  const usersSnap = await db.collection('users').get()
  stats.users = usersSnap.size
  
  const profilesSnap = await db.collection('userProfiles').get()
  stats.userProfiles = profilesSnap.size
  
  console.log(`   - playerAccounts: ${stats.playerAccounts} documents`)
  console.log(`   - players: ${stats.players} documents`)
  console.log(`   - teams: ${stats.teams} documents`)
  console.log(`   - teamRegistrations: ${stats.teamRegistrations} documents`)
  console.log(`   - users: ${stats.users} documents`)
  console.log(`   - userProfiles: ${stats.userProfiles} documents\n`)
  
  // 4. Analyser les relations
  console.log('📋 4. Analyse des relations...\n')
  
  // Joueurs référencés dans teams mais absents de playerAccounts
  let playersInTeamsButNotInAccounts = 0
  teamsSnap.forEach(teamDoc => {
    const teamData = teamDoc.data()
    if (teamData.players && Array.isArray(teamData.players)) {
      teamData.players.forEach((player: any) => {
        const email = player.email?.toLowerCase()?.trim()
        if (email && !playerAccountsMap.has(email)) {
          playersInTeamsButNotInAccounts++
        }
      })
    }
  })
  
  if (playersInTeamsButNotInAccounts > 0) {
    issues.push(`${playersInTeamsButNotInAccounts} joueurs dans teams.players absents de playerAccounts`)
    recommendations.push('Créer les entrées manquantes dans playerAccounts ou nettoyer teams.players')
  }
  
  console.log(`   - Joueurs dans teams absents de playerAccounts: ${playersInTeamsButNotInAccounts}\n`)
  
  // 5. Recommandations structurelles
  console.log('💡 Recommandations structurelles:\n')
  
  recommendations.push('Créer des index Firestore pour les requêtes fréquentes (email, teamId, etc.)')
  recommendations.push('Implémenter un système de validation des données à l\'entrée')
  recommendations.push('Créer un script de maintenance automatique mensuel')
  recommendations.push('Documenter la structure de la BDD et les relations entre collections')
  recommendations.push('Créer des règles de sécurité Firestore pour protéger les données')
  recommendations.push('Implémenter un système de logs pour tracer les modifications importantes')
  
  // 6. Résumé
  console.log('📊 Résumé des problèmes identifiés:\n')
  
  if (issues.length === 0) {
    console.log('✅ Aucun problème majeur identifié!\n')
  } else {
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ⚠️  ${issue}`)
    })
    console.log('')
  }
  
  console.log('💡 Recommandations:\n')
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`)
  })
  
  console.log('\n✅ Analyse terminée')
  
  return { issues, recommendations, stats }
}

analyzeOptimizations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

