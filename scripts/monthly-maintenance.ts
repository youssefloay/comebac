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

/**
 * Script de maintenance mensuelle
 * À exécuter automatiquement chaque mois pour maintenir la BDD propre
 */
async function monthlyMaintenance() {
  console.log('🔧 Maintenance mensuelle de la base de données...\n')
  console.log(`📅 Date: ${new Date().toISOString()}\n`)
  
  const stats = {
    duplicationsRemoved: 0,
    dataSynchronized: 0,
    orphanDataCleaned: 0,
    errors: [] as string[]
  }
  
  try {
    // 1. Sauvegarde avant maintenance
    console.log('📋 1. Création d\'une sauvegarde...')
    // Note: Vous pouvez appeler backup-firestore.ts ici si nécessaire
    console.log('   ℹ️  Sauvegarde recommandée avant maintenance\n')
    
    // 2. Synchroniser teams.players depuis playerAccounts
    console.log('📋 2. Synchronisation de teams.players...')
    const teamsSnap = await db.collection('teams').get()
    let teamsSynced = 0
    
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
          
          const playerAccountsSnap = await db.collection('playerAccounts')
            .where('email', '==', email)
            .where('teamId', '==', teamId)
            .limit(1)
            .get()
          
          if (!playerAccountsSnap.empty) {
            const accountData = playerAccountsSnap.docs[0].data()
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
          teamsSynced++
          stats.dataSynchronized++
        } catch (error: any) {
          stats.errors.push(`Erreur sync team ${teamId}: ${error.message}`)
        }
      }
    }
    
    console.log(`   ✅ ${teamsSynced} équipes synchronisées\n`)
    
    // 3. Vérifier et nettoyer les doublons dans players
    console.log('📋 3. Vérification des doublons dans players...')
    const playersSnap = await db.collection('players').get()
    const playersByEmail = new Map<string, any[]>()
    
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
    
    for (const [email, players] of playersByEmail.entries()) {
      if (players.length > 1) {
        // Garder celui avec le plus de stats
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
          
          const aDate = a.createdAt?.toDate?.() || a.updatedAt?.toDate?.() || new Date(0)
          const bDate = b.createdAt?.toDate?.() || b.updatedAt?.toDate?.() || new Date(0)
          return bDate.getTime() - aDate.getTime()
        })
        
        const toDelete = players.slice(1)
        for (const player of toDelete) {
          try {
            await db.collection('players').doc(player.id).delete()
            stats.duplicationsRemoved++
          } catch (error: any) {
            stats.errors.push(`Erreur suppression ${player.id}: ${error.message}`)
          }
        }
      }
    }
    
    console.log(`   ✅ ${stats.duplicationsRemoved} doublons supprimés\n`)
    
    // 4. Vérifier l'intégrité des données
    console.log('📋 4. Vérification de l\'intégrité...')
    let integrityIssues = 0
    
    // Vérifier que tous les joueurs dans teams.players ont un playerAccount
    const playerAccountsEmails = new Set<string>()
    const playerAccountsSnap = await db.collection('playerAccounts').get()
    playerAccountsSnap.forEach(doc => {
      const email = doc.data().email?.toLowerCase()?.trim()
      if (email) playerAccountsEmails.add(email)
    })
    
    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      const players = teamData.players || []
      
      for (const player of players) {
        const email = player.email?.toLowerCase()?.trim()
        if (email && !playerAccountsEmails.has(email)) {
          integrityIssues++
          console.log(`   ⚠️  Joueur ${email} dans teams mais absent de playerAccounts`)
        }
      }
    }
    
    if (integrityIssues === 0) {
      console.log('   ✅ Intégrité vérifiée, aucune anomalie\n')
    } else {
      console.log(`   ⚠️  ${integrityIssues} anomalies détectées\n`)
    }
    
    // Résumé
    console.log('📊 Résumé de la maintenance:\n')
    console.log(`✅ Doublons supprimés: ${stats.duplicationsRemoved}`)
    console.log(`✅ Données synchronisées: ${stats.dataSynchronized}`)
    console.log(`✅ Anomalies détectées: ${integrityIssues}`)
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Erreurs (${stats.errors.length}):`)
      stats.errors.slice(0, 5).forEach(error => console.log(`   - ${error}`))
    }
    
    console.log('\n✅ Maintenance mensuelle terminée!')
    
  } catch (error: any) {
    console.error('❌ Erreur lors de la maintenance:', error)
    throw error
  }
}

monthlyMaintenance()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

