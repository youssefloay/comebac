import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('❌ Variables d\'environnement Firebase manquantes')
  process.exit(1)
}

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
}

initializeApp(firebaseConfig)
const db = getFirestore()

interface PlayerReference {
  email: string
  firstName?: string
  lastName?: string
  nickname?: string
  jerseyNumber?: string | number
  id?: string
}

async function cleanupDeletedPlayers() {
  console.log('🧹 Début du nettoyage des joueurs supprimés...\n')

  try {
    // 1. Récupérer tous les playerAccounts (joueurs actifs)
    const playerAccountsSnap = await db.collection('playerAccounts').get()
    const activePlayerEmails = new Set<string>()
    const activePlayerKeys = new Set<string>() // Pour les joueurs sans email
    
    playerAccountsSnap.docs.forEach(doc => {
      const data = doc.data()
      const email = (data.email || '').toLowerCase().trim()
      if (email) {
        activePlayerEmails.add(email)
      } else {
        // Clé pour les joueurs sans email
        const nameKey = `${(data.firstName || '').toLowerCase()}_${(data.lastName || '').toLowerCase()}_${data.jerseyNumber || data.number || ''}`
        if (nameKey !== '__') {
          activePlayerKeys.add(nameKey)
        }
      }
    })

    console.log(`✅ ${activePlayerEmails.size} joueurs actifs avec email`)
    console.log(`✅ ${activePlayerKeys.size} joueurs actifs sans email\n`)

    // 2. Nettoyer teams.players
    console.log('📋 Nettoyage de teams.players...')
    const teamsSnap = await db.collection('teams').get()
    let teamsCleaned = 0
    let playersRemovedFromTeams = 0

    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      if (!teamData.players || !Array.isArray(teamData.players)) {
        continue
      }

      const originalLength = teamData.players.length
      const cleanedPlayers = teamData.players.filter((player: PlayerReference) => {
        const email = (player.email || '').toLowerCase().trim()
        if (email) {
          return activePlayerEmails.has(email)
        } else {
          // Pour les joueurs sans email, vérifier par nom
          const nameKey = `${(player.firstName || '').toLowerCase()}_${(player.lastName || '').toLowerCase()}_${player.jerseyNumber || player.number || ''}`
          return nameKey !== '__' && activePlayerKeys.has(nameKey)
        }
      })

      if (cleanedPlayers.length < originalLength) {
        await teamDoc.ref.update({ players: cleanedPlayers })
        const removed = originalLength - cleanedPlayers.length
        playersRemovedFromTeams += removed
        teamsCleaned++
        console.log(`  ✅ ${teamData.name || teamDoc.id}: ${removed} joueur(s) supprimé(s)`)
      }
    }

    console.log(`✅ ${teamsCleaned} équipe(s) nettoyée(s), ${playersRemovedFromTeams} joueur(s) supprimé(s) de teams.players\n`)

    // 3. NE PAS nettoyer teamRegistrations.players (historique des inscriptions à conserver)
    console.log('📋 teamRegistrations.players conservé (historique des inscriptions)\n')

    // 4. Supprimer les joueurs de la collection players qui n'existent pas dans playerAccounts
    console.log('📋 Nettoyage de la collection players...')
    const playersSnap = await db.collection('players').get()
    let playersDeleted = 0
    const playersToDelete: string[] = []

    for (const playerDoc of playersSnap.docs) {
      const playerData = playerDoc.data()
      const email = (playerData.email || '').toLowerCase().trim()
      
      let shouldDelete = false
      if (email) {
        shouldDelete = !activePlayerEmails.has(email)
      } else {
        const nameKey = `${(playerData.firstName || '').toLowerCase()}_${(playerData.lastName || '').toLowerCase()}_${playerData.jerseyNumber || playerData.number || ''}`
        shouldDelete = nameKey === '__' || !activePlayerKeys.has(nameKey)
      }

      if (shouldDelete) {
        playersToDelete.push(playerDoc.id)
        console.log(`  🗑️  ${playerData.firstName || ''} ${playerData.lastName || ''} (${email || 'sans email'})`)
      }
    }

    // Supprimer par batch
    const batchSize = 500
    for (let i = 0; i < playersToDelete.length; i += batchSize) {
      const batch = db.batch()
      const batchIds = playersToDelete.slice(i, i + batchSize)
      
      for (const playerId of batchIds) {
        batch.delete(db.collection('players').doc(playerId))
      }
      
      await batch.commit()
      playersDeleted += batchIds.length
      console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: ${batchIds.length} joueur(s) supprimé(s)`)
    }

    console.log(`✅ ${playersDeleted} joueur(s) supprimé(s) de la collection players\n`)

    // Résumé
    console.log('📊 RÉSUMÉ DU NETTOYAGE:')
    console.log(`  • Équipes nettoyées: ${teamsCleaned}`)
    console.log(`  • Joueurs retirés de teams.players: ${playersRemovedFromTeams}`)
    console.log(`  • teamRegistrations.players: CONSERVÉ (historique)`)
    console.log(`  • Joueurs supprimés de la collection players: ${playersDeleted}`)
    console.log(`  • Total de joueurs supprimés: ${playersRemovedFromTeams + playersDeleted}`)
    console.log('\n✅ Nettoyage terminé avec succès!')

  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  }
}

// Exécuter le script
cleanupDeletedPlayers()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })

