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

async function checkEgoFc() {
  console.log('🔍 Vérification de Ego Fc...\n')
  
  const teamId = '96nQ60wYDCUru3BOJie7'
  
  // playerAccounts
  const paSnap = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  const paEmails = new Set(
    paSnap.docs.map(doc => doc.data().email?.toLowerCase()?.trim()).filter(Boolean)
  )
  
  console.log(`📊 PlayerAccounts (${paSnap.size}):`)
  paSnap.docs.forEach(doc => {
    const data = doc.data()
    console.log(`   - ${data.email} (${data.firstName} ${data.lastName})`)
  })
  
  // players
  const playersSnap = await db.collection('players')
    .where('teamId', '==', teamId)
    .get()
  
  const playersEmails = new Set(
    playersSnap.docs.map(doc => doc.data().email?.toLowerCase()?.trim()).filter(Boolean)
  )
  
  console.log(`\n📊 Players (${playersSnap.size}):`)
  playersSnap.docs.forEach(doc => {
    const data = doc.data()
    console.log(`   - ${data.email} (${data.firstName || data.name || 'N/A'})`)
  })
  
  // Différences
  const inPlayersNotInPA = Array.from(playersEmails).filter(email => !paEmails.has(email))
  
  if (inPlayersNotInPA.length > 0) {
    console.log(`\n❌ Joueurs dans players mais PAS dans playerAccounts:`)
    inPlayersNotInPA.forEach(email => {
      const playerDoc = playersSnap.docs.find(doc => 
        doc.data().email?.toLowerCase()?.trim() === email
      )
      if (playerDoc) {
        console.log(`   - ${email} (ID: ${playerDoc.id})`)
        // Supprimer
        playerDoc.ref.delete().then(() => {
          console.log(`   ✅ Supprimé`)
        })
      }
    })
  }
}

checkEgoFc()
  .then(() => {
    setTimeout(() => process.exit(0), 2000)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

