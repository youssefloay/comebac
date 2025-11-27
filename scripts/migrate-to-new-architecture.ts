import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

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

interface MigrationStats {
  accountsCreated: number
  accountsUpdated: number
  playerStatsCreated: number
  playerStatsUpdated: number
  errors: string[]
  warnings: string[]
}

const stats: MigrationStats = {
  accountsCreated: 0,
  accountsUpdated: 0,
  playerStatsCreated: 0,
  playerStatsUpdated: 0,
  errors: [],
  warnings: []
}

/**
 * Phase 1: Créer la collection accounts en fusionnant users et userProfiles
 */
async function phase1_CreateAccounts() {
  console.log('\n📋 Phase 1: Création de la collection accounts...\n')
  
  // 1. Charger users et userProfiles
  const usersSnap = await db.collection('users').get()
  const profilesSnap = await db.collection('userProfiles').get()
  
  console.log(`   📊 ${usersSnap.size} documents dans users`)
  console.log(`   📊 ${profilesSnap.size} documents dans userProfiles`)
  
  // 2. Créer un map des profils par email et UID
  const profilesByUid = new Map<string, any>()
  const profilesByEmail = new Map<string, any>()
  
  profilesSnap.forEach(doc => {
    const data = doc.data()
    const uid = data.uid || doc.id
    const email = data.email?.toLowerCase()?.trim()
    
    if (uid) profilesByUid.set(uid, { id: doc.id, ...data })
    if (email) profilesByEmail.set(email, { id: doc.id, ...data })
  })
  
  // 3. Traiter chaque user
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data()
    const uid = userDoc.id
    const email = userData.email?.toLowerCase()?.trim()
    
    if (!email) {
      stats.warnings.push(`User ${uid} sans email, ignoré`)
      continue
    }
    
    // Chercher le profil correspondant
    const profile = profilesByUid.get(uid) || profilesByEmail.get(email)
    
    // Parser le nom complet
    const { firstName, lastName } = parseFullName(profile?.fullName || userData.displayName)
    
    // Créer l'entrée accounts (filtrer les undefined)
    const accountData: any = {
      email: userData.email,
      emailVerified: userData.emailVerified || profile?.emailVerified || false,
      role: profile?.role || userData.role || 'user',
      createdAt: userData.createdAt || Timestamp.now(),
      migratedFrom: ['users'],
      migratedAt: Timestamp.now()
    }
    
    // Ajouter les champs optionnels seulement s'ils existent
    if (firstName || userData.firstName) accountData.firstName = firstName || userData.firstName
    if (lastName || userData.lastName) accountData.lastName = lastName || userData.lastName
    if (profile?.fullName || userData.displayName || `${firstName} ${lastName}`.trim()) {
      accountData.displayName = profile?.fullName || userData.displayName || `${firstName} ${lastName}`.trim()
    }
    if (profile?.phone || userData.phone) accountData.phone = profile?.phone || userData.phone
    if (userData.photoURL || profile?.photoURL) accountData.photoURL = userData.photoURL || profile?.photoURL
    if (userData.lastLogin) accountData.lastLogin = userData.lastLogin
    
    if (profile) {
      accountData.migratedFrom.push('userProfiles')
      if (profile.teamId) accountData.teamId = profile.teamId
      if (profile.teamName) accountData.teamName = profile.teamName
    }
    
    try {
      await db.collection('accounts').doc(uid).set(accountData, { merge: true })
      stats.accountsCreated++
      console.log(`   ✅ Account créé pour ${email}`)
    } catch (error: any) {
      stats.errors.push(`Erreur création account ${email}: ${error.message}`)
    }
  }
  
  // 4. Traiter les profils orphelins (sans user)
  const userIds = new Set(usersSnap.docs.map(doc => doc.id))
  
  for (const profileDoc of profilesSnap.docs) {
    const profileData = profileDoc.data()
    const uid = profileData.uid || profileDoc.id
    const email = profileData.email?.toLowerCase()?.trim()
    
    if (!email) continue
    if (userIds.has(uid)) continue // Déjà traité
    
    const { firstName, lastName } = parseFullName(profileData.fullName)
    
    const accountData: any = {
      email: profileData.email,
      emailVerified: profileData.emailVerified || false,
      role: profileData.role || 'user',
      displayName: profileData.fullName || email,
      createdAt: profileData.createdAt || Timestamp.now(),
      migratedFrom: ['userProfiles'],
      migratedAt: Timestamp.now()
    }
    
    // Ajouter les champs optionnels seulement s'ils existent
    if (firstName) accountData.firstName = firstName
    if (lastName) accountData.lastName = lastName
    if (profileData.phone) accountData.phone = profileData.phone
    if (profileData.photoURL) accountData.photoURL = profileData.photoURL
    if (profileData.teamId) accountData.teamId = profileData.teamId
    if (profileData.teamName) accountData.teamName = profileData.teamName
    
    try {
      await db.collection('accounts').doc(uid).set(accountData, { merge: true })
      stats.accountsCreated++
      console.log(`   ✅ Account créé pour profil orphelin ${email}`)
    } catch (error: any) {
      stats.errors.push(`Erreur création account profil ${email}: ${error.message}`)
    }
  }
  
  console.log(`\n   ✅ Phase 1 terminée: ${stats.accountsCreated} accounts créés`)
}

/**
 * Phase 2: Enrichir accounts avec les données de playerAccounts
 */
async function phase2_EnrichAccountsWithPlayers() {
  console.log('\n📋 Phase 2: Enrichissement avec playerAccounts...\n')
  
  const playerAccountsSnap = await db.collection('playerAccounts').get()
  console.log(`   📊 ${playerAccountsSnap.size} documents dans playerAccounts`)
  
  for (const playerDoc of playerAccountsSnap.docs) {
    const playerData = playerDoc.data()
    const email = playerData.email?.toLowerCase()?.trim()
    const uid = playerData.uid || playerDoc.id
    
    if (!email || !uid) {
      stats.warnings.push(`PlayerAccount ${playerDoc.id} sans email ou UID`)
      continue
    }
    
    // Chercher l'account correspondant
    let accountRef = db.collection('accounts').doc(uid)
    const accountDoc = await accountRef.get()
    
    const updates: any = {
      role: 'player',
      updatedAt: Timestamp.now()
    }
    
    // Ajouter les champs seulement s'ils existent (pas undefined)
    if (playerData.teamId) updates.teamId = playerData.teamId
    if (playerData.teamName) updates.teamName = playerData.teamName
    if (playerData.position) updates.position = playerData.position
    if (playerData.jerseyNumber !== undefined) updates.jerseyNumber = playerData.jerseyNumber
    if (playerData.birthDate) updates.birthDate = playerData.birthDate
    if (playerData.height !== undefined) updates.height = playerData.height
    if (playerData.foot) updates.foot = playerData.foot
    if (playerData.tshirtSize) updates.tshirtSize = playerData.tshirtSize
    if (playerData.grade) updates.grade = playerData.grade
    if (playerData.firstName) updates.firstName = playerData.firstName
    if (playerData.lastName) updates.lastName = playerData.lastName
    if (playerData.phone) updates.phone = playerData.phone
    if (playerData.photoURL) updates.photoURL = playerData.photoURL
    if (playerData.lastLogin) updates.lastLogin = playerData.lastLogin
    
    // Si l'account existe, mettre à jour
    if (accountDoc.exists) {
      const existingData = accountDoc.data()
      // Ne pas écraser si déjà présent
      if (!existingData?.firstName) updates.firstName = playerData.firstName
      if (!existingData?.lastName) updates.lastName = playerData.lastName
      if (!existingData?.email) updates.email = playerData.email
      
      updates.migratedFrom = [...(existingData?.migratedFrom || []), 'playerAccounts']
      
      try {
        await accountRef.update(updates)
        stats.accountsUpdated++
        console.log(`   ✅ Account enrichi pour joueur ${email}`)
      } catch (error: any) {
        stats.errors.push(`Erreur enrichissement account ${email}: ${error.message}`)
      }
    } else {
      // Créer un nouvel account (filtrer les undefined)
      const newAccount: any = {
        email: playerData.email,
        emailVerified: playerData.emailVerified || false,
        role: 'player',
        createdAt: playerData.createdAt || Timestamp.now(),
        migratedFrom: ['playerAccounts'],
        migratedAt: Timestamp.now()
      }
      
      // Copier seulement les champs définis de updates
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          newAccount[key] = updates[key]
        }
      })
      
      try {
        await accountRef.set(newAccount)
        stats.accountsCreated++
        console.log(`   ✅ Account créé pour joueur ${email}`)
      } catch (error: any) {
        stats.errors.push(`Erreur création account joueur ${email}: ${error.message}`)
      }
    }
  }
  
  console.log(`\n   ✅ Phase 2 terminée: ${stats.accountsUpdated} accounts mis à jour, ${stats.accountsCreated} créés`)
}

/**
 * Phase 3: Enrichir accounts avec les données de coachAccounts
 */
async function phase3_EnrichAccountsWithCoaches() {
  console.log('\n📋 Phase 3: Enrichissement avec coachAccounts...\n')
  
  const coachAccountsSnap = await db.collection('coachAccounts').get()
  console.log(`   📊 ${coachAccountsSnap.size} documents dans coachAccounts`)
  
  for (const coachDoc of coachAccountsSnap.docs) {
    const coachData = coachDoc.data()
    const email = coachData.email?.toLowerCase()?.trim()
    const uid = coachData.uid || coachDoc.id
    
    if (!email || !uid) {
      stats.warnings.push(`CoachAccount ${coachDoc.id} sans email ou UID`)
      continue
    }
    
    const accountRef = db.collection('accounts').doc(uid)
    const accountDoc = await accountRef.get()
    
    const updates: any = {
      role: 'coach',
      updatedAt: Timestamp.now()
    }
    
    // Ajouter les champs seulement s'ils existent
    if (coachData.firstName) updates.firstName = coachData.firstName
    if (coachData.lastName) updates.lastName = coachData.lastName
    if (coachData.phone) updates.phone = coachData.phone
    if (coachData.photoURL) updates.photoURL = coachData.photoURL
    if (coachData.birthDate) updates.birthDate = coachData.birthDate
    if (coachData.tshirtSize) updates.tshirtSize = coachData.tshirtSize
    
    // Récupérer les équipes du coach
    const coachTeamsSnap = await db.collection('teams')
      .where('coach.email', '==', email)
      .get()
    
    if (!coachTeamsSnap.empty) {
      updates.teams = coachTeamsSnap.docs.map(doc => doc.id)
    }
    
    if (accountDoc.exists) {
      const existingData = accountDoc.data()
      updates.migratedFrom = [...(existingData?.migratedFrom || []), 'coachAccounts']
      
      try {
        await accountRef.update(updates)
        stats.accountsUpdated++
        console.log(`   ✅ Account enrichi pour coach ${email}`)
      } catch (error: any) {
        stats.errors.push(`Erreur enrichissement account coach ${email}: ${error.message}`)
      }
    } else {
      const newAccount: any = {
        email: coachData.email,
        emailVerified: coachData.emailVerified || false,
        role: 'coach',
        createdAt: coachData.createdAt || Timestamp.now(),
        migratedFrom: ['coachAccounts'],
        migratedAt: Timestamp.now()
      }
      
      // Copier seulement les champs définis de updates
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          newAccount[key] = updates[key]
        }
      })
      
      try {
        await accountRef.set(newAccount)
        stats.accountsCreated++
        console.log(`   ✅ Account créé pour coach ${email}`)
      } catch (error: any) {
        stats.errors.push(`Erreur création account coach ${email}: ${error.message}`)
      }
    }
  }
  
  console.log(`\n   ✅ Phase 3 terminée`)
}

/**
 * Phase 4: Créer playerStats depuis players (statistiques uniquement)
 */
async function phase4_CreatePlayerStats() {
  console.log('\n📋 Phase 4: Création de playerStats...\n')
  
  const playersSnap = await db.collection('players').get()
  console.log(`   📊 ${playersSnap.size} documents dans players`)
  
  for (const playerDoc of playersSnap.docs) {
    const playerData = playerDoc.data()
    const email = playerData.email?.toLowerCase()?.trim()
    
    if (!email) {
      stats.warnings.push(`Player ${playerDoc.id} sans email`)
      continue
    }
    
    // Chercher l'account correspondant
    const accountsSnap = await db.collection('accounts')
      .where('email', '==', email)
      .limit(1)
      .get()
    
    if (accountsSnap.empty) {
      stats.warnings.push(`Aucun account trouvé pour player ${email}`)
      continue
    }
    
    const accountId = accountsSnap.docs[0].id
    
    // Extraire uniquement les statistiques (filtrer les undefined)
    const statsData: any = {
      accountId,
      season: playerData.season || '2024-2025',
      stats: {
        goals: playerData.goals || playerData.stats?.goals || 0,
        assists: playerData.assists || playerData.stats?.assists || 0,
        matches: playerData.matches || playerData.stats?.matches || 0,
        yellowCards: playerData.yellowCards || playerData.stats?.yellowCards || 0,
        redCards: playerData.redCards || playerData.stats?.redCards || 0
      },
      createdAt: playerData.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
      migratedFrom: 'players',
      migratedAt: Timestamp.now()
    }
    
    // Ajouter les champs optionnels seulement s'ils existent
    if (playerData.teamId) statsData.teamId = playerData.teamId
    if (playerData.teamName) statsData.teamName = playerData.teamName
    
    // Ajouter d'autres stats si présentes (filtrer undefined)
    if (playerData.stats) {
      Object.keys(playerData.stats).forEach(key => {
        if (playerData.stats[key] !== undefined && !statsData.stats[key]) {
          statsData.stats[key] = playerData.stats[key]
        }
      })
    }
    
    try {
      // Utiliser l'ID du player original ou créer un nouveau
      const statsId = `${accountId}_${statsData.season}`
      await db.collection('playerStats').doc(statsId).set(statsData, { merge: true })
      stats.playerStatsCreated++
      console.log(`   ✅ PlayerStats créé pour ${email}`)
    } catch (error: any) {
      stats.errors.push(`Erreur création playerStats ${email}: ${error.message}`)
    }
  }
  
  console.log(`\n   ✅ Phase 4 terminée: ${stats.playerStatsCreated} playerStats créés`)
}

/**
 * Fonction utilitaire pour parser un nom complet
 */
function parseFullName(fullName?: string): { firstName?: string; lastName?: string } {
  if (!fullName) return {}
  const parts = fullName.trim().split(' ')
  if (parts.length === 0) return {}
  const [firstName, ...rest] = parts
  return { firstName, lastName: rest.join(' ') || undefined }
}

/**
 * Fonction principale de migration
 */
async function migrate() {
  console.log('🚀 Début de la migration vers la nouvelle architecture...\n')
  console.log('⚠️  ATTENTION: Cette opération va modifier la structure de la base de données!')
  console.log('   Assurez-vous d\'avoir fait une sauvegarde complète.\n')
  
  try {
    // Phase 1: Créer accounts
    await phase1_CreateAccounts()
    
    // Phase 2: Enrichir avec playerAccounts
    await phase2_EnrichAccountsWithPlayers()
    
    // Phase 3: Enrichir avec coachAccounts
    await phase3_EnrichAccountsWithCoaches()
    
    // Phase 4: Créer playerStats
    await phase4_CreatePlayerStats()
    
    // Résumé final
    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSUMÉ DE LA MIGRATION\n')
    console.log(`✅ Accounts créés: ${stats.accountsCreated}`)
    console.log(`🔄 Accounts mis à jour: ${stats.accountsUpdated}`)
    console.log(`📈 PlayerStats créés: ${stats.playerStatsCreated}`)
    console.log(`⚠️  Avertissements: ${stats.warnings.length}`)
    console.log(`❌ Erreurs: ${stats.errors.length}`)
    
    if (stats.warnings.length > 0) {
      console.log('\n⚠️  Avertissements:')
      stats.warnings.slice(0, 10).forEach(w => console.log(`   - ${w}`))
    }
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Erreurs:')
      stats.errors.slice(0, 10).forEach(e => console.log(`   - ${e}`))
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Migration terminée!')
    console.log('\n📋 Prochaines étapes:')
    console.log('   1. Vérifier les données dans la collection "accounts"')
    console.log('   2. Vérifier les données dans la collection "playerStats"')
    console.log('   3. Tester l\'application avec la nouvelle structure')
    console.log('   4. Après validation, exécuter le script de nettoyage')
    
  } catch (error: any) {
    console.error('\n❌ Erreur fatale lors de la migration:', error)
    throw error
  }
}

// Exécuter la migration
if (require.main === module) {
  console.log('⚠️  Ce script va migrer la base de données vers une nouvelle architecture')
  console.log('   - Créer la collection "accounts" (fusion users + userProfiles)')
  console.log('   - Enrichir avec playerAccounts et coachAccounts')
  console.log('   - Créer la collection "playerStats" (statistiques uniquement)')
  console.log('\n   Appuyez sur Ctrl+C pour annuler, ou attendez 10 secondes...\n')
  
  setTimeout(() => {
    migrate()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Erreur:', error)
        process.exit(1)
      })
  }, 10000)
}

export { migrate }

