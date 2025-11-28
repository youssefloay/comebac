import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

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
  position?: string
  phone?: string
  birthDate?: string
  height?: number
  tshirtSize?: string
  foot?: string
  grade?: string
  [key: string]: any
}

async function restoreAllTeamRegistrationsPlayers() {
  console.log('🔄 Début de la restauration complète des joueurs dans teamRegistrations...\n')

  try {
    // 1. Récupérer tous les playerAccounts (joueurs actifs)
    const playerAccountsSnap = await db.collection('playerAccounts').get()
    const activePlayerEmails = new Set<string>()
    const playerAccountsMap = new Map<string, any>()
    
    playerAccountsSnap.docs.forEach(doc => {
      const data = doc.data()
      const email = (data.email || '').toLowerCase().trim()
      if (email) {
        activePlayerEmails.add(email)
        playerAccountsMap.set(email, data)
      }
    })

    console.log(`✅ ${activePlayerEmails.size} joueurs actifs dans playerAccounts\n`)

    // 2. Récupérer tous les joueurs de la collection players
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

    // 3. Chercher dans les backups si disponibles
    const backupsDir = path.resolve(__dirname, '../backups')
    let backupPlayersMap = new Map<string, any>()
    const backupRegistrationsMap = new Map<string, any>() // Map par teamName -> players array
    
    if (fs.existsSync(backupsDir)) {
      console.log('📦 Recherche dans les backups...')
      const backupDirs = fs.readdirSync(backupsDir).filter(f => {
        const fullPath = path.join(backupsDir, f)
        return fs.statSync(fullPath).isDirectory()
      }).sort().reverse() // Prendre le plus récent en premier
      
      // Prendre le backup le plus récent
      if (backupDirs.length > 0) {
        const latestBackupDir = path.join(backupsDir, backupDirs[0])
        console.log(`  📁 Utilisation du backup: ${backupDirs[0]}\n`)
        
        // Lire teamRegistrations.json
        const teamRegistrationsPath = path.join(latestBackupDir, 'teamRegistrations.json')
        if (fs.existsSync(teamRegistrationsPath)) {
          try {
            const content = fs.readFileSync(teamRegistrationsPath, 'utf-8')
            const registrations = JSON.parse(content)
            
            if (Array.isArray(registrations)) {
              for (const reg of registrations) {
                const teamName = (reg.teamName || '').toLowerCase().trim()
                if (teamName && reg.players && Array.isArray(reg.players)) {
                  // Stocker les joueurs par équipe
                  backupRegistrationsMap.set(teamName, reg.players)
                  
                  // Aussi stocker par email pour recherche individuelle
                  for (const player of reg.players) {
                    const email = (player.email || '').toLowerCase().trim()
                    if (email && !backupPlayersMap.has(email)) {
                      backupPlayersMap.set(email, player)
                    }
                  }
                }
              }
            }
            console.log(`  ✅ ${backupRegistrationsMap.size} inscriptions trouvées dans le backup`)
            console.log(`  ✅ ${backupPlayersMap.size} joueurs uniques trouvés dans le backup\n`)
          } catch (error) {
            console.log(`  ⚠️  Erreur lecture teamRegistrations.json:`, error)
          }
        }
        
        // Lire players.json pour compléter
        const playersPath = path.join(latestBackupDir, 'players.json')
        if (fs.existsSync(playersPath)) {
          try {
            const content = fs.readFileSync(playersPath, 'utf-8')
            const players = JSON.parse(content)
            
            if (Array.isArray(players)) {
              for (const player of players) {
                const email = (player.email || '').toLowerCase().trim()
                if (email && !backupPlayersMap.has(email)) {
                  backupPlayersMap.set(email, player)
                }
              }
            }
            console.log(`  ✅ ${backupPlayersMap.size} joueurs totaux après lecture players.json\n`)
          } catch (error) {
            console.log(`  ⚠️  Erreur lecture players.json:`, error)
          }
        }
      }
    } else {
      console.log('📦 Aucun dossier backups trouvé\n')
    }

    // 4. Chercher dans accounts (si migration effectuée)
    const accountsSnap = await db.collection('accounts').get()
    const accountsMap = new Map<string, any>()
    
    accountsSnap.docs.forEach(doc => {
      const data = doc.data()
      const email = (data.email || '').toLowerCase().trim()
      if (email && data.role === 'player') {
        accountsMap.set(email, data)
      }
    })

    console.log(`✅ ${accountsMap.size} comptes joueurs trouvés dans accounts\n`)

    // 5. Chercher dans users (ancienne collection)
    const usersSnap = await db.collection('users').get()
    const usersMap = new Map<string, any>()
    
    usersSnap.docs.forEach(doc => {
      const data = doc.data()
      const email = (data.email || '').toLowerCase().trim()
      if (email && data.role === 'player') {
        usersMap.set(email, data)
      }
    })

    console.log(`✅ ${usersMap.size} utilisateurs joueurs trouvés dans users\n`)

    // 6. Fonction pour trouver un joueur dans toutes les sources
    const findPlayerInAllSources = (email: string): PlayerReference | null => {
      // Priorité 1: playerAccounts
      if (playerAccountsMap.has(email)) {
        const data = playerAccountsMap.get(email)
        return {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          nickname: data.nickname || '',
          jerseyNumber: data.jerseyNumber || data.number || 0,
          number: data.jerseyNumber || data.number || 0,
          position: data.position || '',
          phone: data.phone || '',
          birthDate: data.birthDate || '',
          height: data.height || 0,
          tshirtSize: data.tshirtSize || 'M',
          foot: data.foot || '',
          grade: data.grade || '',
        }
      }
      
      // Priorité 2: players collection
      if (allPlayersMap.has(email)) {
        const data = allPlayersMap.get(email)
        return {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          nickname: data.nickname || '',
          jerseyNumber: data.jerseyNumber || data.number || 0,
          number: data.jerseyNumber || data.number || 0,
          position: data.position || '',
          phone: data.phone || '',
          birthDate: data.birthDate || '',
          height: data.height || 0,
          tshirtSize: data.tshirtSize || 'M',
          foot: data.foot || data.strongFoot || '',
          grade: data.grade || '',
        }
      }
      
      // Priorité 3: backups
      if (backupPlayersMap.has(email)) {
        const data = backupPlayersMap.get(email)
        return {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          nickname: data.nickname || '',
          jerseyNumber: data.jerseyNumber || data.number || 0,
          number: data.jerseyNumber || data.number || 0,
          position: data.position || '',
          phone: data.phone || '',
          birthDate: data.birthDate || '',
          height: data.height || 0,
          tshirtSize: data.tshirtSize || 'M',
          foot: data.foot || '',
          grade: data.grade || '',
        }
      }
      
      // Priorité 4: accounts
      if (accountsMap.has(email)) {
        const data = accountsMap.get(email)
        return {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          nickname: data.nickname || '',
          jerseyNumber: data.jerseyNumber || data.number || 0,
          number: data.jerseyNumber || data.number || 0,
          position: data.position || '',
          phone: data.phone || '',
          birthDate: data.birthDate || '',
          height: data.height || 0,
          tshirtSize: data.tshirtSize || 'M',
          foot: data.foot || '',
          grade: data.grade || '',
        }
      }
      
      return null
    }

    // 7. Récupérer toutes les inscriptions
    const registrationsSnap = await db.collection('teamRegistrations').get()
    let registrationsRestored = 0
    let playersRestored = 0
    const missingPlayers: Array<{team: string, email: string, name: string}> = []

    console.log('📋 Vérification et restauration des inscriptions...\n')

    for (const regDoc of registrationsSnap.docs) {
      const regData = regDoc.data()
      if (!regData.players || !Array.isArray(regData.players)) {
        continue
      }

      const teamName = regData.teamName || regDoc.id
      const currentPlayers = regData.players || []
      
      // Créer un Set des emails déjà présents dans l'inscription
      const existingEmails = new Set(
        currentPlayers
          .map((p: PlayerReference) => (p.email || '').toLowerCase().trim())
          .filter(Boolean)
      )

      // PRIORITÉ 1: Restaurer depuis les backups (source la plus fiable pour l'historique)
      const regTeamNameLower = (teamName || '').toLowerCase().trim()
      const backupPlayers = backupRegistrationsMap.get(regTeamNameLower) || []
      
      // PRIORITÉ 2: Chercher les joueurs de cette équipe dans toutes les sources
      const teamPlayersToCheck = new Set<string>()
      
      // Depuis players collection
      allPlayersMap.forEach((player, email) => {
        const playerTeamName = (player.teamName || '').toLowerCase().trim()
        if (playerTeamName === regTeamNameLower || player.teamId === regData.teamId) {
          teamPlayersToCheck.add(email)
        }
      })
      
      // Depuis playerAccounts
      playerAccountsMap.forEach((player, email) => {
        const playerTeamName = (player.teamName || '').toLowerCase().trim()
        if (playerTeamName === regTeamNameLower || player.teamId === regData.teamId) {
          teamPlayersToCheck.add(email)
        }
      })

      // Restaurer les joueurs manquants
      const playersToRestore: PlayerReference[] = []
      
      // PRIORITÉ 1: Restaurer depuis les backups (historique complet)
      for (const backupPlayer of backupPlayers) {
        const email = (backupPlayer.email || '').toLowerCase().trim()
        if (email && !existingEmails.has(email)) {
          const player: PlayerReference = {
            firstName: backupPlayer.firstName || '',
            lastName: backupPlayer.lastName || '',
            email: backupPlayer.email || '',
            nickname: backupPlayer.nickname || '',
            jerseyNumber: backupPlayer.jerseyNumber || backupPlayer.number || 0,
            number: backupPlayer.jerseyNumber || backupPlayer.number || 0,
            position: backupPlayer.position || '',
            phone: backupPlayer.phone || '',
            birthDate: backupPlayer.birthDate || '',
            height: backupPlayer.height || 0,
            tshirtSize: backupPlayer.tshirtSize || 'M',
            foot: backupPlayer.foot || '',
            grade: backupPlayer.grade || '',
          }
          playersToRestore.push(player)
        }
      }
      
      // PRIORITÉ 2: Compléter avec les joueurs des autres sources
      for (const email of teamPlayersToCheck) {
        if (!existingEmails.has(email)) {
          // Vérifier qu'on ne l'a pas déjà ajouté depuis les backups
          const alreadyAdded = playersToRestore.some(p => (p.email || '').toLowerCase().trim() === email)
          if (!alreadyAdded) {
            const player = findPlayerInAllSources(email)
            if (player) {
              playersToRestore.push(player)
            } else {
              // Joueur trouvé dans une source mais pas de données complètes
              missingPlayers.push({
                team: teamName,
                email: email,
                name: 'Inconnu'
              })
            }
          }
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
    
    if (missingPlayers.length > 0) {
      console.log(`\n⚠️  ${missingPlayers.length} joueur(s) trouvé(s) mais sans données complètes:`)
      missingPlayers.forEach(p => {
        console.log(`     - ${p.name} (${p.email}) dans ${p.team}`)
      })
    }
    
    console.log('\n✅ Restauration terminée avec succès!')

  } catch (error: any) {
    console.error('❌ Erreur lors de la restauration:', error)
    throw error
  }
}

// Exécuter le script
restoreAllTeamRegistrationsPlayers()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })

