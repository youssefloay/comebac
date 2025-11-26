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

  initializeApp({
    credential: cert(serviceAccount)
  })
}

const db = getFirestore()

interface CleanupStats {
  playersDeleted: number
  playersKept: number
  teamsUpdated: number
  registrationsUpdated: number
  usersMerged: number
  errors: string[]
}

async function cleanupDuplications() {
  console.log('🧹 Nettoyage des duplications dans la base de données...\n')
  
  const stats: CleanupStats = {
    playersDeleted: 0,
    playersKept: 0,
    teamsUpdated: 0,
    registrationsUpdated: 0,
    usersMerged: 0,
    errors: []
  }
  
  try {
    // 1. Nettoyer les doublons dans players
    // Garder seulement ceux avec des statistiques ou des données importantes
    console.log('📋 1. Nettoyage de la collection players...')
    const playersSnap = await db.collection('players').get()
    const playersByEmail = new Map<string, any[]>()
    
    // Grouper par email
    playersSnap.forEach(doc => {
      const data = doc.data()
      const email = data.email?.toLowerCase()?.trim()
      if (email) {
        if (!playersByEmail.has(email)) {
          playersByEmail.set(email, [])
        }
        playersByEmail.get(email)!.push({ id: doc.id, ...data })
      }
    })
    
    // Pour chaque email avec plusieurs occurrences, garder le meilleur
    for (const [email, players] of playersByEmail.entries()) {
      if (players.length > 1) {
        // Trier par priorité : stats > createdAt récent > autre
        players.sort((a, b) => {
          const aHasStats = a.seasonStats && (
            a.seasonStats.goals > 0 || 
            a.seasonStats.assists > 0 || 
            a.seasonStats.matches > 0
          )
          const bHasStats = b.seasonStats && (
            b.seasonStats.goals > 0 || 
            b.seasonStats.assists > 0 || 
            b.seasonStats.matches > 0
          )
          
          if (aHasStats && !bHasStats) return -1
          if (!aHasStats && bHasStats) return 1
          
          // Si même niveau de stats, garder le plus récent
          const aDate = a.createdAt?.toDate?.() || a.updatedAt?.toDate?.() || new Date(0)
          const bDate = b.createdAt?.toDate?.() || b.updatedAt?.toDate?.() || new Date(0)
          return bDate.getTime() - aDate.getTime()
        })
        
        // Garder le premier, supprimer les autres
        const toKeep = players[0]
        const toDelete = players.slice(1)
        
        for (const player of toDelete) {
          try {
            await db.collection('players').doc(player.id).delete()
            stats.playersDeleted++
            console.log(`   ✅ Supprimé doublon players: ${email} (${player.id})`)
          } catch (error: any) {
            stats.errors.push(`Erreur suppression players ${player.id}: ${error.message}`)
          }
        }
        
        stats.playersKept++
      } else {
        stats.playersKept++
      }
    }
    
    console.log(`   ✅ ${stats.playersKept} joueurs conservés, ${stats.playersDeleted} doublons supprimés\n`)
    
    // 2. Synchroniser teams.players depuis playerAccounts
    console.log('📋 2. Synchronisation de teams.players depuis playerAccounts...')
    const teamsSnap = await db.collection('teams').get()
    
    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      const teamId = teamDoc.id
      const players = teamData.players || []
      
      if (players.length === 0) continue
      
      let updated = false
      const updatedPlayers = await Promise.all(
        players.map(async (player: any) => {
          const email = player.email?.toLowerCase()?.trim()
          if (!email) return player
          
          // Chercher dans playerAccounts
          const playerAccountsSnap = await db.collection('playerAccounts')
            .where('email', '==', email)
            .where('teamId', '==', teamId)
            .limit(1)
            .get()
          
          if (!playerAccountsSnap.empty) {
            const accountData = playerAccountsSnap.docs[0].data()
            // Mettre à jour avec les données de playerAccounts
            const updatedPlayer = {
              ...player,
              firstName: accountData.firstName || player.firstName,
              lastName: accountData.lastName || player.lastName,
              nickname: accountData.nickname || player.nickname,
              phone: accountData.phone || player.phone,
              birthDate: accountData.birthDate || player.birthDate,
              height: accountData.height || player.height,
              tshirtSize: accountData.tshirtSize || player.tshirtSize,
              position: accountData.position || player.position,
              foot: accountData.foot || player.foot,
              jerseyNumber: accountData.jerseyNumber || accountData.number || player.jerseyNumber || player.number,
              number: accountData.jerseyNumber || accountData.number || player.jerseyNumber || player.number
            }
            
            if (JSON.stringify(updatedPlayer) !== JSON.stringify(player)) {
              updated = true
            }
            
            return updatedPlayer
          }
          
          return player
        })
      )
      
      if (updated) {
        try {
          await db.collection('teams').doc(teamId).update({
            players: updatedPlayers,
            updatedAt: new Date()
          })
          stats.teamsUpdated++
          console.log(`   ✅ Équipe "${teamData.name}" synchronisée`)
        } catch (error: any) {
          stats.errors.push(`Erreur sync team ${teamId}: ${error.message}`)
        }
      }
    }
    
    console.log(`   ✅ ${stats.teamsUpdated} équipes synchronisées\n`)
    
    // 3. Synchroniser teamRegistrations.players depuis playerAccounts
    console.log('📋 3. Synchronisation de teamRegistrations.players depuis playerAccounts...')
    const registrationsSnap = await db.collection('teamRegistrations').get()
    
    for (const regDoc of registrationsSnap.docs) {
      const regData = regDoc.data()
      const players = regData.players || []
      const teamId = regData.teamId
      
      if (players.length === 0) continue
      
      let updated = false
      const updatedPlayers = await Promise.all(
        players.map(async (player: any) => {
          const email = player.email?.toLowerCase()?.trim()
          if (!email) return player
          
          // Chercher dans playerAccounts
          const query = teamId
            ? db.collection('playerAccounts')
                .where('email', '==', email)
                .where('teamId', '==', teamId)
            : db.collection('playerAccounts')
                .where('email', '==', email)
          
          const playerAccountsSnap = await query.limit(1).get()
          
          if (!playerAccountsSnap.empty) {
            const accountData = playerAccountsSnap.docs[0].data()
            // Mettre à jour avec les données de playerAccounts
            const updatedPlayer = {
              ...player,
              firstName: accountData.firstName || player.firstName,
              lastName: accountData.lastName || player.lastName,
              nickname: accountData.nickname || player.nickname,
              phone: accountData.phone || player.phone,
              birthDate: accountData.birthDate || player.birthDate,
              height: accountData.height || player.height,
              tshirtSize: accountData.tshirtSize || player.tshirtSize,
              position: accountData.position || player.position,
              foot: accountData.foot || player.foot,
              jerseyNumber: accountData.jerseyNumber || accountData.number || player.jerseyNumber,
              number: accountData.jerseyNumber || accountData.number || player.jerseyNumber
            }
            
            if (JSON.stringify(updatedPlayer) !== JSON.stringify(player)) {
              updated = true
            }
            
            return updatedPlayer
          }
          
          return player
        })
      )
      
      if (updated) {
        try {
          await db.collection('teamRegistrations').doc(regDoc.id).update({
            players: updatedPlayers,
            lastUpdatedAt: new Date()
          })
          stats.registrationsUpdated++
          console.log(`   ✅ Inscription "${regData.teamName}" synchronisée`)
        } catch (error: any) {
          stats.errors.push(`Erreur sync registration ${regDoc.id}: ${error.message}`)
        }
      }
    }
    
    console.log(`   ✅ ${stats.registrationsUpdated} inscriptions synchronisées\n`)
    
    // 4. Fusionner users et userProfiles (garder userProfiles comme source principale)
    console.log('📋 4. Fusion de users et userProfiles...')
    const usersSnap = await db.collection('users').get()
    
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data()
      const email = userData.email?.toLowerCase()?.trim()
      if (!email) continue
      
      // Chercher dans userProfiles
      const profilesSnap = await db.collection('userProfiles')
        .where('email', '==', email)
        .get()
      
      if (!profilesSnap.empty) {
        // Mettre à jour userProfiles avec les données de users
        for (const profileDoc of profilesSnap.docs) {
          const profileData = profileDoc.data()
          const updates: any = {}
          
          if (userData.uid && !profileData.uid) {
            updates.uid = userData.uid
          }
          if (userData.role && !profileData.role) {
            updates.role = userData.role
          }
          if (userData.displayName && !profileData.fullName) {
            updates.fullName = userData.displayName
          }
          
          if (Object.keys(updates).length > 0) {
            try {
              await profileDoc.ref.update({
                ...updates,
                updatedAt: new Date()
              })
              stats.usersMerged++
              console.log(`   ✅ Profil "${email}" mis à jour`)
            } catch (error: any) {
              stats.errors.push(`Erreur merge profile ${profileDoc.id}: ${error.message}`)
            }
          }
        }
      }
    }
    
    console.log(`   ✅ ${stats.usersMerged} profils fusionnés\n`)
    
    // Résumé
    console.log('\n📊 Résumé du nettoyage:\n')
    console.log(`✅ Joueurs conservés: ${stats.playersKept}`)
    console.log(`🗑️  Doublons players supprimés: ${stats.playersDeleted}`)
    console.log(`🔄 Équipes synchronisées: ${stats.teamsUpdated}`)
    console.log(`🔄 Inscriptions synchronisées: ${stats.registrationsUpdated}`)
    console.log(`🔗 Profils fusionnés: ${stats.usersMerged}`)
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Erreurs (${stats.errors.length}):`)
      stats.errors.slice(0, 10).forEach(error => console.log(`   - ${error}`))
      if (stats.errors.length > 10) {
        console.log(`   ... et ${stats.errors.length - 10} autres erreurs`)
      }
    }
    
    console.log('\n✅ Nettoyage terminé!')
    
  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  }
}

// Demander confirmation avant d'exécuter
console.log('⚠️  ATTENTION: Ce script va modifier la base de données!')
console.log('   - Supprimer des doublons dans players')
console.log('   - Synchroniser teams.players et teamRegistrations.players')
console.log('   - Fusionner users et userProfiles')
console.log('\n   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...\n')

setTimeout(() => {
  cleanupDuplications()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erreur:', error)
      process.exit(1)
    })
}, 5000)

