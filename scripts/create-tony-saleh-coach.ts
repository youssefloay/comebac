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

async function createTonySalehCoach() {
  console.log('🔧 Création de l\'entrée coach pour Tony Saleh...\n')
  
  const email = 'tonysaleh2500@outlook.com'
  const teamName = 'Mangoz FC'
  
  // 1. Trouver l'équipe Mangoz FC
  const teamsSnap = await db.collection('teams')
    .where('name', '==', teamName)
    .get()
  
  if (teamsSnap.empty) {
    console.error('❌ Équipe Mangoz FC non trouvée')
    return
  }
  
  const teamDoc = teamsSnap.docs[0]
  const teamId = teamDoc.id
  const teamData = teamDoc.data()
  
  console.log(`✅ Équipe trouvée: ${teamName} (ID: ${teamId})\n`)
  
  // 2. Récupérer les données depuis accounts ou userProfiles
  const accountsSnap = await db.collection('accounts')
    .where('email', '==', email)
    .limit(1)
    .get()
  
  let firstName = 'Tony'
  let lastName = 'Saleh'
  let uid = accountsSnap.empty ? null : accountsSnap.docs[0].id
  
  if (!accountsSnap.empty) {
    const accountData = accountsSnap.docs[0].data()
    firstName = accountData.firstName || firstName
    lastName = accountData.lastName || lastName
  }
  
  // 3. Vérifier si coachAccount existe déjà
  const existingCoachSnap = await db.collection('coachAccounts')
    .where('email', '==', email)
    .limit(1)
    .get()
  
  if (!existingCoachSnap.empty) {
    console.log('✅ CoachAccount existe déjà')
    const coachData = existingCoachSnap.docs[0].data()
    console.log(`   ID: ${existingCoachSnap.docs[0].id}`)
    console.log(`   Équipe: ${coachData.teamName || 'N/A'}`)
    
    // Mettre à jour si nécessaire
    if (coachData.teamId !== teamId) {
      await existingCoachSnap.docs[0].ref.update({
        teamId: teamId,
        teamName: teamName,
        updatedAt: new Date()
      })
      console.log('   ✅ Équipe mise à jour')
    }
    return
  }
  
  // 4. Créer le coachAccount
  console.log('📝 Création du coachAccount...')
  const newCoach: any = {
    email: email,
    firstName: firstName,
    lastName: lastName,
    teamId: teamId,
    teamName: teamName,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  if (uid) newCoach.uid = uid
  
  await db.collection('coachAccounts').add(newCoach)
  console.log('   ✅ CoachAccount créé')
  
  // 5. Mettre à jour accounts avec les données coach
  if (!accountsSnap.empty) {
    const accountDoc = accountsSnap.docs[0]
    await accountDoc.ref.update({
      role: 'coach',
      teamId: teamId,
      teamName: teamName,
      updatedAt: new Date()
    })
    console.log('   ✅ Account mis à jour')
  }
  
  // 6. Mettre à jour teams.coach
  if (teamData.coach?.email !== email) {
    await teamDoc.ref.update({
      coach: {
        firstName: firstName,
        lastName: lastName,
        email: email
      },
      updatedAt: new Date()
    })
    console.log('   ✅ teams.coach mis à jour')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Tony Saleh configuré comme coach de Mangoz FC!')
  console.log('\n' + '='.repeat(60))
}

createTonySalehCoach()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

