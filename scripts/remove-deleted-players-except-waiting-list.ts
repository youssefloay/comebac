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
  email?: string
  firstName?: string
  lastName?: string
  nickname?: string
  jerseyNumber?: string | number
  number?: string | number
  id?: string
}

async function removeDeletedPlayersExceptWaitingList() {
  console.log('🧹 Suppression des joueurs supprimés (hors waiting list)...\n')

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

    // 2. Récupérer toutes les inscriptions
    const registrationsSnap = await db.collection('teamRegistrations').get()
    let registrationsCleaned = 0
    let playersRemoved = 0
    let waitingListSkipped = 0

    console.log('📋 Vérification des inscriptions...\n')

    for (const regDoc of registrationsSnap.docs) {
      const regData = regDoc.data()
      if (!regData.players || !Array.isArray(regData.players)) {
        continue
      }

      const teamName = regData.teamName || regDoc.id
      const isWaitingList = regData.isWaitingList === true

      // Si c'est une équipe en waiting list, on ne touche pas
      if (isWaitingList) {
        waitingListSkipped++
        console.log(`  ⏭️  ${teamName}: Waiting list (conservé)`)
        continue
      }

      const originalLength = regData.players.length
      const cleanedPlayers = regData.players.filter((player: PlayerReference) => {
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
        await regDoc.ref.update({ players: cleanedPlayers })
        const removed = originalLength - cleanedPlayers.length
        playersRemoved += removed
        registrationsCleaned++
        console.log(`  ✅ ${teamName}: ${removed} joueur(s) supprimé(s)`)
      }
    }

    console.log(`\n✅ ${registrationsCleaned} inscription(s) nettoyée(s), ${playersRemoved} joueur(s) supprimé(s)`)
    console.log(`⏭️  ${waitingListSkipped} équipe(s) en waiting list conservée(s)`)
    console.log('\n✅ Nettoyage terminé avec succès!')

  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  }
}

// Exécuter le script
removeDeletedPlayersExceptWaitingList()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })


