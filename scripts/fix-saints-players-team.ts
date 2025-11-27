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

async function fixSaintsPlayers() {
  console.log('🔧 Correction des joueurs de Saints sans équipe...\n')
  
  const teamId = 'MHBdumu4cSU6ExLRlrrj'
  const teamName = 'Saints'
  
  // 1. Récupérer tous les joueurs de Saints depuis teams.players (source de vérité)
  const teamDoc = await db.collection('teams').doc(teamId).get()
  if (!teamDoc.exists) {
    console.error('❌ Équipe Saints non trouvée')
    return
  }
  
  const teamData = teamDoc.data()
  const teamsPlayers = teamData?.players || []
  
  console.log(`📊 ${teamsPlayers.length} joueurs dans teams.players\n`)
  
  // Créer un Set des emails valides
  const validEmails = new Set(
    teamsPlayers.map((p: any) => p.email?.toLowerCase()?.trim()).filter(Boolean)
  )
  
  console.log('📋 Emails valides dans teams.players:')
  validEmails.forEach(email => console.log(`   - ${email}`))
  console.log('')
  
  // 2. Vérifier et corriger tous les playerAccounts
  console.log('📋 Correction de playerAccounts...\n')
  let fixed = 0
  
  for (const teamPlayer of teamsPlayers) {
    const email = teamPlayer.email?.toLowerCase()?.trim()
    if (!email) continue
    
    // Chercher dans playerAccounts
    const paSnap = await db.collection('playerAccounts')
      .where('email', '==', teamPlayer.email)
      .limit(1)
      .get()
    
    if (!paSnap.empty) {
      const paDoc = paSnap.docs[0]
      const paData = paDoc.data()
      
      if (paData.teamId !== teamId || paData.teamName !== teamName) {
        console.log(`   🔧 Correction de ${paData.firstName} ${paData.lastName} (${email})...`)
        
        await paDoc.ref.update({
          teamId: teamId,
          teamName: teamName,
          updatedAt: new Date()
        })
        
        fixed++
        console.log(`      ✅ Corrigé`)
      }
    } else {
      // Créer le playerAccount s'il n'existe pas
      console.log(`   ➕ Création de playerAccount pour ${teamPlayer.firstName} ${teamPlayer.lastName} (${email})...`)
      
      const newPA: any = {
        email: teamPlayer.email,
        firstName: teamPlayer.firstName,
        lastName: teamPlayer.lastName,
        teamId: teamId,
        teamName: teamName,
        jerseyNumber: teamPlayer.number || teamPlayer.jerseyNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      if (teamPlayer.position) newPA.position = teamPlayer.position
      if (teamPlayer.birthDate) newPA.birthDate = teamPlayer.birthDate
      if (teamPlayer.height !== undefined) newPA.height = teamPlayer.height
      if (teamPlayer.foot) newPA.foot = teamPlayer.foot
      if (teamPlayer.tshirtSize) newPA.tshirtSize = teamPlayer.tshirtSize
      if (teamPlayer.grade) newPA.grade = teamPlayer.grade
      if (teamPlayer.phone) newPA.phone = teamPlayer.phone
      
      await db.collection('playerAccounts').add(newPA)
      fixed++
      console.log(`      ✅ Créé`)
    }
  }
  
  // 3. Supprimer teamId/teamName des joueurs qui ne sont plus dans teams.players
  console.log('\n📋 Nettoyage des joueurs qui ne sont plus dans Saints...\n')
  const allPA = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  let removed = 0
  for (const paDoc of allPA.docs) {
    const paData = paDoc.data()
    const email = paData.email?.toLowerCase()?.trim()
    
    if (!validEmails.has(email)) {
      console.log(`   🗑️  Retrait de ${paData.firstName} ${paData.lastName} (${email})...`)
      await paDoc.ref.update({
        teamId: null,
        teamName: null,
        updatedAt: new Date()
      })
      removed++
      console.log(`      ✅ Retiré de l'équipe`)
    }
  }
  
  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ\n')
  console.log(`✅ Joueurs corrigés/créés: ${fixed}`)
  console.log(`🗑️  Joueurs retirés de l'équipe: ${removed}`)
  console.log(`📊 Total joueurs Saints dans playerAccounts: ${(await db.collection('playerAccounts').where('teamId', '==', teamId).get()).size}`)
  console.log('\n' + '='.repeat(60))
  console.log('✅ Correction terminée!')
}

fixSaintsPlayers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

