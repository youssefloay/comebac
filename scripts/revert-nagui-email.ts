import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

async function revertNaguiEmail() {
  console.log('↩️  Rétablissement de l\'email original de Nagui Micheal...')
  console.log('============================================================\n')

  const naguiEmail = 'michaelnagui033@gmail.com' // Email que j'avais mis (incorrect)
  const originalEmail = 'michaelnagui033@gmaill.com' // Email original (avec deux 'l')
  const saintsTeamId = 'MHBdumu4cSU6ExLRlrrj'

  // 1. Rétablir dans players
  console.log('1️⃣ Rétablissement dans players...')
  const playersSnap = await db.collection('players')
    .where('teamId', '==', saintsTeamId)
    .where('email', '==', naguiEmail)
    .get()

  if (playersSnap.empty) {
    console.log('   ℹ️  Aucun joueur trouvé avec l\'email modifié')
  } else {
    for (const doc of playersSnap.docs) {
      const data = doc.data()
      if (data.firstName?.toLowerCase().includes('nagui') || data.lastName?.toLowerCase().includes('micheal')) {
        await db.collection('players').doc(doc.id).update({
          email: originalEmail,
          updatedAt: new Date()
        })
        console.log(`   ✅ Email rétabli: ${originalEmail}`)
      }
    }
  }

  // 2. Rétablir dans teams.players
  console.log('\n2️⃣ Rétablissement dans teams.players...')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Saints')
    .get()

  if (!teamsSnap.empty) {
    const teamDoc = teamsSnap.docs[0]
    const teamData = teamDoc.data()
    
    if (teamData.players && Array.isArray(teamData.players)) {
      const naguiIndex = teamData.players.findIndex((p: any) => 
        (p.firstName?.toLowerCase().includes('nagui') || p.lastName?.toLowerCase().includes('micheal')) &&
        p.email === naguiEmail
      )
      
      if (naguiIndex !== -1) {
        const updatedPlayers = [...teamData.players]
        updatedPlayers[naguiIndex] = {
          ...updatedPlayers[naguiIndex],
          email: originalEmail
        }
        
        await db.collection('teams').doc(teamDoc.id).update({
          players: updatedPlayers,
          updatedAt: new Date()
        })
        console.log(`   ✅ Email rétabli dans teams.players: ${originalEmail}`)
      } else {
        console.log(`   ℹ️  Email déjà correct ou joueur non trouvé`)
      }
    }
  }

  // 3. Vérifier playerAccounts (ne pas toucher, il a peut-être le bon email)
  console.log('\n3️⃣ Vérification dans playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('teamId', '==', saintsTeamId)
    .get()

  const naguiAccount = playerAccountsSnap.docs.find(doc => {
    const data = doc.data()
    return (data.firstName?.toLowerCase().includes('nagui') || data.lastName?.toLowerCase().includes('micheal')) &&
           data.email === naguiEmail
  })

  if (naguiAccount) {
    const data = naguiAccount.data()
    console.log(`   📋 Compte trouvé (ID: ${naguiAccount.id}):`)
    console.log(`      - Email actuel: ${data.email}`)
    console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
    console.log(`   ℹ️  L'email dans playerAccounts reste ${data.email} (peut être différent de l'original)`)
  } else {
    console.log(`   ℹ️  Compte non trouvé avec l'email modifié`)
  }

  console.log('\n============================================================')
  console.log('✅ Rétablissement terminé!')
  console.log('============================================================')
}

revertNaguiEmail().catch(console.error)

