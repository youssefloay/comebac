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

async function checkTarekOmarSelecao() {
  console.log('🔍 Vérification de Tarek Omar et son équipe Selecao...\n')
  
  const email = 'tarekm20053@gmail.com'
  const firstName = 'Tarek'
  const lastName = 'Omar'
  
  // 1. Vérifier dans playerAccounts
  console.log('📋 1. playerAccounts:')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', '==', email)
    .get()
  
  if (!playerAccountsSnap.empty) {
    playerAccountsSnap.forEach(doc => {
      const data = doc.data()
      console.log(`✅ Tarek Omar trouvé dans playerAccounts:`)
      console.log(`   - ID: ${doc.id}`)
      console.log(`   - Email: ${data.email}`)
      console.log(`   - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`   - Surnom: ${data.nickname || 'N/A'}`)
      console.log(`   - teamId: ${data.teamId || '❌ MANQUANT'}`)
      console.log(`   - teamName: ${data.teamName || '❌ MANQUANT'}`)
      console.log(`   - Position: ${data.position || 'N/A'}`)
      console.log(`   - Numéro: ${data.jerseyNumber || 'N/A'}`)
      console.log('')
    })
  } else {
    console.log('   ❌ Tarek Omar non trouvé dans playerAccounts')
    console.log('')
  }
  
  // 2. Chercher l'équipe Selecao
  console.log('📋 2. Recherche de l\'équipe "Selecao":')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Selecao')
    .get()
  
  if (!teamsSnap.empty) {
    teamsSnap.forEach(doc => {
      const teamData = doc.data()
      console.log(`✅ Équipe Selecao trouvée:`)
      console.log(`   - ID: ${doc.id}`)
      console.log(`   - Nom: ${teamData.name}`)
      console.log(`   - Nombre de joueurs dans teams.players: ${(teamData.players || []).length}`)
      console.log('')
      
      // Vérifier si Tarek est dans teams.players
      const players = teamData.players || []
      const tarekInTeam = players.find((p: any) => 
        p.email?.toLowerCase() === email.toLowerCase() ||
        (p.firstName?.toLowerCase() === firstName.toLowerCase() && 
         p.lastName?.toLowerCase() === lastName.toLowerCase())
      )
      
      if (tarekInTeam) {
        console.log(`   ✅ Tarek Omar trouvé dans teams.players`)
        console.log(`      - Email: ${tarekInTeam.email || 'N/A'}`)
        console.log(`      - Nom: ${tarekInTeam.firstName} ${tarekInTeam.lastName}`)
      } else {
        console.log(`   ❌ Tarek Omar NON trouvé dans teams.players`)
      }
      console.log('')
    })
  } else {
    console.log('   ❌ Équipe "Selecao" non trouvée')
    console.log('')
    
    // Chercher des variations
    console.log('   🔍 Recherche de variations du nom...')
    const allTeamsSnap = await db.collection('teams').get()
    const selecaoVariations = allTeamsSnap.docs.filter(doc => {
      const name = doc.data().name?.toLowerCase() || ''
      return name.includes('selecao') || name.includes('seleção') || name.includes('seleca')
    })
    
    if (selecaoVariations.length > 0) {
      console.log(`   ⚠️  Variations trouvées:`)
      selecaoVariations.forEach(doc => {
        const teamData = doc.data()
        console.log(`      - "${teamData.name}" (ID: ${doc.id})`)
      })
    } else {
      console.log('   ❌ Aucune variation trouvée')
    }
    console.log('')
  }
  
  // 3. Vérifier tous les joueurs de Selecao dans playerAccounts
  if (!teamsSnap.empty) {
    const teamId = teamsSnap.docs[0].id
    console.log(`📋 3. Tous les joueurs de Selecao dans playerAccounts (teamId: ${teamId}):`)
    const selecaoPlayersSnap = await db.collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()
    
    console.log(`   📊 ${selecaoPlayersSnap.size} joueur(s) trouvé(s)`)
    selecaoPlayersSnap.docs.forEach((doc, index) => {
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
    
    // Vérifier aussi par teamName
    console.log(`📋 4. Joueurs avec teamName="Selecao" dans playerAccounts:`)
    const byTeamNameSnap = await db.collection('playerAccounts')
      .where('teamName', '==', 'Selecao')
      .get()
    
    console.log(`   📊 ${byTeamNameSnap.size} joueur(s) trouvé(s)`)
    byTeamNameSnap.docs.forEach((doc, index) => {
      const data = doc.data()
      const isTarek = data.email?.toLowerCase() === email.toLowerCase()
      console.log(`   ${index + 1}. ${data.firstName} ${data.lastName} (${data.email})`)
      console.log(`      - teamId: ${data.teamId || '❌ MANQUANT'}`)
      if (isTarek) {
        console.log(`      ⭐ C'EST TAREK OMAR`)
      }
      console.log('')
    })
  }
  
  // 5. Vérifier dans teamRegistrations
  console.log('📋 5. Vérification dans teamRegistrations:')
  const registrationsSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', 'Selecao')
    .get()
  
  if (!registrationsSnap.empty) {
    registrationsSnap.forEach(regDoc => {
      const regData = regDoc.data()
      const players = regData.players || []
      console.log(`✅ Inscription Selecao trouvée (ID: ${regDoc.id})`)
      console.log(`   - Statut: ${regData.status || 'N/A'}`)
      console.log(`   - Nombre de joueurs: ${players.length}`)
      
      const tarekInReg = players.find((p: any) => 
        p.email?.toLowerCase() === email.toLowerCase() ||
        (p.firstName?.toLowerCase() === firstName.toLowerCase() && 
         p.lastName?.toLowerCase() === lastName.toLowerCase())
      )
      
      if (tarekInReg) {
        console.log(`   ✅ Tarek Omar trouvé dans teamRegistrations.players`)
        console.log(`      - Email: ${tarekInReg.email || 'N/A'}`)
      } else {
        console.log(`   ❌ Tarek Omar NON trouvé dans teamRegistrations.players`)
      }
      console.log('')
    })
  } else {
    console.log('   ❌ Aucune inscription Selecao trouvée')
    console.log('')
  }
  
  console.log('\n✅ Vérification terminée')
}

checkTarekOmarSelecao()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

