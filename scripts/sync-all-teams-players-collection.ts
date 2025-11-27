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
  playersAdded: number
  playersRemoved: number
  errors: string[]
}

const stats: SyncStats = {
  teamsProcessed: 0,
  playersAdded: 0,
  playersRemoved: 0,
  errors: []
}

async function syncPlayersCollection() {
  console.log('🔧 Synchronisation de la collection players pour toutes les équipes...\n')
  
  // 1. Récupérer toutes les équipes
  const teamsSnap = await db.collection('teams').get()
  console.log(`📊 ${teamsSnap.size} équipes trouvées\n`)
  
  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data()
    const teamId = teamDoc.id
    const teamName = teamData.name
    
    console.log(`📋 Traitement de "${teamName}" (${teamId})...`)
    
    try {
      // 2. Récupérer les playerAccounts
      const paSnap = await db.collection('playerAccounts')
        .where('teamId', '==', teamId)
        .get()
      
      const paEmails = new Set(
        paSnap.docs.map(doc => doc.data().email?.toLowerCase()?.trim()).filter(Boolean)
      )
      
      // 3. Récupérer les players existants
      const existingPlayersSnap = await db.collection('players')
        .where('teamId', '==', teamId)
        .get()
      
      const existingPlayersEmails = new Set(
        existingPlayersSnap.docs.map(doc => doc.data().email?.toLowerCase()?.trim()).filter(Boolean)
      )
      
      console.log(`   📊 ${paSnap.size} joueurs dans playerAccounts`)
      console.log(`   📊 ${existingPlayersSnap.size} joueurs dans players`)
      
      // 4. Ajouter les joueurs manquants
      for (const paDoc of paSnap.docs) {
        const paData = paDoc.data()
        const paEmail = paData.email?.toLowerCase()?.trim()
        
        if (!paEmail) continue
        
        if (!existingPlayersEmails.has(paEmail)) {
          const jerseyNumber = paData.jerseyNumber || paData.number || 0
          const newPlayer: any = {
            email: paData.email,
            firstName: paData.firstName,
            lastName: paData.lastName,
            name: `${paData.firstName} ${paData.lastName}`,
            teamId: teamId,
            teamName: teamName,
            number: jerseyNumber,
            jerseyNumber: jerseyNumber,
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
          stats.playersAdded++
          console.log(`   ✅ Ajouté à players: ${paData.firstName} ${paData.lastName}`)
        }
      }
      
      // 5. Supprimer les joueurs orphelins
      for (const playerDoc of existingPlayersSnap.docs) {
        const playerData = playerDoc.data()
        const playerEmail = playerData.email?.toLowerCase()?.trim()
        
        if (playerEmail && !paEmails.has(playerEmail)) {
          await playerDoc.ref.delete()
          stats.playersRemoved++
          console.log(`   🗑️  Supprimé joueur orphelin: ${playerEmail}`)
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
  console.log(`✅ Joueurs ajoutés à players: ${stats.playersAdded}`)
  console.log(`🗑️  Joueurs orphelins supprimés: ${stats.playersRemoved}`)
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ Erreurs: ${stats.errors.length}`)
    stats.errors.slice(0, 10).forEach(e => console.log(`   - ${e}`))
  } else {
    console.log('\n✅ Aucune erreur!')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Synchronisation terminée!')
}

syncPlayersCollection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

