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

async function fixMichaelWaguihEmail() {
  console.log('🔧 Correction de l\'email de Michael Waguih...')
  console.log('============================================================\n')

  const saintsTeamId = 'MHBdumu4cSU6ExLRlrrj'
  const correctEmail = 'michaelnagui033@gmail.com' // Email correct (un seul 'l')
  const wrongEmail = 'michaelnagui033@gmaill.com' // Email avec faute (deux 'l')

  // 1. Corriger dans players
  console.log('1️⃣ Correction dans players...')
  const playersSnap = await db.collection('players')
    .where('teamId', '==', saintsTeamId)
    .where('email', '==', wrongEmail)
    .get()

  if (playersSnap.empty) {
    console.log('   ℹ️  Aucun joueur trouvé avec l\'email incorrect')
  } else {
    for (const doc of playersSnap.docs) {
      const data = doc.data()
      console.log(`   📋 Joueur trouvé (ID: ${doc.id}):`)
      console.log(`      - Email actuel: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      
      await db.collection('players').doc(doc.id).update({
        email: correctEmail,
        updatedAt: new Date()
      })
      console.log(`   ✅ Email corrigé: ${correctEmail}`)
    }
  }

  // 2. Vérifier et corriger dans playerAccounts
  console.log('\n2️⃣ Vérification dans playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('teamId', '==', saintsTeamId)
    .get()

  const michaelAccount = playerAccountsSnap.docs.find(doc => {
    const data = doc.data()
    return data.email?.toLowerCase().includes('michael') || 
           data.email?.toLowerCase().includes('nagui') ||
           (data.firstName?.toLowerCase().includes('michael') && data.lastName?.toLowerCase().includes('waguih')) ||
           (data.firstName?.toLowerCase().includes('nagui') && data.lastName?.toLowerCase().includes('micheal'))
  })

  if (michaelAccount) {
    const data = michaelAccount.data()
    console.log(`   📋 Compte trouvé (ID: ${michaelAccount.id}):`)
    console.log(`      - Email actuel: ${data.email}`)
    console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
    console.log(`      - Team ID: ${data.teamId}`)
    
    if (data.email !== correctEmail) {
      await db.collection('playerAccounts').doc(michaelAccount.id).update({
        email: correctEmail,
        updatedAt: new Date()
      })
      console.log(`   ✅ Email corrigé: ${correctEmail}`)
    } else {
      console.log(`   ✅ Email déjà correct`)
    }
  } else {
    console.log(`   ⚠️  Compte non trouvé dans playerAccounts pour cette équipe`)
  }

  // 3. Vérifier dans teams.players
  console.log('\n3️⃣ Vérification dans teams.players...')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Saints')
    .get()

  if (!teamsSnap.empty) {
    const teamDoc = teamsSnap.docs[0]
    const teamData = teamDoc.data()
    
    if (teamData.players && Array.isArray(teamData.players)) {
      const michaelIndex = teamData.players.findIndex((p: any) => 
        p.email?.toLowerCase().includes('michael') || 
        p.email?.toLowerCase().includes('nagui') ||
        (p.firstName?.toLowerCase().includes('michael') && p.lastName?.toLowerCase().includes('waguih')) ||
        (p.firstName?.toLowerCase().includes('nagui') && p.lastName?.toLowerCase().includes('micheal'))
      )
      
      if (michaelIndex !== -1) {
        const michaelPlayer = teamData.players[michaelIndex]
        console.log(`   📋 Joueur trouvé dans teams.players:`)
        console.log(`      - Email actuel: ${michaelPlayer.email}`)
        console.log(`      - Nom: ${michaelPlayer.firstName} ${michaelPlayer.lastName}`)
        
        if (michaelPlayer.email !== correctEmail) {
          const updatedPlayers = [...teamData.players]
          updatedPlayers[michaelIndex] = {
            ...updatedPlayers[michaelIndex],
            email: correctEmail
          }
          
          await db.collection('teams').doc(teamDoc.id).update({
            players: updatedPlayers,
            updatedAt: new Date()
          })
          console.log(`   ✅ Email corrigé dans teams.players: ${correctEmail}`)
        } else {
          console.log(`   ✅ Email déjà correct dans teams.players`)
        }
      } else {
        console.log(`   ⚠️  Joueur non trouvé dans teams.players`)
      }
    }
  }

  console.log('\n============================================================')
  console.log('✅ Correction terminée!')
  console.log('============================================================')
  console.log('\n💡 Vérifiez maintenant dans l\'interface "Gestion des Équipes"')
  console.log('   Si Michael Waguih n\'apparaît toujours pas:')
  console.log('   1. Rafraîchissez la page (Ctrl+F5 ou Cmd+Shift+R)')
  console.log('   2. Videz le cache du navigateur')
}

fixMichaelWaguihEmail().catch(console.error)

