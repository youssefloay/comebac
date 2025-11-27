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

async function findAdamMohamed() {
  console.log('🔍 Recherche de Adam Mohamed...\n')
  
  const nameVariants = ['Adam Mohamed', 'adam mohamed', 'Adam', 'Mohamed']
  
  // 1. Rechercher dans userProfiles
  console.log('📋 1. Recherche dans userProfiles...')
  const profilesSnap = await db.collection('userProfiles').get()
  const adamProfiles = profilesSnap.docs.filter(doc => {
    const data = doc.data()
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim().toLowerCase()
    const email = data.email?.toLowerCase() || ''
    return nameVariants.some(n => fullName.includes(n.toLowerCase())) ||
           (fullName.includes('adam') && fullName.includes('mohamed'))
  })
  
  if (adamProfiles.length > 0) {
    adamProfiles.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 Profile trouvé (ID: ${doc.id}):`)
      console.log(`      Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      Email: ${data.email}`)
      console.log(`      Username: ${data.username || 'N/A'}`)
      console.log(`      FullName: ${data.fullName || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun profile trouvé\n')
  }
  
  // 2. Rechercher dans playerAccounts
  console.log('📋 2. Recherche dans playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts').get()
  const adamPlayers = playerAccountsSnap.docs.filter(doc => {
    const data = doc.data()
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim().toLowerCase()
    const email = data.email?.toLowerCase() || ''
    return nameVariants.some(n => fullName.includes(n.toLowerCase())) ||
           (fullName.includes('adam') && fullName.includes('mohamed'))
  })
  
  if (adamPlayers.length > 0) {
    adamPlayers.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 PlayerAccount trouvé (ID: ${doc.id}):`)
      console.log(`      Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      Email: ${data.email}`)
      console.log(`      Équipe: ${data.teamName || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun playerAccount trouvé\n')
  }
  
  // 3. Rechercher dans accounts
  console.log('📋 3. Recherche dans accounts...')
  const accountsSnap = await db.collection('accounts').get()
  const adamAccounts = accountsSnap.docs.filter(doc => {
    const data = doc.data()
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim().toLowerCase()
    const email = data.email?.toLowerCase() || ''
    return nameVariants.some(n => fullName.includes(n.toLowerCase())) ||
           (fullName.includes('adam') && fullName.includes('mohamed'))
  })
  
  if (adamAccounts.length > 0) {
    adamAccounts.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 Account trouvé (ID: ${doc.id}):`)
      console.log(`      Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      Email: ${data.email}`)
      console.log(`      Rôle: ${data.role || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun account trouvé\n')
  }
  
  // 4. Rechercher dans players
  console.log('📋 4. Recherche dans players...')
  const playersSnap = await db.collection('players').get()
  const adamPlayersList = playersSnap.docs.filter(doc => {
    const data = doc.data()
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim().toLowerCase()
    const email = data.email?.toLowerCase() || ''
    return nameVariants.some(n => fullName.includes(n.toLowerCase())) ||
           (fullName.includes('adam') && fullName.includes('mohamed'))
  })
  
  if (adamPlayersList.length > 0) {
    adamPlayersList.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 Player trouvé (ID: ${doc.id}):`)
      console.log(`      Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      Email: ${data.email || 'N/A'}`)
      console.log(`      Équipe: ${data.teamName || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Aucun player trouvé\n')
  }
  
  // 5. Rechercher dans teams.players
  console.log('📋 5. Recherche dans teams.players...')
  const teamsSnap = await db.collection('teams').get()
  let foundInTeams = false
  
  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data()
    const players = teamData.players || []
    const adamInTeam = players.filter((p: any) => {
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase()
      return nameVariants.some(n => fullName.includes(n.toLowerCase())) ||
             (fullName.includes('adam') && fullName.includes('mohamed'))
    })
    
    if (adamInTeam.length > 0) {
      foundInTeams = true
      console.log(`   Équipe: ${teamData.name} (ID: ${teamDoc.id})`)
      adamInTeam.forEach((player: any) => {
        console.log(`      Nom: ${player.firstName} ${player.lastName}`)
        console.log(`      Email: ${player.email || 'N/A'}`)
      })
      console.log('')
    }
  }
  
  if (!foundInTeams) {
    console.log('   ❌ Aucun joueur trouvé dans les équipes\n')
  }
  
  // 6. Vérifier l'historique - chercher "Adam Mohamed" avec gendy051@gmail.com
  console.log('📋 6. Vérification spécifique pour gendy051@gmail.com...')
  const gendyEmail = 'gendy051@gmail.com'
  
  const gendyProfiles = await db.collection('userProfiles')
    .where('email', '==', gendyEmail)
    .get()
  
  if (!gendyProfiles.empty) {
    gendyProfiles.docs.forEach(doc => {
      const data = doc.data()
      console.log(`   📝 Profile pour ${gendyEmail}:`)
      console.log(`      Nom actuel: ${data.firstName} ${data.lastName}`)
      console.log(`      FullName: ${data.fullName}`)
      console.log(`      Username: ${data.username}`)
      console.log(`      ⚠️  AVANT: C'était "Adam Mohamed" selon le script précédent`)
      console.log('')
    })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Recherche terminée')
  console.log('\n' + '='.repeat(60))
  console.log('⚠️  CONCLUSION:')
  console.log('   Si "Adam Mohamed" était une personne différente de "Mohamed Gendy",')
  console.log('   alors j\'ai peut-être écrasé ses données en les fusionnant.')
  console.log('   Il faudrait restaurer depuis une sauvegarde ou recréer le compte.')
  console.log('\n' + '='.repeat(60))
}

findAdamMohamed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

