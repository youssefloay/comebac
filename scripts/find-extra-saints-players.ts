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

async function findExtraPlayers() {
  console.log('🔍 Recherche des joueurs en trop dans Saints...\n')
  
  const teamId = 'MHBdumu4cSU6ExLRlrrj'
  
  // 1. Récupérer teams.players (source de vérité)
  const teamDoc = await db.collection('teams').doc(teamId).get()
  const teamData = teamDoc.data()
  const teamsPlayers = teamData?.players || []
  
  const validEmails = new Set(
    teamsPlayers.map((p: any) => p.email?.toLowerCase()?.trim()).filter(Boolean)
  )
  
  console.log(`📊 ${validEmails.size} joueurs valides dans teams.players\n`)
  
  // 2. Récupérer tous les playerAccounts avec teamId="Saints"
  const allPA = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  console.log(`📊 ${allPA.size} joueurs dans playerAccounts avec teamId="Saints"\n`)
  
  // 3. Trouver les joueurs en trop
  const extraPlayers: any[] = []
  
  allPA.docs.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    
    if (email && !validEmails.has(email)) {
      extraPlayers.push({
        id: doc.id,
        email: data.email,
        name: `${data.firstName} ${data.lastName}`
      })
    }
  })
  
  if (extraPlayers.length > 0) {
    console.log(`❌ ${extraPlayers.length} joueur(s) en trop dans playerAccounts:\n`)
    extraPlayers.forEach(p => {
      console.log(`   - ${p.name} (${p.email})`)
      console.log(`     ID: ${p.id}`)
    })
    
    console.log('\n💡 Ces joueurs seront retirés de l\'équipe Saints')
  } else {
    console.log('✅ Aucun joueur en trop')
  }
  
  console.log('\n✅ Vérification terminée')
}

findExtraPlayers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

