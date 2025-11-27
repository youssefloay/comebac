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

interface SyncStats {
  teamsProcessed: number
  playersAddedToPA: number
  playersAddedToTeams: number
  playersAddedToPlayers: number
  errors: string[]
}

const stats: SyncStats = {
  teamsProcessed: 0,
  playersAddedToPA: 0,
  playersAddedToTeams: 0,
  playersAddedToPlayers: 0,
  errors: []
}

async function syncAllTeams() {
  console.log('🔧 Synchronisation de toutes les équipes...\n')
  
  // 1. Récupérer toutes les équipes validées
  const teamsSnap = await db.collection('teams').get()
  console.log(`📊 ${teamsSnap.size} équipes trouvées\n`)
  
  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data()
    const teamId = teamDoc.id
    const teamName = teamData.name
    
    console.log(`\n📋 Traitement de "${teamName}" (${teamId})...`)
    
    try {
      // 2. Récupérer l'inscription correspondante
      const regSnap = await db.collection('teamRegistrations')
        .where('teamName', '==', teamName)
        .where('status', '==', 'approved')
        .limit(1)
        .get()
      
      if (regSnap.empty) {
        console.log(`   ⚠️  Aucune inscription approuvée trouvée, utilisation de playerAccounts uniquement`)
      }
      
      const regData = regSnap.empty ? null : regSnap.docs[0].data()
      const regPlayers = regData?.players || []
      
      // 3. Récupérer les playerAccounts actuels
      const paSnap = await db.collection('playerAccounts')
        .where('teamId', '==', teamId)
        .get()
      
      const paEmails = new Set(
        paSnap.docs.map(doc => doc.data().email?.toLowerCase()?.trim()).filter(Boolean)
      )
      
      console.log(`   📊 ${paSnap.size} joueurs dans playerAccounts`)
      console.log(`   📊 ${regPlayers.length} joueurs dans teamRegistrations`)
      
      // 4. Ajouter les joueurs manquants depuis teamRegistrations
      if (!regSnap.empty) {
        for (const regPlayer of regPlayers) {
          const regEmail = regPlayer.email?.toLowerCase()?.trim()
          
          if (!regEmail) continue
          
          if (!paEmails.has(regEmail)) {
            // Créer un nouveau playerAccount
            const newPA: any = {
              email: regPlayer.email,
              firstName: regPlayer.firstName,
              lastName: regPlayer.lastName,
              teamId: teamId,
              teamName: teamName,
              jerseyNumber: regPlayer.jerseyNumber || regPlayer.number,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            
            if (regPlayer.position) newPA.position = regPlayer.position
            if (regPlayer.birthDate) newPA.birthDate = regPlayer.birthDate
            if (regPlayer.height !== undefined) newPA.height = regPlayer.height
            if (regPlayer.foot) newPA.foot = regPlayer.foot
            if (regPlayer.tshirtSize) newPA.tshirtSize = regPlayer.tshirtSize
            if (regPlayer.grade) newPA.grade = regPlayer.grade
            if (regPlayer.phone) newPA.phone = regPlayer.phone
            
            await db.collection('playerAccounts').add(newPA)
            paEmails.add(regEmail)
            stats.playersAddedToPA++
            console.log(`   ✅ Ajouté à playerAccounts: ${regPlayer.firstName} ${regPlayer.lastName}`)
          }
        }
      }
      
      // 5. Synchroniser teams.players depuis playerAccounts
      const updatedPASnap = await db.collection('playerAccounts')
        .where('teamId', '==', teamId)
        .get()
      
      const playersArray = updatedPASnap.docs.map(doc => {
        const data = doc.data()
        const jerseyNumber = data.jerseyNumber || data.number || 0
        const player: any = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          number: jerseyNumber,
          jerseyNumber: jerseyNumber
        }
        
        if (data.position) player.position = data.position
        if (data.birthDate) player.birthDate = data.birthDate
        if (data.height !== undefined) player.height = data.height
        if (data.foot) player.foot = data.foot
        if (data.tshirtSize) player.tshirtSize = data.tshirtSize
        if (data.grade) player.grade = data.grade
        if (data.phone) player.phone = data.phone
        
        return player
      })
      
      await teamDoc.ref.update({
        players: playersArray,
        updatedAt: new Date()
      })
      
      console.log(`   ✅ teams.players synchronisé (${playersArray.length} joueurs)`)
      stats.playersAddedToTeams++
      
      // 6. Synchroniser players collection depuis playerAccounts
      const existingPlayersSnap = await db.collection('players')
        .where('teamId', '==', teamId)
        .get()
      
      const existingPlayersEmails = new Set(
        existingPlayersSnap.docs.map(doc => doc.data().email?.toLowerCase()?.trim()).filter(Boolean)
      )
      
      for (const paDoc of updatedPASnap.docs) {
        const paData = paDoc.data()
        const paEmail = paData.email?.toLowerCase()?.trim()
        
        if (!paEmail) continue
        
        if (!existingPlayersEmails.has(paEmail)) {
          // Créer un nouveau document dans players
          const newPlayer: any = {
            email: paData.email,
            firstName: paData.firstName,
            lastName: paData.lastName,
            name: `${paData.firstName} ${paData.lastName}`,
            teamId: teamId,
            teamName: teamName,
            number: paData.jerseyNumber || paData.number,
            jerseyNumber: paData.jerseyNumber || paData.number,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          if (paData.position) newPlayer.position = paData.position
          if (paData.birthDate) newPlayer.birthDate = paData.birthDate
          if (paData.height !== undefined) newPlayer.height = paData.height
          if (paData.foot) newPlayer.foot = paData.foot
          if (paData.tshirtSize) newPlayer.tshirtSize = paData.tshirtSize
          if (paData.grade) newPlayer.grade = paData.grade
          
          await db.collection('players').add(newPlayer)
          stats.playersAddedToPlayers++
        }
      }
      
      // Supprimer les joueurs orphelins dans players (présents dans players mais pas dans playerAccounts)
      for (const playerDoc of existingPlayersSnap.docs) {
        const playerData = playerDoc.data()
        const playerEmail = playerData.email?.toLowerCase()?.trim()
        
        if (playerEmail && !paEmails.has(playerEmail)) {
          await playerDoc.ref.delete()
          console.log(`   🗑️  Supprimé joueur orphelin de players: ${playerEmail}`)
        }
      }
      
      stats.teamsProcessed++
      
    } catch (error: any) {
      stats.errors.push(`Erreur pour ${teamName}: ${error.message}`)
      console.error(`   ❌ Erreur: ${error.message}`)
    }
  }
  
  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ DE LA SYNCHRONISATION\n')
  console.log(`✅ Équipes traitées: ${stats.teamsProcessed}`)
  console.log(`✅ Joueurs ajoutés à playerAccounts: ${stats.playersAddedToPA}`)
  console.log(`✅ teams.players synchronisés: ${stats.playersAddedToTeams}`)
  console.log(`✅ Joueurs ajoutés à players: ${stats.playersAddedToPlayers}`)
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ Erreurs: ${stats.errors.length}`)
    stats.errors.slice(0, 10).forEach(e => console.log(`   - ${e}`))
  } else {
    console.log('\n✅ Aucune erreur!')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Synchronisation terminée!')
}

// Exécuter la synchronisation
if (require.main === module) {
  console.log('⚠️  Ce script va synchroniser toutes les équipes')
  console.log('   - Ajouter les joueurs manquants depuis teamRegistrations')
  console.log('   - Synchroniser teams.players depuis playerAccounts')
  console.log('   - Synchroniser players depuis playerAccounts')
  console.log('   - Supprimer les joueurs orphelins\n')
  console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...\n')
  
  setTimeout(() => {
    syncAllTeams()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Erreur:', error)
        process.exit(1)
      })
  }, 5000)
}

export { syncAllTeams }

