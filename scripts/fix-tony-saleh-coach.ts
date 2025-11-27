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

async function fixTonySaleh() {
  console.log('🔧 Correction de Tony Saleh (coach)...\n')
  
  const email = 'tonysaleh2500@outlook.com'
  const emailVariants = ['tonysaleh2500@outlook.com', 'Tonysaleh2500@outlook.com']
  
  // 1. Vérifier coachAccounts
  console.log('📋 1. Vérification de coachAccounts...')
  const coachSnap = await db.collection('coachAccounts')
    .where('email', '==', email)
    .get()
  
  if (coachSnap.empty) {
    // Chercher avec différentes variantes
    for (const variant of emailVariants) {
      const variantSnap = await db.collection('coachAccounts')
        .where('email', '==', variant)
        .get()
      if (!variantSnap.empty) {
        coachSnap.docs.push(...variantSnap.docs)
        break
      }
    }
  }
  
  if (!coachSnap.empty) {
    const coachData = coachSnap.docs[0].data()
    console.log(`   ✅ Coach trouvé: ${coachData.firstName} ${coachData.lastName}`)
    console.log(`      Email: ${coachData.email}`)
    console.log(`      Équipe: ${coachData.teamName || 'N/A'}`)
  } else {
    console.log('   ❌ Aucun coach trouvé')
  }
  
  // 2. Vérifier accounts
  console.log('\n📋 2. Vérification de accounts...')
  const accountsSnap = await db.collection('accounts')
    .where('email', '==', email)
    .get()
  
  if (accountsSnap.empty) {
    for (const variant of emailVariants) {
      const variantSnap = await db.collection('accounts')
        .where('email', '==', variant)
        .get()
      if (!variantSnap.empty) {
        accountsSnap.docs.push(...variantSnap.docs)
        break
      }
    }
  }
  
  if (!accountsSnap.empty) {
    accountsSnap.docs.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 Account trouvé (ID: ${doc.id}):`)
      console.log(`      Rôle: ${data.role || 'N/A'}`)
      console.log(`      Email: ${data.email}`)
      
      if (data.role !== 'coach') {
        console.log(`      🔧 Mise à jour du rôle en "coach"...`)
        doc.ref.update({
          role: 'coach',
          updatedAt: new Date()
        }).then(() => {
          console.log(`      ✅ Rôle mis à jour`)
        })
      }
    })
  }
  
  // 3. Vérifier users
  console.log('\n📋 3. Vérification de users...')
  const usersSnap = await db.collection('users').get()
  const tonyUser = usersSnap.docs.find(doc => {
    const data = doc.data()
    return emailVariants.some(v => data.email?.toLowerCase() === v.toLowerCase())
  })
  
  if (tonyUser) {
    const userData = tonyUser.data()
    console.log(`   📝 User trouvé (ID: ${tonyUser.id}):`)
    console.log(`      Email: ${userData.email}`)
    console.log(`      Rôle: ${userData.role || 'N/A'}`)
    
    // Mettre à jour le rôle dans users
    if (userData.role !== 'coach') {
      console.log(`      🔧 Mise à jour du rôle en "coach"...`)
      tonyUser.ref.update({
        role: 'coach',
        updatedAt: new Date()
      }).then(() => {
        console.log(`      ✅ Rôle mis à jour`)
      })
    }
  }
  
  // 4. Vérifier userProfiles
  console.log('\n📋 4. Vérification de userProfiles...')
  const profilesSnap = await db.collection('userProfiles').get()
  const tonyProfile = profilesSnap.docs.find(doc => {
    const data = doc.data()
    return emailVariants.some(v => data.email?.toLowerCase() === v.toLowerCase())
  })
  
  if (tonyProfile) {
    const profileData = tonyProfile.data()
    console.log(`   📝 Profile trouvé (ID: ${tonyProfile.id}):`)
    console.log(`      Email: ${profileData.email}`)
    console.log(`      Rôle: ${profileData.role || 'N/A'}`)
    
    // Mettre à jour le rôle dans userProfiles
    if (profileData.role !== 'coach') {
      console.log(`      🔧 Mise à jour du rôle en "coach"...`)
      tonyProfile.ref.update({
        role: 'coach',
        updatedAt: new Date()
      }).then(() => {
        console.log(`      ✅ Rôle mis à jour`)
      })
    }
  }
  
  // 5. Vérifier playerAccounts (ne devrait pas être là)
  console.log('\n📋 5. Vérification de playerAccounts...')
  const playerSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (!playerSnap.empty) {
    console.log(`   ⚠️  ${playerSnap.size} entrée(s) trouvée(s) dans playerAccounts`)
    console.log(`   🗑️  Suppression (Tony Saleh est un coach, pas un joueur)...`)
    
    for (const doc of playerSnap.docs) {
      await doc.ref.delete()
      console.log(`      ✅ Supprimé: ${doc.id}`)
    }
  } else {
    console.log('   ✅ Aucune entrée dans playerAccounts (correct)')
  }
  
  // 6. Vérifier players (ne devrait pas être là)
  console.log('\n📋 6. Vérification de players...')
  const playersSnap = await db.collection('players')
    .where('email', '==', email)
    .get()
  
  if (!playersSnap.empty) {
    console.log(`   ⚠️  ${playersSnap.size} entrée(s) trouvée(s) dans players`)
    console.log(`   🗑️  Suppression...`)
    
    for (const doc of playersSnap.docs) {
      await doc.ref.delete()
      console.log(`      ✅ Supprimé: ${doc.id}`)
    }
  } else {
    console.log('   ✅ Aucune entrée dans players (correct)')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Correction terminée!')
  console.log('   Tony Saleh est maintenant identifié comme coach partout')
  console.log('\n' + '='.repeat(60))
}

fixTonySaleh()
  .then(() => {
    setTimeout(() => process.exit(0), 3000)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

