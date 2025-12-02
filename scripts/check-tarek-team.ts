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

async function checkTarekTeam() {
  console.log('🔍 Vérification de l\'équipe de Tarek Omar...\n')
  
  const teamId = 'hjCfHYcREcloPiMhusMq'
  const email = 'tarekm20053@gmail.com'
  
  // 1. Vérifier l'équipe par teamId
  console.log('📋 1. Équipe correspondant au teamId:')
  const teamDoc = await db.collection('teams').doc(teamId).get()
  
  if (teamDoc.exists) {
    const teamData = teamDoc.data()
    console.log(`✅ Équipe trouvée:`)
    console.log(`   - ID: ${teamDoc.id}`)
    console.log(`   - Nom: ${teamData?.name || 'N/A'}`)
    console.log(`   - Nombre de joueurs dans teams.players: ${(teamData?.players || []).length}`)
    console.log('')
    
    // Vérifier si Tarek est dans teams.players
    const players = teamData?.players || []
    const tarekInTeam = players.find((p: any) => 
      p.email?.toLowerCase() === email.toLowerCase()
    )
    
    if (tarekInTeam) {
      console.log(`   ✅ Tarek Omar trouvé dans teams.players`)
      console.log(`      - Email: ${tarekInTeam.email || 'N/A'}`)
      console.log(`      - Nom: ${tarekInTeam.firstName} ${tarekInTeam.lastName}`)
    } else {
      console.log(`   ❌ Tarek Omar NON trouvé dans teams.players`)
    }
    console.log('')
    
    // 2. Mettre à jour playerAccounts avec le teamName
    console.log('📋 2. Mise à jour de playerAccounts:')
    const playerAccountsSnap = await db.collection('playerAccounts')
      .where('email', '==', email)
      .get()
    
    if (!playerAccountsSnap.empty) {
      for (const doc of playerAccountsSnap.docs) {
        const data = doc.data()
        const currentTeamName = data.teamName || 'MANQUANT'
        const currentTeamId = data.teamId || 'MANQUANT'
        
        console.log(`   📝 Document actuel:`)
        console.log(`      - ID: ${doc.id}`)
        console.log(`      - teamName: ${currentTeamName}`)
        console.log(`      - teamId: ${currentTeamId}`)
        
        if (currentTeamName !== teamData?.name || currentTeamId !== teamId) {
          console.log(`   ⚠️  Mise à jour nécessaire:`)
          console.log(`      - Nouveau teamName: ${teamData?.name}`)
          console.log(`      - Nouveau teamId: ${teamId}`)
          
          await doc.ref.update({
            teamName: teamData?.name,
            teamId: teamId
          })
          
          console.log(`   ✅ Document mis à jour avec succès!`)
        } else {
          console.log(`   ✅ Déjà à jour`)
        }
        console.log('')
      }
    }
    
    // 3. Vérifier tous les joueurs de cette équipe dans playerAccounts
    console.log(`📋 3. Tous les joueurs de "${teamData?.name}" dans playerAccounts:`)
    const teamPlayersSnap = await db.collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()
    
    console.log(`   📊 ${teamPlayersSnap.size} joueur(s) trouvé(s)`)
    teamPlayersSnap.docs.forEach((doc, index) => {
      const data = doc.data()
      const isTarek = data.email?.toLowerCase() === email.toLowerCase()
      console.log(`   ${index + 1}. ${data.firstName} ${data.lastName} (${data.email})`)
      console.log(`      - teamName: ${data.teamName || '❌ MANQUANT'}`)
      console.log(`      - teamId: ${data.teamId || '❌ MANQUANT'}`)
      if (isTarek) {
        console.log(`      ⭐ C'EST TAREK OMAR`)
      }
      console.log('')
    })
  } else {
    console.log(`   ❌ Équipe avec ID "${teamId}" non trouvée`)
    console.log('')
  }
  
  console.log('\n✅ Vérification terminée')
}

checkTarekTeam()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

