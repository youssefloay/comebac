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

async function fixSaintsPlayersCount() {
  console.log('🔧 Correction du nombre de joueurs pour l\'équipe "Saints"...\n')
  
  const teamName = 'Saints'
  
  // 1. Récupérer l'équipe
  const teamsSnap = await db.collection('teams')
    .where('name', '==', teamName)
    .get()
  
  if (teamsSnap.empty) {
    console.error('❌ Équipe "Saints" non trouvée dans teams')
    return
  }
  
  const teamDoc = teamsSnap.docs[0]
  const teamId = teamDoc.id
  const teamData = teamDoc.data()
  const teamsPlayers = teamData.players || []
  
  console.log(`✅ Équipe trouvée (ID: ${teamId})`)
  console.log(`📊 Joueurs dans teams.players: ${teamsPlayers.length}\n`)
  
  // 2. Récupérer les emails des joueurs valides dans teams.players
  const validPlayerEmails = new Set<string>()
  teamsPlayers.forEach((player: any) => {
    const email = player.email?.toLowerCase()?.trim()
    if (email) validPlayerEmails.add(email)
  })
  
  console.log(`📋 Emails valides dans teams.players: ${validPlayerEmails.size}`)
  validPlayerEmails.forEach(email => console.log(`   - ${email}`))
  console.log('')
  
  // 3. Vérifier tous les playerAccounts avec teamName="Saints"
  console.log('📋 Vérification des playerAccounts avec teamName="Saints"...')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('teamName', '==', teamName)
    .get()
  
  console.log(`   Total trouvé: ${playerAccountsSnap.size}\n`)
  
  let fixed = 0
  let removed = 0
  
  for (const accountDoc of playerAccountsSnap.docs) {
    const accountData = accountDoc.data()
    const email = accountData.email?.toLowerCase()?.trim()
    const accountTeamId = accountData.teamId
    
    if (!email) continue
    
    if (!validPlayerEmails.has(email)) {
      // Ce joueur n'est plus dans teams.players
      console.log(`   ⚠️  Joueur ${email} a teamName="Saints" mais n'est pas dans teams.players`)
      
      if (accountTeamId === teamId) {
        // Retirer le teamId et teamName
        try {
          await accountDoc.ref.update({
            teamId: null,
            teamName: null,
            updatedAt: new Date()
          })
          removed++
          console.log(`      ✅ Retiré de l'équipe Saints`)
        } catch (error: any) {
          console.error(`      ❌ Erreur: ${error.message}`)
        }
      } else {
        // Le teamId ne correspond pas, juste retirer teamName
        try {
          await accountDoc.ref.update({
            teamName: null,
            updatedAt: new Date()
          })
          removed++
          console.log(`      ✅ Retiré teamName (teamId différent: ${accountTeamId})`)
        } catch (error: any) {
          console.error(`      ❌ Erreur: ${error.message}`)
        }
      }
    } else {
      // Le joueur est valide, s'assurer que teamId est correct
      if (accountTeamId !== teamId) {
        try {
          await accountDoc.ref.update({
            teamId: teamId,
            teamName: teamName,
            updatedAt: new Date()
          })
          fixed++
          console.log(`   ✅ Joueur ${email} corrigé (teamId mis à jour)`)
        } catch (error: any) {
          console.error(`   ❌ Erreur pour ${email}: ${error.message}`)
        }
      }
    }
  }
  
  // 4. Vérifier aussi par teamId
  console.log('\n📋 Vérification des playerAccounts avec teamId...')
  const playerAccountsByTeamIdSnap = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  console.log(`   Total avec teamId="${teamId}": ${playerAccountsByTeamIdSnap.size}`)
  
  for (const accountDoc of playerAccountsByTeamIdSnap.docs) {
    const accountData = accountDoc.data()
    const email = accountData.email?.toLowerCase()?.trim()
    
    if (!email) continue
    
    if (!validPlayerEmails.has(email)) {
      // Ce joueur a le teamId mais n'est plus dans teams.players
      console.log(`   ⚠️  Joueur ${email} a teamId="${teamId}" mais n'est pas dans teams.players`)
      
      try {
        await accountDoc.ref.update({
          teamId: null,
          teamName: null,
          updatedAt: new Date()
        })
        removed++
        console.log(`      ✅ Retiré de l'équipe`)
      } catch (error: any) {
        console.error(`      ❌ Erreur: ${error.message}`)
      }
    }
  }
  
  // Résumé
  console.log('\n📊 Résumé:\n')
  console.log(`✅ Joueurs corrigés: ${fixed}`)
  console.log(`🗑️  Joueurs retirés de l'équipe: ${removed}`)
  console.log(`📊 Nombre final attendu dans playerAccounts: ${validPlayerEmails.size}`)
  
  // Vérification finale
  const finalCount = (await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()).size
  
  console.log(`📊 Nombre final réel dans playerAccounts: ${finalCount}`)
  
  if (finalCount === validPlayerEmails.size) {
    console.log('\n✅ Correction réussie! Le nombre devrait maintenant être correct dans l\'interface.')
  } else {
    console.log(`\n⚠️  Il reste une différence de ${Math.abs(finalCount - validPlayerEmails.size)} joueurs`)
  }
  
  console.log('\n✅ Correction terminée')
}

fixSaintsPlayersCount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

