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

async function fixRisingVIIUserProfiles() {
  console.log('🔧 Création des userProfiles manquants pour Rising VII...\n')
  
  const teamName = 'Rising VII'
  
  // 1. Trouver l'équipe
  const teamsSnap = await db.collection('teams')
    .where('name', '==', teamName)
    .get()
  
  if (teamsSnap.empty) {
    console.error('❌ Équipe Rising VII non trouvée')
    return
  }
  
  const teamDoc = teamsSnap.docs[0]
  const teamId = teamDoc.id
  const teamPlayers = teamDoc.data().players || []
  
  console.log(`✅ Équipe trouvée: ${teamName} (ID: ${teamId})`)
  console.log(`📊 Nombre de joueurs: ${teamPlayers.length}\n`)
  
  let created = 0
  let updated = 0
  let skipped = 0
  
  // 2. Pour chaque joueur, créer/mettre à jour userProfile
  for (let i = 0; i < teamPlayers.length; i++) {
    const teamPlayer = teamPlayers[i]
    const email = teamPlayer.email
    
    if (!email) {
      console.log(`⚠️  Joueur ${i + 1}: Pas d'email, ignoré`)
      skipped++
      continue
    }
    
    const firstName = teamPlayer.firstName || ''
    const lastName = teamPlayer.lastName || ''
    const fullName = `${firstName} ${lastName}`.trim()
    const username = email.split('@')[0] // Générer username depuis email
    
    console.log(`📋 Joueur ${i + 1}/${teamPlayers.length}: ${fullName}`)
    console.log(`   Email: ${email}`)
    
    // Vérifier si userProfile existe déjà
    const existingProfiles = await db.collection('userProfiles')
      .where('email', '==', email)
      .get()
    
    // Récupérer l'UID depuis playerAccounts
    const playerAccountsSnap = await db.collection('playerAccounts')
      .where('email', '==', email)
      .limit(1)
      .get()
    
    let uid = null
    if (!playerAccountsSnap.empty) {
      uid = playerAccountsSnap.docs[0].data().uid || playerAccountsSnap.docs[0].id
    }
    
    if (!uid) {
      // Si pas d'UID, utiliser l'ID du playerAccount ou générer
      uid = playerAccountsSnap.empty ? null : playerAccountsSnap.docs[0].id
    }
    
    const profileData: any = {
      email: email,
      firstName: firstName,
      lastName: lastName,
      fullName: fullName,
      username: username,
      role: 'player',
      phone: teamPlayer.phone || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    if (uid) {
      profileData.uid = uid
    }
    
    if (existingProfiles.empty) {
      // Créer nouveau userProfile
      await db.collection('userProfiles').add(profileData)
      console.log(`   ✅ userProfile créé (username: ${username})`)
      created++
    } else {
      // Mettre à jour userProfile existant
      const existingDoc = existingProfiles.docs[0]
      await existingDoc.ref.update({
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        username: username,
        role: 'player',
        updatedAt: new Date()
      })
      console.log(`   ✅ userProfile mis à jour (username: ${username})`)
      updated++
    }
    
    console.log('')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Correction terminée!')
  console.log(`   Créés: ${created}`)
  console.log(`   Mis à jour: ${updated}`)
  console.log(`   Ignorés: ${skipped}`)
  console.log('\n' + '='.repeat(60))
}

fixRisingVIIUserProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

