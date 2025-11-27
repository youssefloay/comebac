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

async function checkAllSources() {
  console.log('🔍 Vérification complète de tous les joueurs RTG...\n')
  
  const teamId = '6HKmkOQEhvZqAfOt1cGT'
  const teamName = 'Road To Glory'
  
  // 1. teamRegistrations
  console.log('📋 1. teamRegistrations:')
  const regSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', teamName)
    .get()
  
  if (!regSnap.empty) {
    const regData = regSnap.docs[0].data()
    const regPlayers = regData.players || []
    console.log(`   📊 ${regPlayers.length} joueurs dans teamRegistrations`)
    console.log(`   📝 Liste:`)
    regPlayers.forEach((p: any, i: number) => {
      console.log(`      ${i + 1}. ${p.firstName} ${p.lastName} (${p.email || p.nickname || 'N/A'}) - #${p.jerseyNumber || p.number || 'N/A'}`)
    })
  }
  
  // 2. playerAccounts
  console.log('\n📋 2. playerAccounts:')
  const paSnap = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  const paEmails = new Set<string>()
  console.log(`   📊 ${paSnap.size} joueurs dans playerAccounts`)
  console.log(`   📝 Liste:`)
  paSnap.docs.forEach((doc, i) => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (email) paEmails.add(email)
    console.log(`      ${i + 1}. ${data.firstName} ${data.lastName} (${data.email || 'N/A'}) - #${data.jerseyNumber || data.number || 'N/A'}`)
  })
  
  // 3. Comparer avec teamRegistrations
  if (!regSnap.empty) {
    const regData = regSnap.docs[0].data()
    const regPlayers = regData.players || []
    
    console.log('\n📊 Comparaison teamRegistrations vs playerAccounts:')
    const missingInPA: any[] = []
    
    regPlayers.forEach((regPlayer: any) => {
      const regEmail = regPlayer.email?.toLowerCase()?.trim()
      if (regEmail && !paEmails.has(regEmail)) {
        missingInPA.push(regPlayer)
      }
    })
    
    if (missingInPA.length > 0) {
      console.log(`\n❌ ${missingInPA.length} joueur(s) dans teamRegistrations mais PAS dans playerAccounts:`)
      missingInPA.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.firstName} ${p.lastName} (${p.email || p.nickname || 'N/A'})`)
      })
    } else {
      console.log('✅ Tous les joueurs de teamRegistrations sont dans playerAccounts')
    }
  }
  
  console.log('\n✅ Vérification terminée')
}

checkAllSources()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

