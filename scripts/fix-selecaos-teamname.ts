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

async function fixSelecaosTeamName() {
  console.log('🔧 Correction des teamName manquants pour Seleçaos...\n')
  
  const teamId = 'hjCfHYcREcloPiMhusMq'
  const teamName = 'Seleçaos'
  
  // Récupérer l'équipe pour confirmer le nom
  const teamDoc = await db.collection('teams').doc(teamId).get()
  if (!teamDoc.exists) {
    console.log(`❌ Équipe avec ID "${teamId}" non trouvée`)
    return
  }
  
  const actualTeamName = teamDoc.data()?.name || teamName
  console.log(`✅ Équipe trouvée: "${actualTeamName}" (ID: ${teamId})\n`)
  
  // Trouver tous les joueurs de cette équipe sans teamName
  const playersSnap = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  console.log(`📊 ${playersSnap.size} joueur(s) trouvé(s) dans playerAccounts\n`)
  
  let updated = 0
  for (const doc of playersSnap.docs) {
    const data = doc.data()
    const currentTeamName = data.teamName
    
    if (!currentTeamName || currentTeamName !== actualTeamName) {
      console.log(`📝 Mise à jour: ${data.firstName} ${data.lastName}`)
      console.log(`   - teamName actuel: ${currentTeamName || 'MANQUANT'}`)
      console.log(`   - Nouveau teamName: ${actualTeamName}`)
      
      await doc.ref.update({
        teamName: actualTeamName
      })
      
      console.log(`   ✅ Mis à jour avec succès!\n`)
      updated++
    } else {
      console.log(`✅ ${data.firstName} ${data.lastName} - Déjà à jour\n`)
    }
  }
  
  console.log(`\n✅ Correction terminée: ${updated} joueur(s) mis à jour`)
}

fixSelecaosTeamName()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

