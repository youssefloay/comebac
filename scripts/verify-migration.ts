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

async function verifyMigration() {
  console.log('🔍 Vérification de la migration...\n')
  
  const issues: string[] = []
  const stats = {
    accounts: 0,
    playerAccounts: 0,
    coachAccounts: 0,
    playerStats: 0,
    playersWithoutAccount: 0,
    coachesWithoutAccount: 0
  }
  
  // 1. Vérifier accounts
  const accountsSnap = await db.collection('accounts').get()
  stats.accounts = accountsSnap.size
  console.log(`✅ Accounts: ${stats.accounts}`)
  
  // 2. Vérifier playerAccounts
  const playerAccountsSnap = await db.collection('playerAccounts').get()
  stats.playerAccounts = playerAccountsSnap.size
  console.log(`✅ PlayerAccounts: ${stats.playerAccounts}`)
  
  // Vérifier que chaque playerAccount a un account correspondant
  for (const playerDoc of playerAccountsSnap.docs) {
    const playerData = playerDoc.data()
    const email = playerData.email?.toLowerCase()?.trim()
    const uid = playerData.uid || playerDoc.id
    
    if (!email) continue
    
    const accountDoc = await db.collection('accounts').doc(uid).get()
    if (!accountDoc.exists) {
      // Chercher par email
      const accountByEmail = await db.collection('accounts')
        .where('email', '==', playerData.email)
        .limit(1)
        .get()
      
      if (accountByEmail.empty) {
        issues.push(`PlayerAccount ${email} n'a pas d'account correspondant`)
        stats.playersWithoutAccount++
      }
    }
  }
  
  // 3. Vérifier coachAccounts
  const coachAccountsSnap = await db.collection('coachAccounts').get()
  stats.coachAccounts = coachAccountsSnap.size
  console.log(`✅ CoachAccounts: ${stats.coachAccounts}`)
  
  for (const coachDoc of coachAccountsSnap.docs) {
    const coachData = coachDoc.data()
    const email = coachData.email?.toLowerCase()?.trim()
    const uid = coachData.uid || coachDoc.id
    
    if (!email) continue
    
    const accountDoc = await db.collection('accounts').doc(uid).get()
    if (!accountDoc.exists) {
      const accountByEmail = await db.collection('accounts')
        .where('email', '==', coachData.email)
        .limit(1)
        .get()
      
      if (accountByEmail.empty) {
        issues.push(`CoachAccount ${email} n'a pas d'account correspondant`)
        stats.coachesWithoutAccount++
      }
    }
  }
  
  // 4. Vérifier playerStats
  const playerStatsSnap = await db.collection('playerStats').get()
  stats.playerStats = playerStatsSnap.size
  console.log(`✅ PlayerStats: ${stats.playerStats}`)
  
  // Vérifier que chaque playerStats a un account correspondant
  for (const statsDoc of playerStatsSnap.docs) {
    const statsData = statsDoc.data()
    const accountId = statsData.accountId
    
    if (!accountId) {
      issues.push(`PlayerStats ${statsDoc.id} n'a pas d'accountId`)
      continue
    }
    
    const accountDoc = await db.collection('accounts').doc(accountId).get()
    if (!accountDoc.exists) {
      issues.push(`PlayerStats ${statsDoc.id} référence un account inexistant (${accountId})`)
    }
  }
  
  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ DE LA VÉRIFICATION\n')
  console.log(`✅ Accounts: ${stats.accounts}`)
  console.log(`✅ PlayerAccounts: ${stats.playerAccounts}`)
  console.log(`✅ CoachAccounts: ${stats.coachAccounts}`)
  console.log(`✅ PlayerStats: ${stats.playerStats}`)
  
  if (stats.playersWithoutAccount > 0) {
    console.log(`⚠️  Players sans account: ${stats.playersWithoutAccount}`)
  }
  
  if (stats.coachesWithoutAccount > 0) {
    console.log(`⚠️  Coaches sans account: ${stats.coachesWithoutAccount}`)
  }
  
  if (issues.length > 0) {
    console.log(`\n❌ Problèmes détectés: ${issues.length}`)
    issues.slice(0, 20).forEach(issue => console.log(`   - ${issue}`))
  } else {
    console.log('\n✅ Aucun problème détecté! La migration semble réussie.')
  }
  
  console.log('\n' + '='.repeat(60))
}

verifyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

