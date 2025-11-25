import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
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

async function removeMarkSamirCompletely() {
  console.log('🧹 Nettoyage complet de Mark Samir...')
  console.log('============================================================\n')

  const markEmails = [
    'marksamir515@gmail.com',
    'marksamir515@gmaill.com'
  ]
  const saintsTeamId = 'MHBdumu4cSU6ExLRlrrj'

  // 1. Supprimer de players si lié à Saints
  console.log('1️⃣ Nettoyage de players...')
  const playersSnap = await db.collection('players')
    .where('email', 'in', markEmails)
    .get()

  if (playersSnap.empty) {
    console.log('   ℹ️  Aucun joueur trouvé avec ces emails')
  } else {
    for (const doc of playersSnap.docs) {
      const data = doc.data()
      console.log(`   📋 Joueur trouvé (ID: ${doc.id}):`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - Team ID: ${data.teamId || 'N/A'}`)
      
      if (data.teamId === saintsTeamId) {
        // Supprimer complètement le joueur de players
        await db.collection('players').doc(doc.id).delete()
        console.log(`   ✅ Joueur supprimé de players`)
      } else {
        // Retirer juste le teamId
        await db.collection('players').doc(doc.id).update({
          teamId: FieldValue.delete(),
          updatedAt: new Date()
        })
        console.log(`   ✅ teamId retiré du joueur`)
      }
    }
  }

  // 2. Nettoyer playerAccounts
  console.log('\n2️⃣ Nettoyage de playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', 'in', markEmails)
    .get()

  if (playerAccountsSnap.empty) {
    console.log('   ℹ️  Aucun compte trouvé avec ces emails')
  } else {
    for (const doc of playerAccountsSnap.docs) {
      const data = doc.data()
      console.log(`   📋 Compte trouvé (ID: ${doc.id}):`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
      console.log(`      - Team ID: ${data.teamId || 'N/A'}`)
      
      if (data.teamId === saintsTeamId || data.teamId) {
        // Retirer le teamId
        await db.collection('playerAccounts').doc(doc.id).update({
          teamId: FieldValue.delete(),
          teamName: FieldValue.delete(),
          updatedAt: new Date()
        })
        console.log(`   ✅ teamId et teamName retirés du compte`)
      } else {
        console.log(`   ✅ Compte déjà nettoyé (pas de teamId)`)
      }
    }
  }

  // 3. Vérifier dans teams.players (au cas où)
  console.log('\n3️⃣ Vérification dans teams.players...')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Saints')
    .get()

  if (teamsSnap.empty) {
    console.log('   ⚠️  Équipe Saints non trouvée')
  } else {
    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      if (teamData.players && Array.isArray(teamData.players)) {
        const markPlayerIndex = teamData.players.findIndex((p: any) => 
          markEmails.includes(p.email?.toLowerCase()) ||
          (p.firstName?.toLowerCase().includes('mark') && p.lastName?.toLowerCase().includes('samir'))
        )
        
        if (markPlayerIndex !== -1) {
          console.log(`   ⚠️  Mark Samir trouvé dans teams.players à l'index ${markPlayerIndex}`)
          const updatedPlayers = teamData.players.filter((p: any, index: number) => 
            index !== markPlayerIndex
          )
          
          await db.collection('teams').doc(teamDoc.id).update({
            players: updatedPlayers,
            updatedAt: new Date()
          })
          console.log(`   ✅ Mark Samir retiré de teams.players`)
        } else {
          console.log(`   ✅ Mark Samir n'est pas dans teams.players`)
        }
      }
    }
  }

  console.log('\n============================================================')
  console.log('✅ Nettoyage terminé!')
  console.log('============================================================')
}

removeMarkSamirCompletely().catch(console.error)

