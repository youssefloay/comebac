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

async function verifyTeamId() {
  console.log('🔍 Vérification du teamId de Saints...\n')
  
  // 1. Vérifier l'équipe Saints
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Saints')
    .get()
  
  if (teamsSnap.empty) {
    console.error('❌ Équipe Saints non trouvée')
    return
  }
  
  const teamDoc = teamsSnap.docs[0]
  const teamId = teamDoc.id
  const teamData = teamDoc.data()
  
  console.log(`✅ Équipe Saints trouvée:`)
  console.log(`   ID: ${teamId}`)
  console.log(`   Nom: ${teamData.name}`)
  console.log(`   Nom (avec espace?): "${teamData.name}"`)
  console.log('')
  
  // 2. Vérifier les playerAccounts
  const paSnap = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  console.log(`📊 ${paSnap.size} joueurs avec teamId="${teamId}"`)
  
  // 3. Vérifier aussi par teamName
  const paByNameSnap = await db.collection('playerAccounts')
    .where('teamName', '==', 'Saints')
    .get()
  
  console.log(`📊 ${paByNameSnap.size} joueurs avec teamName="Saints"`)
  
  // 4. Vérifier les joueurs spécifiques
  const emails = ['yassinelhosseiny686@gmail.com', 'alywael304@gmail.com']
  
  console.log('\n📋 Vérification des joueurs spécifiques:\n')
  for (const email of emails) {
    const playerSnap = await db.collection('playerAccounts')
      .where('email', '==', email)
      .get()
    
    if (!playerSnap.empty) {
      const data = playerSnap.docs[0].data()
      console.log(`📝 ${data.firstName} ${data.lastName} (${email}):`)
      console.log(`   teamId: "${data.teamId}"`)
      console.log(`   teamName: "${data.teamName}"`)
      console.log(`   teamId correspond? ${data.teamId === teamId}`)
      console.log(`   teamName correspond? ${data.teamName === 'Saints' || data.teamName === 'Saints '}`)
      console.log('')
    }
  }
  
  // 5. Vérifier s'il y a un problème avec l'espace dans le nom
  const teamsWithSpace = await db.collection('teams')
    .where('name', '==', 'Saints ')
    .get()
  
  if (!teamsWithSpace.empty) {
    console.log('⚠️  Équipe "Saints " (avec espace) trouvée!')
    teamsWithSpace.docs.forEach(doc => {
      console.log(`   ID: ${doc.id}`)
      console.log(`   Nom: "${doc.data().name}"`)
    })
  }
  
  console.log('\n✅ Vérification terminée')
}

verifyTeamId()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

