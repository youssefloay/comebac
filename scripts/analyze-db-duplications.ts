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

interface DuplicationStats {
  email: string
  collections: {
    playerAccounts?: number
    players?: number
    users?: number
    userProfiles?: number
    coachAccounts?: number
    teams?: number
    teamRegistrations?: number
  }
  totalOccurrences: number
}

async function analyzeDuplications() {
  console.log('🔍 Analyse des duplications dans la base de données...\n')
  
  // 1. Collecter tous les emails de toutes les collections
  const emailMap = new Map<string, DuplicationStats>()
  
  // playerAccounts
  console.log('📋 Analyse de playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts').get()
  playerAccountsSnap.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (email) {
      if (!emailMap.has(email)) {
        emailMap.set(email, { email, collections: {}, totalOccurrences: 0 })
      }
      const stats = emailMap.get(email)!
      stats.collections.playerAccounts = (stats.collections.playerAccounts || 0) + 1
      stats.totalOccurrences++
    }
  })
  console.log(`   ${playerAccountsSnap.size} documents analysés`)
  
  // players
  console.log('📋 Analyse de players...')
  const playersSnap = await db.collection('players').get()
  playersSnap.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (email) {
      if (!emailMap.has(email)) {
        emailMap.set(email, { email, collections: {}, totalOccurrences: 0 })
      }
      const stats = emailMap.get(email)!
      stats.collections.players = (stats.collections.players || 0) + 1
      stats.totalOccurrences++
    }
  })
  console.log(`   ${playersSnap.size} documents analysés`)
  
  // users
  console.log('📋 Analyse de users...')
  const usersSnap = await db.collection('users').get()
  usersSnap.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (email) {
      if (!emailMap.has(email)) {
        emailMap.set(email, { email, collections: {}, totalOccurrences: 0 })
      }
      const stats = emailMap.get(email)!
      stats.collections.users = (stats.collections.users || 0) + 1
      stats.totalOccurrences++
    }
  })
  console.log(`   ${usersSnap.size} documents analysés`)
  
  // userProfiles
  console.log('📋 Analyse de userProfiles...')
  const profilesSnap = await db.collection('userProfiles').get()
  profilesSnap.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (email) {
      if (!emailMap.has(email)) {
        emailMap.set(email, { email, collections: {}, totalOccurrences: 0 })
      }
      const stats = emailMap.get(email)!
      stats.collections.userProfiles = (stats.collections.userProfiles || 0) + 1
      stats.totalOccurrences++
    }
  })
  console.log(`   ${profilesSnap.size} documents analysés`)
  
  // coachAccounts
  console.log('📋 Analyse de coachAccounts...')
  const coachAccountsSnap = await db.collection('coachAccounts').get()
  coachAccountsSnap.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (email) {
      if (!emailMap.has(email)) {
        emailMap.set(email, { email, collections: {}, totalOccurrences: 0 })
      }
      const stats = emailMap.get(email)!
      stats.collections.coachAccounts = (stats.collections.coachAccounts || 0) + 1
      stats.totalOccurrences++
    }
  })
  console.log(`   ${coachAccountsSnap.size} documents analysés`)
  
  // teams.players
  console.log('📋 Analyse de teams.players...')
  const teamsSnap = await db.collection('teams').get()
  let teamsPlayersCount = 0
  teamsSnap.forEach(teamDoc => {
    const teamData = teamDoc.data()
    if (teamData.players && Array.isArray(teamData.players)) {
      teamData.players.forEach((player: any) => {
        const email = player.email?.toLowerCase()?.trim()
        if (email) {
          if (!emailMap.has(email)) {
            emailMap.set(email, { email, collections: {}, totalOccurrences: 0 })
          }
          const stats = emailMap.get(email)!
          stats.collections.teams = (stats.collections.teams || 0) + 1
          stats.totalOccurrences++
          teamsPlayersCount++
        }
      })
    }
  })
  console.log(`   ${teamsPlayersCount} joueurs dans teams.players analysés`)
  
  // teamRegistrations.players
  console.log('📋 Analyse de teamRegistrations.players...')
  const registrationsSnap = await db.collection('teamRegistrations').get()
  let registrationsPlayersCount = 0
  registrationsSnap.forEach(regDoc => {
    const regData = regDoc.data()
    if (regData.players && Array.isArray(regData.players)) {
      regData.players.forEach((player: any) => {
        const email = player.email?.toLowerCase()?.trim()
        if (email) {
          if (!emailMap.has(email)) {
            emailMap.set(email, { email, collections: {}, totalOccurrences: 0 })
          }
          const stats = emailMap.get(email)!
          stats.collections.teamRegistrations = (stats.collections.teamRegistrations || 0) + 1
          stats.totalOccurrences++
          registrationsPlayersCount++
        }
      })
    }
  })
  console.log(`   ${registrationsPlayersCount} joueurs dans teamRegistrations.players analysés`)
  
  // 2. Identifier les duplications
  console.log('\n📊 Statistiques des duplications:\n')
  
  const duplications = Array.from(emailMap.values())
    .filter(stat => stat.totalOccurrences > 1)
    .sort((a, b) => b.totalOccurrences - a.totalOccurrences)
  
  console.log(`✅ Total d'emails uniques: ${emailMap.size}`)
  console.log(`⚠️  Emails avec duplications: ${duplications.length}`)
  console.log(`📈 Total d'occurrences: ${Array.from(emailMap.values()).reduce((sum, stat) => sum + stat.totalOccurrences, 0)}`)
  console.log(`🔄 Occurrences en double: ${duplications.reduce((sum, stat) => sum + (stat.totalOccurrences - 1), 0)}`)
  
  // Afficher les 20 plus grandes duplications
  console.log('\n🔝 Top 20 des plus grandes duplications:\n')
  duplications.slice(0, 20).forEach((stat, index) => {
    console.log(`${index + 1}. ${stat.email} (${stat.totalOccurrences} occurrences)`)
    const collections = Object.entries(stat.collections)
      .filter(([_, count]) => count && count > 0)
      .map(([collection, count]) => `${collection}: ${count}`)
      .join(', ')
    console.log(`   Collections: ${collections}`)
    console.log('')
  })
  
  // 3. Analyser les patterns de duplication
  console.log('\n📊 Patterns de duplication:\n')
  
  const patterns = {
    playerAccountsAndPlayers: 0,
    playerAccountsAndUsers: 0,
    playerAccountsAndUserProfiles: 0,
    playersAndTeams: 0,
    playersAndRegistrations: 0,
    allPlayerCollections: 0,
    usersAndProfiles: 0
  }
  
  duplications.forEach(stat => {
    if (stat.collections.playerAccounts && stat.collections.players) {
      patterns.playerAccountsAndPlayers++
    }
    if (stat.collections.playerAccounts && stat.collections.users) {
      patterns.playerAccountsAndUsers++
    }
    if (stat.collections.playerAccounts && stat.collections.userProfiles) {
      patterns.playerAccountsAndUserProfiles++
    }
    if (stat.collections.players && stat.collections.teams) {
      patterns.playersAndTeams++
    }
    if (stat.collections.players && stat.collections.teamRegistrations) {
      patterns.playersAndRegistrations++
    }
    if (stat.collections.playerAccounts && stat.collections.players && stat.collections.users) {
      patterns.allPlayerCollections++
    }
    if (stat.collections.users && stat.collections.userProfiles) {
      patterns.usersAndProfiles++
    }
  })
  
  console.log(`- playerAccounts + players: ${patterns.playerAccountsAndPlayers}`)
  console.log(`- playerAccounts + users: ${patterns.playerAccountsAndUsers}`)
  console.log(`- playerAccounts + userProfiles: ${patterns.playerAccountsAndUserProfiles}`)
  console.log(`- players + teams.players: ${patterns.playersAndTeams}`)
  console.log(`- players + teamRegistrations.players: ${patterns.playersAndRegistrations}`)
  console.log(`- playerAccounts + players + users: ${patterns.allPlayerCollections}`)
  console.log(`- users + userProfiles: ${patterns.usersAndProfiles}`)
  
  // 4. Recommandations
  console.log('\n💡 Recommandations:\n')
  console.log('1. Centraliser les données joueurs dans playerAccounts comme source de vérité')
  console.log('2. Utiliser players uniquement pour les statistiques et données de match')
  console.log('3. Synchroniser teams.players et teamRegistrations.players depuis playerAccounts')
  console.log('4. Fusionner users et userProfiles en une seule collection')
  console.log('5. Créer un système de synchronisation automatique pour éviter les divergences')
  console.log('6. Nettoyer les doublons dans players (garder seulement ceux avec des stats)')
  
  console.log('\n✅ Analyse terminée')
}

analyzeDuplications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

