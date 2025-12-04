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

async function checkOmarSa3idStatus() {
  console.log('🔍 Vérification du statut d\'Omar Sa3id...\n')
  
  const email = 'omarhichamsaied96@gmail.com'
  const teamId = 'RTD0FOAqHOGzxjUmNq7v' // Underdogs active
  
  // Vérifier dans playerAccounts
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (!playerAccountsSnap.empty) {
    playerAccountsSnap.forEach(doc => {
      const data = doc.data()
      console.log(`✅ Omar Sa3id dans playerAccounts:`)
      console.log(`   - ID: ${doc.id}`)
      console.log(`   - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`   - Email: ${data.email}`)
      console.log(`   - teamId: ${data.teamId}`)
      console.log(`   - teamName: ${data.teamName}`)
      console.log(`   - status: ${data.status || 'NON DÉFINI'}`)
      console.log(`   - isActingCoach: ${data.isActingCoach || false}`)
      console.log(`   - uid: ${data.uid || 'NON DÉFINI'}`)
      console.log('')
      
      // Vérifier si il sera filtré
      const isCoach = data.isActingCoach === true
      const isInactive = data.status === 'inactive'
      const hasCorrectTeamId = data.teamId === teamId
      
      console.log(`📋 Analyse du filtrage:`)
      console.log(`   - isCoach: ${isCoach} ${isCoach ? '❌ SERA EXCLU' : '✅ OK'}`)
      console.log(`   - isInactive: ${isInactive} ${isInactive ? '❌ SERA EXCLU' : '✅ OK'}`)
      console.log(`   - hasCorrectTeamId: ${hasCorrectTeamId} ${hasCorrectTeamId ? '✅ OK' : '❌ MAUVAIS TEAMID'}`)
      console.log('')
    })
  }
  
  // Vérifier tous les joueurs de Underdogs dans playerAccounts
  console.log(`📋 Tous les joueurs de Underdogs (teamId: ${teamId}) dans playerAccounts:`)
  const underdogsPlayersSnap = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  console.log(`   📊 ${underdogsPlayersSnap.size} joueur(s) trouvé(s)\n`)
  
  let activeCount = 0
  let inactiveCount = 0
  let coachCount = 0
  
  underdogsPlayersSnap.docs.forEach((doc, index) => {
    const data = doc.data()
    const isCoach = data.isActingCoach === true
    const isInactive = data.status === 'inactive'
    const willBeIncluded = !isCoach && !isInactive
    
    if (isCoach) coachCount++
    if (isInactive) inactiveCount++
    if (willBeIncluded) activeCount++
    
    const isOmar = data.email?.toLowerCase() === email.toLowerCase()
    const statusIcon = willBeIncluded ? '✅' : '❌'
    
    console.log(`   ${index + 1}. ${statusIcon} ${data.firstName} ${data.lastName} (${data.email})`)
    if (isOmar) {
      console.log(`      ⭐ C'EST OMAR SA3ID`)
    }
    console.log(`      - status: ${data.status || 'NON DÉFINI'} ${isInactive ? '❌ INACTIF' : ''}`)
    console.log(`      - isActingCoach: ${data.isActingCoach || false} ${isCoach ? '❌ COACH' : ''}`)
    console.log(`      - Sera inclus: ${willBeIncluded ? '✅ OUI' : '❌ NON'}`)
    console.log('')
  })
  
  console.log(`📊 Résumé:`)
  console.log(`   - Joueurs actifs (seront inclus): ${activeCount}`)
  console.log(`   - Joueurs inactifs (seront exclus): ${inactiveCount}`)
  console.log(`   - Coaches (seront exclus): ${coachCount}`)
  
  console.log('\n✅ Vérification terminée')
}

checkOmarSa3idStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })



