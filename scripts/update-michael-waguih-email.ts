import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
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
const auth = getAuth()

async function updateMichaelWaguihEmail() {
  console.log('🔄 Mise à jour de l\'email de Michael Waguih...')
  console.log('============================================================\n')

  const oldEmail = 'michaelawaguih0@gmail.com'
  const newEmail = 'michaelwaguih0@gmail.com'
  const saintsTeamId = 'MHBdumu4cSU6ExLRlrrj'

  // 1. Mettre à jour l'email dans Firebase Auth
  console.log('1️⃣ Mise à jour dans Firebase Auth...')
  try {
    const user = await auth.getUserByEmail(oldEmail)
    console.log(`   📋 Compte Auth trouvé (UID: ${user.uid}):`)
    console.log(`      - Ancien email: ${user.email}`)
    
    await auth.updateUser(user.uid, {
      email: newEmail,
      emailVerified: false // Réinitialiser la vérification
    })
    
    console.log(`   ✅ Email mis à jour dans Firebase Auth: ${newEmail}`)
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`   ⚠️  Compte Auth non trouvé avec l'ancien email`)
      console.log(`   💡 Création d'un nouveau compte Auth...`)
      
      // Créer un nouveau compte
      const newUser = await auth.createUser({
        email: newEmail,
        emailVerified: false,
        displayName: 'Michael Waguih'
      })
      console.log(`   ✅ Nouveau compte Auth créé (UID: ${newUser.uid})`)
      
      // Mettre à jour playerAccounts avec le nouveau UID
      const playerAccountsSnap = await db.collection('playerAccounts')
        .where('email', '==', newEmail)
        .get()
      
      if (!playerAccountsSnap.empty) {
        await db.collection('playerAccounts').doc(playerAccountsSnap.docs[0].id).update({
          uid: newUser.uid
        })
        console.log(`   ✅ UID mis à jour dans playerAccounts`)
      }
    } else {
      console.error(`   ❌ Erreur: ${error.message}`)
      throw error
    }
  }

  // 2. Vérifier et mettre à jour playerAccounts
  console.log('\n2️⃣ Vérification dans playerAccounts...')
  const playerAccountsSnap = await db.collection('playerAccounts')
    .where('email', 'in', [newEmail, oldEmail])
    .get()

  for (const doc of playerAccountsSnap.docs) {
    const data = doc.data()
    if (data.email !== newEmail) {
      await db.collection('playerAccounts').doc(doc.id).update({
        email: newEmail,
        updatedAt: new Date()
      })
      console.log(`   ✅ Email mis à jour dans playerAccounts: ${doc.id}`)
    } else {
      console.log(`   ✅ Email déjà correct dans playerAccounts: ${doc.id}`)
    }
  }

  // 3. Mettre à jour dans teams.players
  console.log('\n3️⃣ Mise à jour dans teams.players...')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', 'Saints')
    .get()

  if (!teamsSnap.empty) {
    const teamDoc = teamsSnap.docs[0]
    const teamData = teamDoc.data()
    
    if (teamData.players && Array.isArray(teamData.players)) {
      const michaelIndex = teamData.players.findIndex((p: any) => 
        p.email?.toLowerCase() === oldEmail.toLowerCase() ||
        p.email?.toLowerCase() === newEmail.toLowerCase()
      )
      
      if (michaelIndex !== -1 && teamData.players[michaelIndex].email !== newEmail) {
        const updatedPlayers = [...teamData.players]
        updatedPlayers[michaelIndex] = {
          ...updatedPlayers[michaelIndex],
          email: newEmail
        }
        
        await db.collection('teams').doc(teamDoc.id).update({
          players: updatedPlayers,
          updatedAt: new Date()
        })
        console.log(`   ✅ Email mis à jour dans teams.players`)
      } else if (michaelIndex !== -1) {
        console.log(`   ✅ Email déjà correct dans teams.players`)
      } else {
        console.log(`   ⚠️  Joueur non trouvé dans teams.players`)
      }
    }
  }

  // 4. Mettre à jour dans players
  console.log('\n4️⃣ Mise à jour dans players...')
  const playersSnap = await db.collection('players')
    .where('teamId', '==', saintsTeamId)
    .get()

  const michaelPlayer = playersSnap.docs.find(doc => {
    const data = doc.data()
    return data.email?.toLowerCase() === oldEmail.toLowerCase() ||
           data.email?.toLowerCase() === newEmail.toLowerCase()
  })

  if (michaelPlayer) {
    const data = michaelPlayer.data()
    if (data.email !== newEmail) {
      await db.collection('players').doc(michaelPlayer.id).update({
        email: newEmail,
        updatedAt: new Date()
      })
      console.log(`   ✅ Email mis à jour dans players`)
    } else {
      console.log(`   ✅ Email déjà correct dans players`)
    }
  } else {
    console.log(`   ⚠️  Joueur non trouvé dans players`)
  }

  // 5. Mettre à jour dans teamRegistrations
  console.log('\n5️⃣ Mise à jour dans teamRegistrations...')
  const registrationsSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', 'Saints')
    .get()

  for (const regDoc of registrationsSnap.docs) {
    const regData = regDoc.data()
    if (regData.players && Array.isArray(regData.players)) {
      let updated = false
      const updatedPlayers = regData.players.map((p: any) => {
        if (p.email?.toLowerCase() === oldEmail.toLowerCase()) {
          updated = true
          return { ...p, email: newEmail }
        }
        return p
      })
      
      if (updated) {
        await db.collection('teamRegistrations').doc(regDoc.id).update({
          players: updatedPlayers,
          lastUpdatedAt: new Date()
        })
        console.log(`   ✅ Email mis à jour dans teamRegistrations`)
      } else {
        console.log(`   ✅ Email déjà correct ou non trouvé dans teamRegistrations`)
      }
    }
  }

  console.log('\n============================================================')
  console.log('✅ Mise à jour terminée!')
  console.log('============================================================')
  console.log(`L'email a été mis à jour de ${oldEmail} à ${newEmail}`)
  console.log('Vous pouvez maintenant envoyer l\'email d\'activation.')
}

updateMichaelWaguihEmail().catch(console.error)

