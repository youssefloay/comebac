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

async function removeMarkSamirDuplicate() {
  console.log('🔧 Suppression du doublon Mark Samir (marksamir515@gmail.com)...\n')
  
  const wrongEmail = 'marksamir515@gmail.com'
  const correctEmail = 'shereef.zoumi@gmail.com'
  const teamId = '5AKP3hWyaz9iPXxb3Bxy'
  
  let removed = 0
  
  // 1. Supprimer de playerAccounts
  console.log('📋 1. Suppression de playerAccounts...')
  const paSnap = await db.collection('playerAccounts')
    .where('email', '==', wrongEmail)
    .get()
  
  for (const doc of paSnap.docs) {
    await doc.ref.delete()
    removed++
    console.log(`   ✅ Supprimé: ${doc.id}`)
  }
  
  // 2. Supprimer de players
  console.log('\n📋 2. Suppression de players...')
  const playersSnap = await db.collection('players')
    .where('email', '==', wrongEmail)
    .get()
  
  for (const doc of playersSnap.docs) {
    await doc.ref.delete()
    removed++
    console.log(`   ✅ Supprimé: ${doc.id}`)
  }
  
  // 3. Supprimer de accounts
  console.log('\n📋 3. Suppression de accounts...')
  const accountsSnap = await db.collection('accounts')
    .where('email', '==', wrongEmail)
    .get()
  
  for (const doc of accountsSnap.docs) {
    await doc.ref.delete()
    removed++
    console.log(`   ✅ Supprimé: ${doc.id}`)
  }
  
  // 4. Nettoyer teams.players (garder seulement le bon email)
  console.log('\n📋 4. Nettoyage de teams.players...')
  const teamDoc = await db.collection('teams').doc(teamId).get()
  if (teamDoc.exists) {
    const teamData = teamDoc.data()
    const players = teamData?.players || []
    
    const cleanedPlayers = players.filter((p: any) => {
      const email = p.email?.toLowerCase()?.trim()
      return email !== wrongEmail.toLowerCase()
    })
    
    if (cleanedPlayers.length !== players.length) {
      await teamDoc.ref.update({
        players: cleanedPlayers,
        updatedAt: new Date()
      })
      console.log(`   ✅ teams.players nettoyé (${players.length} → ${cleanedPlayers.length})`)
    } else {
      console.log(`   ✅ teams.players déjà propre`)
    }
  }
  
  // 5. Vérifier que le bon email est bien présent partout
  console.log('\n📋 5. Vérification du bon email...')
  const correctPASnap = await db.collection('playerAccounts')
    .where('email', '==', correctEmail)
    .get()
  
  if (correctPASnap.empty) {
    console.log(`   ⚠️  Le bon email n'est pas dans playerAccounts!`)
  } else {
    console.log(`   ✅ ${correctEmail} présent dans playerAccounts`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ\n')
  console.log(`✅ Documents supprimés: ${removed}`)
  console.log(`✅ Email conservé: ${correctEmail}`)
  console.log(`❌ Email supprimé: ${wrongEmail}`)
  console.log('\n' + '='.repeat(60))
  console.log('✅ Nettoyage terminé!')
}

removeMarkSamirDuplicate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

