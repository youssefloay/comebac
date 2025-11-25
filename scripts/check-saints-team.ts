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

async function checkSaintsTeam() {
  console.log('🔍 Vérification de l\'équipe "Saints"...')
  console.log('============================================================\n')

  const teamName = 'Saints'

  // 1. Vérifier dans teamRegistrations
  console.log('1️⃣ teamRegistrations:')
  const registrationsSnap = await db.collection('teamRegistrations')
    .where('teamName', '==', teamName)
    .get()

  if (registrationsSnap.empty) {
    console.log('   ❌ Aucune inscription trouvée')
  } else {
    const latestReg = registrationsSnap.docs[0].data()
    console.log(`   ✅ Inscription trouvée (${registrationsSnap.docs.length} au total)`)
    console.log(`   📅 Dernière mise à jour: ${latestReg.lastUpdatedAt?.toDate() || latestReg.createdAt?.toDate() || 'N/A'}`)
    console.log(`   👥 Nombre de joueurs: ${latestReg.players?.length || 0}`)
    
    if (latestReg.players && Array.isArray(latestReg.players)) {
      const markPlayer = latestReg.players.find((p: any) => 
        p.email?.toLowerCase().includes('mark') || 
        p.email?.toLowerCase().includes('samir') ||
        (p.firstName?.toLowerCase().includes('mark') && p.lastName?.toLowerCase().includes('samir'))
      )
      const michaelPlayer = latestReg.players.find((p: any) => 
        p.email?.toLowerCase().includes('michael') || 
        p.email?.toLowerCase().includes('waguih') ||
        p.email?.toLowerCase().includes('nagui') ||
        (p.firstName?.toLowerCase().includes('michael') && p.lastName?.toLowerCase().includes('waguih')) ||
        (p.firstName?.toLowerCase().includes('nagui') && p.lastName?.toLowerCase().includes('micheal'))
      )

      if (markPlayer) {
        console.log(`\n   ⚠️  Mark Samir trouvé:`)
        console.log(`      - Email: ${markPlayer.email}`)
        console.log(`      - Nom: ${markPlayer.firstName} ${markPlayer.lastName}`)
      } else {
        console.log(`\n   ✅ Mark Samir n'est PAS dans l'inscription`)
      }

      if (michaelPlayer) {
        console.log(`\n   ✅ Michael Waguih trouvé:`)
        console.log(`      - Email: ${michaelPlayer.email}`)
        console.log(`      - Nom: ${michaelPlayer.firstName} ${michaelPlayer.lastName}`)
      } else {
        console.log(`\n   ❌ Michael Waguih n'est PAS dans l'inscription`)
      }
    }
  }

  // 2. Vérifier dans teams
  console.log('\n2️⃣ teams:')
  const teamsSnap = await db.collection('teams')
    .where('name', '==', teamName)
    .get()

  if (teamsSnap.empty) {
    console.log('   ❌ Aucune équipe trouvée')
  } else {
    const teamData = teamsSnap.docs[0].data()
    const teamId = teamsSnap.docs[0].id
    console.log(`   ✅ Équipe trouvée (ID: ${teamId})`)
    console.log(`   👥 Nombre de joueurs: ${teamData.players?.length || 0}`)
    
    if (teamData.players && Array.isArray(teamData.players)) {
      const markPlayer = teamData.players.find((p: any) => 
        p.email?.toLowerCase().includes('mark') || 
        p.email?.toLowerCase().includes('samir') ||
        (p.firstName?.toLowerCase().includes('mark') && p.lastName?.toLowerCase().includes('samir'))
      )
      const michaelPlayer = teamData.players.find((p: any) => 
        p.email?.toLowerCase().includes('michael') || 
        p.email?.toLowerCase().includes('waguih') ||
        p.email?.toLowerCase().includes('nagui') ||
        (p.firstName?.toLowerCase().includes('michael') && p.lastName?.toLowerCase().includes('waguih')) ||
        (p.firstName?.toLowerCase().includes('nagui') && p.lastName?.toLowerCase().includes('micheal'))
      )

      if (markPlayer) {
        console.log(`\n   ⚠️  Mark Samir trouvé:`)
        console.log(`      - Email: ${markPlayer.email}`)
        console.log(`      - Nom: ${markPlayer.firstName} ${markPlayer.lastName}`)
      } else {
        console.log(`\n   ✅ Mark Samir n'est PAS dans l'équipe`)
      }

      if (michaelPlayer) {
        console.log(`\n   ✅ Michael Waguih trouvé:`)
        console.log(`      - Email: ${michaelPlayer.email}`)
        console.log(`      - Nom: ${michaelPlayer.firstName} ${michaelPlayer.lastName}`)
      } else {
        console.log(`\n   ❌ Michael Waguih n'est PAS dans l'équipe`)
      }

      // Afficher tous les joueurs de l'équipe
      console.log(`\n   📋 Liste complète des joueurs:`)
      teamData.players.forEach((p: any, index: number) => {
        console.log(`      ${index + 1}. ${p.firstName} ${p.lastName} (${p.email})`)
      })
    }
  }

  // 3. Vérifier dans players pour cette équipe
  console.log('\n3️⃣ players (pour cette équipe):')
  if (!teamsSnap.empty) {
    const teamId = teamsSnap.docs[0].id
    const playersSnap = await db.collection('players')
      .where('teamId', '==', teamId)
      .get()

    console.log(`   👥 Nombre de joueurs: ${playersSnap.docs.length}`)
    
    const markPlayer = playersSnap.docs.find(doc => {
      const data = doc.data()
      return data.email?.toLowerCase().includes('mark') || 
             data.email?.toLowerCase().includes('samir') ||
             (data.firstName?.toLowerCase().includes('mark') && data.lastName?.toLowerCase().includes('samir'))
    })
    const michaelPlayer = playersSnap.docs.find(doc => {
      const data = doc.data()
      return data.email?.toLowerCase().includes('michael') || 
             data.email?.toLowerCase().includes('waguih') ||
             data.email?.toLowerCase().includes('nagui') ||
             (data.firstName?.toLowerCase().includes('michael') && data.lastName?.toLowerCase().includes('waguih')) ||
             (data.firstName?.toLowerCase().includes('nagui') && data.lastName?.toLowerCase().includes('micheal'))
    })

    if (markPlayer) {
      const data = markPlayer.data()
      console.log(`\n   ⚠️  Mark Samir trouvé:`)
      console.log(`      - ID: ${markPlayer.id}`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
    } else {
      console.log(`\n   ✅ Mark Samir n'est PAS dans players pour cette équipe`)
    }

    if (michaelPlayer) {
      const data = michaelPlayer.data()
      console.log(`\n   ✅ Michael Waguih trouvé:`)
      console.log(`      - ID: ${michaelPlayer.id}`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
    } else {
      console.log(`\n   ❌ Michael Waguih n'est PAS dans players pour cette équipe`)
    }
  }

  // 4. Vérifier dans playerAccounts pour cette équipe
  console.log('\n4️⃣ playerAccounts (pour cette équipe):')
  if (!teamsSnap.empty) {
    const teamId = teamsSnap.docs[0].id
    const playerAccountsSnap = await db.collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()

    console.log(`   👥 Nombre de comptes: ${playerAccountsSnap.docs.length}`)
    
    const markAccount = playerAccountsSnap.docs.find(doc => {
      const data = doc.data()
      return data.email?.toLowerCase().includes('mark') || 
             data.email?.toLowerCase().includes('samir') ||
             (data.firstName?.toLowerCase().includes('mark') && data.lastName?.toLowerCase().includes('samir'))
    })
    const michaelAccount = playerAccountsSnap.docs.find(doc => {
      const data = doc.data()
      return data.email?.toLowerCase().includes('michael') || 
             data.email?.toLowerCase().includes('waguih') ||
             data.email?.toLowerCase().includes('nagui') ||
             (data.firstName?.toLowerCase().includes('michael') && data.lastName?.toLowerCase().includes('waguih')) ||
             (data.firstName?.toLowerCase().includes('nagui') && data.lastName?.toLowerCase().includes('micheal'))
    })

    if (markAccount) {
      const data = markAccount.data()
      console.log(`\n   ⚠️  Mark Samir trouvé:`)
      console.log(`      - ID: ${markAccount.id}`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
    } else {
      console.log(`\n   ✅ Mark Samir n'est PAS dans playerAccounts pour cette équipe`)
    }

    if (michaelAccount) {
      const data = michaelAccount.data()
      console.log(`\n   ✅ Michael Waguih trouvé:`)
      console.log(`      - ID: ${michaelAccount.id}`)
      console.log(`      - Email: ${data.email}`)
      console.log(`      - Nom: ${data.firstName} ${data.lastName}`)
    } else {
      console.log(`\n   ❌ Michael Waguih n'est PAS dans playerAccounts pour cette équipe`)
    }
  }

  console.log('\n============================================================')
  console.log('📊 CONCLUSION:')
  console.log('============================================================')
}

checkSaintsTeam().catch(console.error)

