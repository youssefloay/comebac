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

async function checkSaintsPlayers() {
  console.log('🔍 Vérification des joueurs de Saints sans équipe...\n')
  
  const teamId = 'MHBdumu4cSU6ExLRlrrj'
  const teamName = 'Saints'
  
  // Emails des joueurs de Saints qu'on voit dans l'image
  const saintsEmails = [
    'danywassim12@gmail.com', // Dodo Dodo
    'yassinelhosseiny686@gmail.com', // Hosseiny Yassin
    'alywael304@gmail.com' // Saadany Aly
  ]
  
  console.log('📋 Vérification dans playerAccounts:\n')
  
  for (const email of saintsEmails) {
    const paSnap = await db.collection('playerAccounts')
      .where('email', '==', email)
      .get()
    
    if (!paSnap.empty) {
      const data = paSnap.docs[0].data()
      console.log(`📝 ${data.firstName} ${data.lastName} (${email}):`)
      console.log(`   teamId: ${data.teamId || 'MANQUANT'}`)
      console.log(`   teamName: ${data.teamName || 'MANQUANT'}`)
      
      if (!data.teamId || data.teamId !== teamId) {
        console.log(`   ❌ PROBLÈME: Pas dans l'équipe Saints!`)
      } else {
        console.log(`   ✅ OK`)
      }
      console.log('')
    } else {
      console.log(`❌ ${email} non trouvé dans playerAccounts\n`)
    }
  }
  
  // Vérifier tous les joueurs de Saints
  console.log('\n📋 Tous les joueurs de Saints dans playerAccounts:\n')
  const allSaintsPA = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  console.log(`✅ ${allSaintsPA.size} joueurs avec teamId="Saints"`)
  allSaintsPA.docs.forEach(doc => {
    const data = doc.data()
    console.log(`   - ${data.firstName} ${data.lastName} (${data.email})`)
  })
  
  // Vérifier les joueurs sans équipe qui devraient être dans Saints
  console.log('\n📋 Joueurs sans équipe qui devraient être dans Saints:\n')
  const noTeamPA = await db.collection('playerAccounts')
    .where('teamId', '==', null)
    .get()
  
  const saintsPlayersWithoutTeam = noTeamPA.docs.filter(doc => {
    const data = doc.data()
    return saintsEmails.includes(data.email?.toLowerCase()?.trim())
  })
  
  if (saintsPlayersWithoutTeam.length > 0) {
    console.log(`❌ ${saintsPlayersWithoutTeam.length} joueur(s) de Saints sans équipe:`)
    saintsPlayersWithoutTeam.forEach(doc => {
      const data = doc.data()
      console.log(`   - ${data.firstName} ${data.lastName} (${data.email})`)
    })
  } else {
    console.log('✅ Aucun joueur de Saints sans équipe trouvé')
  }
  
  // Vérifier aussi par teamName
  console.log('\n📋 Joueurs avec teamName="Saints" mais sans teamId:\n')
  const byTeamName = await db.collection('playerAccounts')
    .where('teamName', '==', teamName)
    .get()
  
  const withoutTeamId = byTeamName.docs.filter(doc => {
    const data = doc.data()
    return !data.teamId || data.teamId !== teamId
  })
  
  if (withoutTeamId.length > 0) {
    console.log(`❌ ${withoutTeamId.length} joueur(s) avec teamName="Saints" mais mauvais teamId:`)
    withoutTeamId.forEach(doc => {
      const data = doc.data()
      console.log(`   - ${data.firstName} ${data.lastName} (${data.email})`)
      console.log(`     teamId actuel: ${data.teamId || 'null'}`)
    })
  }
  
  console.log('\n✅ Vérification terminée')
}

checkSaintsPlayers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

