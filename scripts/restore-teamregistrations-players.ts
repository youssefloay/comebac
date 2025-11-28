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
  [key: string]: any
}

async function restoreTeamRegistrationsPlayers() {
  console.log('🔄 Début de la restauration des joueurs dans teamRegistrations...\n')

  try {
    // 1. Récupérer tous les playerAccounts (joueurs actifs)
    const playerAccountsSnap = await db.collection('playerAccounts').get()
    const activePlayerEmails = new Set<string>()
    
    playerAccountsSnap.docs.forEach(doc => {
      const data = doc.data()
      const email = (data.email || '').toLowerCase().trim()
      if (email) {
        activePlayerEmails.add(email)
      }
    })

    console.log(`✅ ${activePlayerEmails.size} joueurs actifs avec email\n`)

    // 2. Récupérer tous les joueurs de la collection players (même ceux supprimés)
    const playersSnap = await db.collection('players').get()
    const allPlayersMap = new Map<string, any>()
    
    playersSnap.docs.forEach(doc => {
      const data = doc.data()
      const email = (data.email || '').toLowerCase().trim()
      if (email) {
        allPlayersMap.set(email, { ...data, id: doc.id })
      }
    })

    console.log(`✅ ${allPlayersMap.size} joueurs trouvés dans la collection players\n`)

    // 3. Récupérer toutes les inscriptions
    const registrationsSnap = await db.collection('teamRegistrations').get()
    let registrationsRestored = 0
    let playersRestored = 0

    console.log('📋 Vérification des inscriptions...\n')

    for (const regDoc of registrationsSnap.docs) {
      const regData = regDoc.data()
      if (!regData.players || !Array.isArray(regData.players)) {
        continue
      }

      const teamName = regData.teamName || regDoc.id
      const currentPlayers = regData.players || []
      
      // Trouver les joueurs qui devraient être dans cette inscription
      // en cherchant dans la collection players par teamName ou teamId
      const teamPlayers = Array.from(allPlayersMap.values()).filter((player: any) => {
        const playerTeamName = (player.teamName || '').toLowerCase().trim()
        const regTeamName = (teamName || '').toLowerCase().trim()
        return playerTeamName === regTeamName || player.teamId === regData.teamId
      })

      // Créer un Set des emails déjà présents dans l'inscription
      const existingEmails = new Set(
        currentPlayers
          .map((p: PlayerReference) => (p.email || '').toLowerCase().trim())
          .filter(Boolean)
      )

      // Trouver les joueurs à restaurer (dans players mais pas dans l'inscription actuelle)
      const playersToRestore: PlayerReference[] = []
      
      for (const player of teamPlayers) {
        const email = (player.email || '').toLowerCase().trim()
        if (email && !existingEmails.has(email)) {
          // Ce joueur devrait être dans l'inscription mais n'y est pas
          // Créer un objet joueur pour teamRegistrations
          const playerForRegistration: PlayerReference = {
            firstName: player.firstName || '',
            lastName: player.lastName || '',
            email: player.email || '',
            nickname: player.nickname || '',
            jerseyNumber: player.jerseyNumber || player.number || 0,
            number: player.jerseyNumber || player.number || 0,
            position: player.position || '',
            phone: player.phone || '',
            birthDate: player.birthDate || '',
            height: player.height || 0,
            tshirtSize: player.tshirtSize || 'M',
            foot: player.foot || player.strongFoot || '',
            grade: player.grade || '',
          }
          playersToRestore.push(playerForRegistration)
        }
      }

      if (playersToRestore.length > 0) {
        // Restaurer les joueurs dans l'inscription
        const restoredPlayers = [...currentPlayers, ...playersToRestore]
        await regDoc.ref.update({ players: restoredPlayers })
        playersRestored += playersToRestore.length
        registrationsRestored++
        console.log(`  ✅ ${teamName}: ${playersToRestore.length} joueur(s) restauré(s)`)
        playersToRestore.forEach(p => {
          console.log(`     - ${p.firstName} ${p.lastName} (${p.email})`)
        })
      }
    }

    console.log(`\n✅ ${registrationsRestored} inscription(s) restaurée(s), ${playersRestored} joueur(s) restauré(s) dans teamRegistrations.players`)
    console.log('\n✅ Restauration terminée avec succès!')

  } catch (error: any) {
    console.error('❌ Erreur lors de la restauration:', error)
    throw error
  }
}

// Exécuter le script
restoreTeamRegistrationsPlayers()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })


