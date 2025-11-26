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

async function fixIssues() {
  console.log('🔧 Correction des problèmes identifiés...\n')
  
  const stats = {
    playersFixed: 0,
    playersCreated: 0,
    teamsCleaned: 0,
    namesFixed: 0,
    errors: [] as string[]
  }
  
  try {
    // 1. Créer les joueurs manquants dans playerAccounts depuis teams.players
    console.log('📋 1. Création des joueurs manquants dans playerAccounts...')
    const teamsSnap = await db.collection('teams').get()
    const playerAccountsSnap = await db.collection('playerAccounts').get()
    
    const existingEmails = new Set<string>()
    playerAccountsSnap.forEach(doc => {
      const email = doc.data().email?.toLowerCase()?.trim()
      if (email) existingEmails.add(email)
    })
    
    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      const teamId = teamDoc.id
      const players = teamData.players || []
      
      for (const player of players) {
        const email = player.email?.toLowerCase()?.trim()
        if (!email || existingEmails.has(email)) continue
        
        // Créer l'entrée dans playerAccounts
        try {
          await db.collection('playerAccounts').add({
            firstName: player.firstName || '',
            lastName: player.lastName || '',
            nickname: player.nickname || '',
            email: email,
            phone: player.phone || '',
            position: player.position || '',
            jerseyNumber: player.number || player.jerseyNumber || 0,
            number: player.number || player.jerseyNumber || 0,
            teamId: teamId,
            teamName: teamData.name || '',
            birthDate: player.birthDate || '',
            height: player.height || 0,
            tshirtSize: player.tshirtSize || 'M',
            foot: player.foot || '',
            grade: player.grade || '',
            createdAt: new Date(),
            updatedAt: new Date()
          })
          existingEmails.add(email)
          stats.playersCreated++
          console.log(`   ✅ Créé playerAccount pour ${email}`)
        } catch (error: any) {
          stats.errors.push(`Erreur création playerAccount ${email}: ${error.message}`)
        }
      }
    }
    
    console.log(`   ✅ ${stats.playersCreated} joueurs créés\n`)
    
    // 2. Corriger les incohérences de nom entre playerAccounts et players
    console.log('📋 2. Correction des incohérences de nom...')
    const playersSnap = await db.collection('players').get()
    const playerAccountsMap = new Map<string, any>()
    
    playerAccountsSnap.forEach(doc => {
      const data = doc.data()
      const email = data.email?.toLowerCase()?.trim()
      if (email) {
        playerAccountsMap.set(email, { id: doc.id, ...data })
      }
    })
    
    for (const playerDoc of playersSnap.docs) {
      const playerData = playerDoc.data()
      const email = playerData.email?.toLowerCase()?.trim()
      
      if (email && playerAccountsMap.has(email)) {
        const accountData = playerAccountsMap.get(email)!
        
        if (accountData.firstName !== playerData.firstName || accountData.lastName !== playerData.lastName) {
          try {
            await playerDoc.ref.update({
              firstName: accountData.firstName,
              lastName: accountData.lastName,
              name: `${accountData.firstName} ${accountData.lastName}`,
              updatedAt: new Date()
            })
            stats.namesFixed++
            console.log(`   ✅ Nom corrigé pour ${email}`)
          } catch (error: any) {
            stats.errors.push(`Erreur correction nom ${email}: ${error.message}`)
          }
        }
      }
    }
    
    console.log(`   ✅ ${stats.namesFixed} noms corrigés\n`)
    
    // 3. Nettoyer les équipes sans joueurs (optionnel - commenté pour sécurité)
    console.log('📋 3. Analyse des équipes sans joueurs...')
    let emptyTeamsCount = 0
    
    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      if (!teamData.players || teamData.players.length === 0) {
        emptyTeamsCount++
        console.log(`   ⚠️  Équipe "${teamData.name}" sans joueurs (ID: ${teamDoc.id})`)
        // Optionnel: marquer comme inactive au lieu de supprimer
        // await teamDoc.ref.update({ isActive: false, updatedAt: new Date() })
      }
    }
    
    console.log(`   ℹ️  ${emptyTeamsCount} équipes sans joueurs (non modifiées pour sécurité)\n`)
    
    // 4. Assigner les joueurs orphelins à leur équipe si possible
    console.log('📋 4. Assignation des joueurs orphelins...')
    const orphanPlayers = await db.collection('playerAccounts')
      .where('teamId', '==', null)
      .get()
    
    // Chercher dans players pour trouver leur teamId
    for (const orphanDoc of orphanPlayers.docs) {
      const orphanData = orphanDoc.data()
      const email = orphanData.email?.toLowerCase()?.trim()
      
      if (!email) continue
      
      // Chercher dans players
      const playersWithEmail = await db.collection('players')
        .where('email', '==', email)
        .limit(1)
        .get()
      
      if (!playersWithEmail.empty) {
        const playerData = playersWithEmail.docs[0].data()
        if (playerData.teamId) {
          // Récupérer le nom de l'équipe
          const teamDoc = await db.collection('teams').doc(playerData.teamId).get()
          if (teamDoc.exists) {
            try {
              await orphanDoc.ref.update({
                teamId: playerData.teamId,
                teamName: teamDoc.data()?.name || '',
                updatedAt: new Date()
              })
              stats.playersFixed++
              console.log(`   ✅ Joueur ${email} assigné à l'équipe ${teamDoc.data()?.name}`)
            } catch (error: any) {
              stats.errors.push(`Erreur assignation ${email}: ${error.message}`)
            }
          }
        }
      }
    }
    
    console.log(`   ✅ ${stats.playersFixed} joueurs assignés\n`)
    
    // Résumé
    console.log('📊 Résumé des corrections:\n')
    console.log(`✅ Joueurs créés: ${stats.playersCreated}`)
    console.log(`✅ Joueurs assignés: ${stats.playersFixed}`)
    console.log(`✅ Noms corrigés: ${stats.namesFixed}`)
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Erreurs (${stats.errors.length}):`)
      stats.errors.slice(0, 10).forEach(error => console.log(`   - ${error}`))
      if (stats.errors.length > 10) {
        console.log(`   ... et ${stats.errors.length - 10} autres erreurs`)
      }
    }
    
    console.log('\n✅ Corrections terminées!')
    
  } catch (error: any) {
    console.error('❌ Erreur lors des corrections:', error)
    throw error
  }
}

console.log('⚠️  Ce script va corriger les problèmes identifiés dans la BDD')
console.log('   - Créer les joueurs manquants')
console.log('   - Corriger les incohérences de nom')
console.log('   - Assigner les joueurs orphelins')
console.log('\n   Appuyez sur Ctrl+C pour annuler, ou attendez 3 secondes...\n')

setTimeout(() => {
  fixIssues()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erreur:', error)
      process.exit(1)
    })
}, 3000)

