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

async function fixTikiTakaTeamName() {
  try {
    console.log('🔧 Vérification et correction des teamName pour Tiki Taka...\n')

    const teamId = 'Pi5ejCc7TlLIw3vl8lFh'

    // 1. Vérifier l'équipe
    const teamDoc = await db.collection('teams').doc(teamId).get()
    if (!teamDoc.exists) {
      console.log('❌ Équipe Tiki Taka non trouvée')
      return
    }

    const teamData = teamDoc.data()
    const correctTeamName = teamData?.name || 'Tiki Taka'

    console.log(`✅ Équipe trouvée: ${correctTeamName}\n`)

    // 2. Vérifier et corriger playerAccounts
    const playerAccounts = await db.collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()

    console.log(`📊 ${playerAccounts.size} joueurs dans playerAccounts\n`)

    const playersToFix: any[] = []

    playerAccounts.docs.forEach(doc => {
      const data = doc.data()
      if (!data.teamName || data.teamName !== correctTeamName) {
        playersToFix.push({
          id: doc.id,
          currentTeamName: data.teamName || 'N/A',
          name: `${data.firstName} ${data.lastName}`
        })
      }
    })

    if (playersToFix.length > 0) {
      console.log(`⚠️  ${playersToFix.length} joueur(s) à corriger dans playerAccounts:`)
      playersToFix.forEach(player => {
        console.log(`   - ${player.name}`)
        console.log(`     teamName actuel: ${player.currentTeamName}`)
        console.log(`     teamName attendu: ${correctTeamName}`)
      })

      console.log(`\n🔧 Correction en cours...`)
      for (const player of playersToFix) {
        await db.collection('playerAccounts').doc(player.id).update({
          teamName: correctTeamName
        })
        console.log(`   ✅ ${player.name} corrigé`)
      }
    } else {
      console.log(`✅ Tous les joueurs ont déjà le bon teamName dans playerAccounts`)
    }

    // 3. Vérifier et corriger players (si nécessaire)
    const players = await db.collection('players')
      .where('teamId', '==', teamId)
      .get()

    console.log(`\n📊 ${players.size} joueurs dans players`)

    const playersToFixInPlayers: any[] = []

    players.docs.forEach(doc => {
      const data = doc.data()
      if (data.teamName && data.teamName !== correctTeamName) {
        playersToFixInPlayers.push({
          id: doc.id,
          currentTeamName: data.teamName,
          name: data.name || `${data.firstName} ${data.lastName}`
        })
      }
    })

    if (playersToFixInPlayers.length > 0) {
      console.log(`⚠️  ${playersToFixInPlayers.length} joueur(s) à corriger dans players:`)
      playersToFixInPlayers.forEach(player => {
        console.log(`   - ${player.name}`)
        console.log(`     teamName actuel: ${player.currentTeamName}`)
        console.log(`     teamName attendu: ${correctTeamName}`)
      })

      console.log(`\n🔧 Correction en cours...`)
      for (const player of playersToFixInPlayers) {
        await db.collection('players').doc(player.id).update({
          teamName: correctTeamName
        })
        console.log(`   ✅ ${player.name} corrigé`)
      }
    } else {
      console.log(`✅ Aucun joueur à corriger dans players`)
    }

    // 4. Vérification finale
    console.log(`\n📋 Vérification finale...`)
    const finalPlayerAccounts = await db.collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()

    const allCorrect = finalPlayerAccounts.docs.every(doc => {
      const data = doc.data()
      return data.teamName === correctTeamName
    })

    if (allCorrect) {
      console.log(`✅ Tous les joueurs de Tiki Taka ont maintenant teamName="${correctTeamName}"`)
    } else {
      console.log(`⚠️  Certains joueurs n'ont toujours pas le bon teamName`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

fixTikiTakaTeamName()
  .then(() => {
    console.log('\n✅ Correction terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

