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

async function checkBothPlayers() {
  console.log('🔍 Vérification de John George et Ramy John...\n')
  
  const teamId = '96nQ60wYDCUru3BOJie7'
  const teamName = 'Ego Fc'
  
  // 1. Vérifier teamRegistrations
  console.log('📋 1. teamRegistrations:')
  const regSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', teamName)
    .get()
  
  if (!regSnap.empty) {
    const regData = regSnap.docs[0].data()
    const players = regData.players || []
    
    console.log(`   📊 ${players.length} joueurs dans l'inscription\n`)
    
    const johnGeorge = players.find((p: any) => 
      p.firstName === 'John' && p.lastName === 'George'
    )
    
    const ramyJohn = players.find((p: any) => 
      p.firstName === 'Ramy' && p.lastName === 'John'
    )
    
    if (johnGeorge) {
      console.log('   📝 John George:')
      console.log(`      Prénom: ${johnGeorge.firstName}`)
      console.log(`      Nom: ${johnGeorge.lastName}`)
      console.log(`      Email: ${johnGeorge.email || 'MANQUANT'}`)
      console.log(`      Nickname: ${johnGeorge.nickname || 'N/A'}`)
      console.log(`      Numéro: ${johnGeorge.jerseyNumber || johnGeorge.number || 'N/A'}`)
      console.log('')
    }
    
    if (ramyJohn) {
      console.log('   📝 Ramy John:')
      console.log(`      Prénom: ${ramyJohn.firstName}`)
      console.log(`      Nom: ${ramyJohn.lastName}`)
      console.log(`      Email: ${ramyJohn.email || 'MANQUANT'}`)
      console.log(`      Nickname: ${ramyJohn.nickname || 'N/A'}`)
      console.log(`      Numéro: ${ramyJohn.jerseyNumber || ramyJohn.number || 'N/A'}`)
      console.log('')
    }
  }
  
  // 2. Vérifier playerAccounts
  console.log('📋 2. playerAccounts:')
  const paSnap = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  console.log(`   📊 ${paSnap.size} joueurs dans playerAccounts\n`)
  
  paSnap.docs.forEach(doc => {
    const data = doc.data()
    const firstName = data.firstName?.toLowerCase()
    const lastName = data.lastName?.toLowerCase()
    
    if ((firstName === 'john' && lastName === 'george') ||
        (firstName === 'ramy' && lastName === 'john')) {
      console.log(`   📝 ${data.firstName} ${data.lastName}:`)
      console.log(`      Email: ${data.email || 'MANQUANT'}`)
      console.log(`      Numéro: ${data.jerseyNumber || data.number || 'N/A'}`)
      console.log('')
    }
  })
  
  // 3. Vérifier teams.players
  console.log('📋 3. teams.players:')
  const teamDoc = await db.collection('teams').doc(teamId).get()
  if (teamDoc.exists) {
    const teamData = teamDoc.data()
    const players = teamData?.players || []
    
    console.log(`   📊 ${players.length} joueurs dans teams.players\n`)
    
    players.forEach((player: any) => {
      const firstName = player.firstName?.toLowerCase()
      const lastName = player.lastName?.toLowerCase()
      
      if ((firstName === 'john' && lastName === 'george') ||
          (firstName === 'ramy' && lastName === 'john')) {
        console.log(`   📝 ${player.firstName} ${player.lastName}:`)
        console.log(`      Email: ${player.email || 'MANQUANT'}`)
        console.log(`      Numéro: ${player.number || player.jerseyNumber || 'N/A'}`)
        console.log('')
      }
    })
  }
  
  console.log('✅ Vérification terminée')
}

checkBothPlayers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

