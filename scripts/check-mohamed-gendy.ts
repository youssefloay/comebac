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

async function checkMohamedGendy() {
  console.log('🔍 Vérification de Mohamed Gendy...\n')
  
  // Rechercher par nom
  const nameVariants = ['Mohamed Gendy', 'mohamed gendy', 'Mohamed', 'Gendy']
  
  // 1. Vérifier userProfiles
  console.log('📋 1. Vérification de userProfiles...')
  const profilesSnap = await db.collection('userProfiles').get()
  const mohamedProfiles = profilesSnap.docs.filter(doc => {
    const data = doc.data()
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim().toLowerCase()
    const email = data.email?.toLowerCase() || ''
    return nameVariants.some(n => fullName.includes(n.toLowerCase())) ||
           email.includes('gendy') || email.includes('mohamed')
  })
  
  if (mohamedProfiles.length > 0) {
    mohamedProfiles.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 Profile trouvé (ID: ${doc.id}):`)
      console.log(`      Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      Email: ${data.email}`)
      console.log(`      Username: ${data.username || 'N/A'}`)
      console.log(`      Rôle: ${data.role || 'N/A'}`)
      console.log(`      FullName: ${data.fullName || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun profile trouvé')
  }
  
  // 2. Vérifier users
  console.log('📋 2. Vérification de users...')
  const usersSnap = await db.collection('users').get()
  const mohamedUsers = usersSnap.docs.filter(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase() || ''
    return email.includes('gendy') || email.includes('mohamed')
  })
  
  if (mohamedUsers.length > 0) {
    mohamedUsers.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 User trouvé (ID: ${doc.id}):`)
      console.log(`      Email: ${data.email}`)
      console.log(`      Rôle: ${data.role || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun user trouvé')
  }
  
  // 3. Vérifier playerAccounts
  console.log('📋 3. Vérification de playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts').get()
  const mohamedPlayers = playerAccountsSnap.docs.filter(doc => {
    const data = doc.data()
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim().toLowerCase()
    const email = data.email?.toLowerCase() || ''
    return nameVariants.some(n => fullName.includes(n.toLowerCase())) ||
           email.includes('gendy') || email.includes('mohamed')
  })
  
  if (mohamedPlayers.length > 0) {
    mohamedPlayers.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 Player trouvé (ID: ${doc.id}):`)
      console.log(`      Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      Email: ${data.email}`)
      console.log(`      Équipe: ${data.teamName || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun player trouvé')
  }
  
  // 4. Vérifier coachAccounts
  console.log('📋 4. Vérification de coachAccounts...')
  const coachAccountsSnap = await db.collection('coachAccounts').get()
  const mohamedCoaches = coachAccountsSnap.docs.filter(doc => {
    const data = doc.data()
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim().toLowerCase()
    const email = data.email?.toLowerCase() || ''
    return nameVariants.some(n => fullName.includes(n.toLowerCase())) ||
           email.includes('gendy') || email.includes('mohamed')
  })
  
  if (mohamedCoaches.length > 0) {
    mohamedCoaches.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 Coach trouvé (ID: ${doc.id}):`)
      console.log(`      Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      Email: ${data.email}`)
      console.log(`      Équipe: ${data.teamName || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun coach trouvé')
  }
  
  // 5. Vérifier accounts
  console.log('📋 5. Vérification de accounts...')
  const accountsSnap = await db.collection('accounts').get()
  const mohamedAccounts = accountsSnap.docs.filter(doc => {
    const data = doc.data()
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim().toLowerCase()
    const email = data.email?.toLowerCase() || ''
    return nameVariants.some(n => fullName.includes(n.toLowerCase())) ||
           email.includes('gendy') || email.includes('mohamed')
  })
  
  if (mohamedAccounts.length > 0) {
    mohamedAccounts.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 Account trouvé (ID: ${doc.id}):`)
      console.log(`      Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      Email: ${data.email}`)
      console.log(`      Rôle: ${data.role || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun account trouvé')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Vérification terminée')
  console.log('\n' + '='.repeat(60))
}

checkMohamedGendy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

