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

async function checkOmarSa3idTransfer() {
  console.log('🔍 Vérification du transfert d\'Omar Sa3id...\n')
  
  const email = 'omarhichamsaied96@gmail.com'
  const firstName = 'Omar'
  const lastName = 'Sa3id'
  
  // 1. Vérifier dans playerAccounts
  console.log('📋 1. playerAccounts:')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (!playerAccountsSnap.empty) {
    playerAccountsSnap.forEach(doc => {
      const data = doc.data()
      console.log(`✅ Omar Sa3id trouvé dans playerAccounts:`)
      console.log(`   - ID: ${doc.id}`)
      console.log(`   - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`   - Email: ${data.email}`)
      console.log(`   - teamId: ${data.teamId || '❌ MANQUANT'}`)
      console.log(`   - teamName: ${data.teamName || '❌ MANQUANT'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Omar Sa3id non trouvé dans playerAccounts')
    console.log('')
  }
  
  // 2. Vérifier dans Underdogs
  console.log('📋 2. Équipe Underdogs:')
  const underdogsSnap = await db.collection('teams')
    .where('name', '==', 'Underdogs')
    .get()
  
  if (!underdogsSnap.empty) {
    underdogsSnap.forEach(doc => {
      const teamData = doc.data()
      console.log(`✅ Underdogs trouvée:`)
      console.log(`   - ID: ${doc.id}`)
      console.log(`   - Nom: ${teamData.name}`)
      console.log(`   - Nombre de joueurs dans teams.players: ${(teamData.players || []).length}`)
      
      const omarInTeam = (teamData.players || []).find((p: any) => 
        p.email?.toLowerCase() === email.toLowerCase() ||
        (p.firstName?.toLowerCase() === firstName.toLowerCase() && 
         p.lastName?.toLowerCase() === lastName.toLowerCase())
      )
      
      if (omarInTeam) {
        console.log(`   ✅ Omar Sa3id trouvé dans teams.players`)
        console.log(`      - Email: ${omarInTeam.email || 'N/A'}`)
        console.log(`      - Nom: ${omarInTeam.firstName} ${omarInTeam.lastName}`)
      } else {
        console.log(`   ❌ Omar Sa3id NON trouvé dans teams.players`)
      }
      console.log('')
    })
  } else {
    console.log('   ❌ Équipe Underdogs non trouvée')
    console.log('')
  }
  
  // 3. Vérifier dans Icons (ancienne équipe)
  console.log('📋 3. Équipe Icons (ancienne équipe):')
  const iconsSnap = await db.collection('teams')
    .where('name', '==', 'Icons')
    .get()
  
  if (!iconsSnap.empty) {
    iconsSnap.forEach(doc => {
      const teamData = doc.data()
      console.log(`✅ Icons trouvée:`)
      console.log(`   - ID: ${doc.id}`)
      console.log(`   - Nom: ${teamData.name}`)
      console.log(`   - Nombre de joueurs dans teams.players: ${(teamData.players || []).length}`)
      
      const omarInIcons = (teamData.players || []).find((p: any) => 
        p.email?.toLowerCase() === email.toLowerCase() ||
        (p.firstName?.toLowerCase() === firstName.toLowerCase() && 
         p.lastName?.toLowerCase() === lastName.toLowerCase())
      )
      
      if (omarInIcons) {
        console.log(`   ⚠️  Omar Sa3id EST ENCORE dans teams.players de Icons!`)
        console.log(`      - Email: ${omarInIcons.email || 'N/A'}`)
        console.log(`      - Nom: ${omarInIcons.firstName} ${omarInIcons.lastName}`)
      } else {
        console.log(`   ✅ Omar Sa3id n'est plus dans teams.players de Icons`)
      }
      console.log('')
    })
  } else {
    console.log('   ❌ Équipe Icons non trouvée')
    console.log('')
  }
  
  // 4. Vérifier tous les joueurs de Underdogs dans playerAccounts
  if (!underdogsSnap.empty) {
    const underdogsId = underdogsSnap.docs[0].id
    console.log(`📋 4. Tous les joueurs de Underdogs dans playerAccounts (teamId: ${underdogsId}):`)
    const underdogsPlayersSnap = await db.collection('playerAccounts')
      .where('teamId', '==', underdogsId)
      .get()
    
    console.log(`   📊 ${underdogsPlayersSnap.size} joueur(s) trouvé(s)`)
    underdogsPlayersSnap.docs.forEach((doc, index) => {
      const data = doc.data()
      const isOmar = data.email?.toLowerCase() === email.toLowerCase()
      console.log(`   ${index + 1}. ${data.firstName} ${data.lastName} (${data.email})`)
      console.log(`      - teamName: ${data.teamName || '❌ MANQUANT'}`)
      if (isOmar) {
        console.log(`      ⭐ C'EST OMAR SA3ID`)
      }
      console.log('')
    })
  }
  
  console.log('\n✅ Vérification terminée')
}

checkOmarSa3idTransfer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })



