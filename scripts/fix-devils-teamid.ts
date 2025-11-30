import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialiser Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error('❌ Variables d\'environnement Firebase manquantes')
    process.exit(1)
  }

  initializeApp({
    credential: cert(serviceAccount)
  })
}

const db = getFirestore()

async function fixDevilsTeamId() {
  try {
    console.log('🔍 Vérification et correction de l\'équipe Devils...\n')

    // 1. Trouver l'équipe Devils
    const teamsQuery = await db.collection('teams')
      .where('name', '==', 'Devils')
      .get()

    if (teamsQuery.empty) {
      console.log('❌ Aucune équipe Devils trouvée')
      return
    }

    const devilsTeam = teamsQuery.docs[0]
    const teamId = devilsTeam.id
    const teamData = devilsTeam.data()

    console.log(`✅ Équipe Devils trouvée:`)
    console.log(`   ID: ${teamId}`)
    console.log(`   Nom: ${teamData.name}\n`)

    // 2. Trouver tous les playerAccounts avec teamName="Devils" mais teamId incorrect
    const playerAccountsByName = await db.collection('playerAccounts')
      .where('teamName', '==', 'Devils')
      .get()

    console.log(`📊 Joueurs avec teamName="Devils": ${playerAccountsByName.size}`)

    const playersToFix: any[] = []

    playerAccountsByName.docs.forEach(doc => {
      const data = doc.data()
      if (data.teamId !== teamId) {
        playersToFix.push({
          id: doc.id,
          currentTeamId: data.teamId,
          name: `${data.firstName} ${data.lastName}`,
          email: data.email
        })
      }
    })

    if (playersToFix.length === 0) {
      console.log('✅ Tous les joueurs ont déjà le bon teamId\n')
    } else {
      console.log(`\n⚠️  ${playersToFix.length} joueur(s) à corriger:`)
      playersToFix.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.name} (${player.email})`)
        console.log(`      teamId actuel: ${player.currentTeamId}`)
        console.log(`      teamId attendu: ${teamId}`)
      })

      console.log(`\n🔧 Correction en cours...`)
      
      for (const player of playersToFix) {
        await db.collection('playerAccounts').doc(player.id).update({
          teamId: teamId
        })
        console.log(`   ✅ ${player.name} corrigé`)
      }

      console.log(`\n✅ ${playersToFix.length} joueur(s) corrigé(s)`)
    }

    // 3. Vérifier aussi les joueurs dans la collection players
    const playersQuery = await db.collection('players')
      .where('teamId', '==', teamId)
      .get()

    console.log(`\n📊 Joueurs dans players avec teamId="${teamId}": ${playersQuery.size}`)

    // 4. Vérifier les playerAccounts avec le bon teamId
    const playerAccountsByTeamId = await db.collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()

    console.log(`📊 Joueurs dans playerAccounts avec teamId="${teamId}": ${playerAccountsByTeamId.size}`)

    // 5. Mettre à jour teamName pour tous les joueurs
    const playersToUpdateTeamName: any[] = []

    playerAccountsByTeamId.docs.forEach(doc => {
      const data = doc.data()
      if (!data.teamName || data.teamName !== 'Devils') {
        playersToUpdateTeamName.push({
          id: doc.id,
          name: `${data.firstName} ${data.lastName}`,
          currentTeamName: data.teamName || 'N/A'
        })
      }
    })

    if (playersToUpdateTeamName.length > 0) {
      console.log(`\n⚠️  ${playersToUpdateTeamName.length} joueur(s) sans teamName="Devils":`)
      playersToUpdateTeamName.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.name}`)
        console.log(`      teamName actuel: ${player.currentTeamName}`)
      })

      console.log(`\n🔧 Mise à jour du teamName...`)
      
      for (const player of playersToUpdateTeamName) {
        await db.collection('playerAccounts').doc(player.id).update({
          teamName: 'Devils'
        })
        console.log(`   ✅ ${player.name} mis à jour`)
      }

      console.log(`\n✅ ${playersToUpdateTeamName.length} joueur(s) mis à jour`)
    } else {
      console.log(`\n✅ Tous les joueurs ont déjà teamName="Devils"`)
    }

    // 6. Vérifier les mises à jour en récupérant à nouveau les données
    const playerAccountsAfterUpdate = await db.collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()

    console.log(`\n📋 Liste complète des joueurs de Devils (après mise à jour):`)
    const playersAfterUpdate = playerAccountsAfterUpdate.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    playersAfterUpdate.forEach((player: any, index: number) => {
      console.log(`   ${index + 1}. ${player.firstName} ${player.lastName} (${player.nickname || 'pas de surnom'})`)
      console.log(`      - Email: ${player.email}`)
      console.log(`      - teamId: ${player.teamId}`)
      console.log(`      - teamName: ${player.teamName || 'N/A'} ${player.teamName === 'Devils' ? '✅' : '❌'}`)
    })

    // Vérifier combien ont teamName="Devils"
    const withTeamName = playersAfterUpdate.filter((p: any) => p.teamName === 'Devils')
    console.log(`\n✅ ${withTeamName.length}/${playersAfterUpdate.length} joueurs ont teamName="Devils"`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

fixDevilsTeamId()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

