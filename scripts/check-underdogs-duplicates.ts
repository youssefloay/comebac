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

async function checkUnderdogsDuplicates() {
  console.log('🔍 Vérification des équipes Underdogs...\n')
  
  // Chercher toutes les équipes Underdogs
  const underdogsSnap = await db.collection('teams')
    .where('name', '==', 'Underdogs')
    .get()
  
  console.log(`📊 ${underdogsSnap.size} équipe(s) "Underdogs" trouvée(s)\n`)
  
  underdogsSnap.docs.forEach((doc, index) => {
    const teamData = doc.data()
    console.log(`${'='.repeat(60)}`)
    console.log(`📋 Underdogs #${index + 1}:`)
    console.log(`   - ID: ${doc.id}`)
    console.log(`   - Nom: ${teamData.name}`)
    console.log(`   - isActive: ${teamData.isActive}`)
    console.log(`   - Nombre de joueurs dans teams.players: ${(teamData.players || []).length}`)
    console.log(`   - Joueurs:`)
    ;(teamData.players || []).forEach((player: any, idx: number) => {
      console.log(`      ${idx + 1}. ${player.firstName} ${player.lastName} (${player.email || 'N/A'})`)
    })
    console.log('')
  })
  
  // Vérifier dans playerAccounts
  console.log(`📋 Joueurs dans playerAccounts avec teamName="Underdogs":`)
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('teamName', '==', 'Underdogs')
    .get()
  
  console.log(`   📊 ${playerAccountsSnap.size} joueur(s) trouvé(s)`)
  playerAccountsSnap.docs.forEach((doc, index) => {
    const data = doc.data()
    console.log(`   ${index + 1}. ${data.firstName} ${data.lastName} (${data.email})`)
    console.log(`      - teamId: ${data.teamId || '❌ MANQUANT'}`)
    console.log('')
  })
  
  // Vérifier les teamId utilisés
  const teamIds = new Set<string>()
  playerAccountsSnap.docs.forEach(doc => {
    const teamId = doc.data().teamId
    if (teamId) teamIds.add(teamId)
  })
  
  console.log(`📋 teamId utilisés dans playerAccounts:`)
  teamIds.forEach(teamId => {
    const teamDoc = underdogsSnap.docs.find(d => d.id === teamId)
    if (teamDoc) {
      console.log(`   - ${teamId}: ${teamDoc.data().name} (${teamDoc.data().isActive ? 'Active' : 'Archivée'})`)
    } else {
      console.log(`   - ${teamId}: ❌ Équipe non trouvée`)
    }
  })
  
  console.log('\n✅ Vérification terminée')
}

checkUnderdogsDuplicates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })





