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

async function checkInconsistencies() {
  console.log('🔍 Vérification des incohérences dans la BDD...\n')
  
  const email = 'gendy051@gmail.com'
  
  // 1. Vérifier userProfiles
  console.log('📋 1. userProfiles:')
  const profilesSnap = await db.collection('userProfiles')
    .where('email', '==', email)
    .get()
  
  if (!profilesSnap.empty) {
    profilesSnap.docs.forEach(doc => {
      const data = doc.data()
      console.log(`   ID: ${doc.id}`)
      console.log(`   Email: ${data.email}`)
      console.log(`   UID: ${data.uid || 'N/A'}`)
      console.log(`   FullName: ${data.fullName || 'N/A'}`)
      console.log(`   FirstName: ${data.firstName || 'N/A'}`)
      console.log(`   LastName: ${data.lastName || 'N/A'}`)
      console.log(`   Username: ${data.username || 'N/A'}`)
      console.log(`   Rôle: ${data.role || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun profile trouvé\n')
  }
  
  // 2. Vérifier playerAccounts
  console.log('📋 2. playerAccounts:')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (!playerAccountsSnap.empty) {
    playerAccountsSnap.docs.forEach(doc => {
      const data = doc.data()
      console.log(`   ID: ${doc.id}`)
      console.log(`   Email: ${data.email}`)
      console.log(`   UID: ${data.uid || 'N/A'}`)
      console.log(`   FirstName: ${data.firstName || 'N/A'}`)
      console.log(`   LastName: ${data.lastName || 'N/A'}`)
      console.log(`   TeamId: ${data.teamId || 'N/A'}`)
      console.log(`   TeamName: ${data.teamName || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun playerAccount trouvé\n')
  }
  
  // 3. Vérifier accounts
  console.log('📋 3. accounts:')
  const accountsSnap = await db.collection('accounts')
    .where('email', '==', email)
    .get()
  
  if (!accountsSnap.empty) {
    accountsSnap.docs.forEach(doc => {
      const data = doc.data()
      console.log(`   ID: ${doc.id}`)
      console.log(`   Email: ${data.email}`)
      console.log(`   FirstName: ${data.firstName || 'N/A'}`)
      console.log(`   LastName: ${data.lastName || 'N/A'}`)
      console.log(`   Rôle: ${data.role || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun account trouvé\n')
  }
  
  // 4. Vérifier players
  console.log('📋 4. players:')
  const playersSnap = await db.collection('players')
    .where('email', '==', email)
    .get()
  
  if (!playersSnap.empty) {
    playersSnap.docs.forEach(doc => {
      const data = doc.data()
      console.log(`   ID: ${doc.id}`)
      console.log(`   Email: ${data.email || 'N/A'}`)
      console.log(`   FirstName: ${data.firstName || 'N/A'}`)
      console.log(`   LastName: ${data.lastName || 'N/A'}`)
      console.log(`   TeamId: ${data.teamId || 'N/A'}`)
      console.log(`   TeamName: ${data.teamName || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun player trouvé\n')
  }
  
  // 5. Vérifier teams.players
  console.log('📋 5. teams.players:')
  const teamsSnap = await db.collection('teams').get()
  let foundInTeams = false
  
  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data()
    const players = teamData.players || []
    const player = players.find((p: any) => p.email === email)
    
    if (player) {
      foundInTeams = true
      console.log(`   Équipe: ${teamData.name} (ID: ${teamDoc.id})`)
      console.log(`   FirstName: ${player.firstName || 'N/A'}`)
      console.log(`   LastName: ${player.lastName || 'N/A'}`)
      console.log(`   Email: ${player.email || 'N/A'}`)
      console.log('')
    }
  }
  
  if (!foundInTeams) {
    console.log('   ❌ Aucun joueur trouvé dans les équipes\n')
  }
  
  // 6. Vérifier les incohérences de noms
  console.log('📋 6. Incohérences de noms:')
  const allNames: { collection: string; firstName: string; lastName: string }[] = []
  
  if (!profilesSnap.empty) {
    profilesSnap.docs.forEach(doc => {
      const data = doc.data()
      allNames.push({
        collection: 'userProfiles',
        firstName: data.firstName || '',
        lastName: data.lastName || ''
      })
    })
  }
  
  if (!playerAccountsSnap.empty) {
    playerAccountsSnap.docs.forEach(doc => {
      const data = doc.data()
      allNames.push({
        collection: 'playerAccounts',
        firstName: data.firstName || '',
        lastName: data.lastName || ''
      })
    })
  }
  
  if (!accountsSnap.empty) {
    accountsSnap.docs.forEach(doc => {
      const data = doc.data()
      allNames.push({
        collection: 'accounts',
        firstName: data.firstName || '',
        lastName: data.lastName || ''
      })
    })
  }
  
  if (allNames.length > 0) {
    const first = allNames[0]
    const inconsistencies = allNames.filter(n => 
      n.firstName !== first.firstName || n.lastName !== first.lastName
    )
    
    if (inconsistencies.length > 0) {
      console.log('   ⚠️  INCOHÉRENCES DÉTECTÉES:')
      allNames.forEach(n => {
        console.log(`      ${n.collection}: ${n.firstName} ${n.lastName}`)
      })
    } else {
      console.log('   ✅ Tous les noms sont cohérents')
      console.log(`      ${first.firstName} ${first.lastName}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Vérification terminée')
  console.log('\n' + '='.repeat(60))
}

checkInconsistencies()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

