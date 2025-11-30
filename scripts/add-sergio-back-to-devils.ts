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

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error('❌ Variables d\'environnement Firebase manquantes')
    process.exit(1)
  }

  initializeApp({
    credential: cert(serviceAccount)
  })
}

const db = getFirestore()

async function addSergioBack() {
  try {
    console.log('🔧 Ajout de Sergio Armani dans l\'inscription Devils...\n')

    // 1. Trouver l'inscription Devils
    const devilsRegistrations = await db.collection('teamRegistrations')
      .where('teamName', '==', 'Devils')
      .get()

    if (devilsRegistrations.empty) {
      console.log('❌ Inscription Devils non trouvée')
      return
    }

    const registration = devilsRegistrations.docs[0]
    const registrationId = registration.id
    const data = registration.data()
    const players = data.players || []

    console.log(`✅ Inscription Devils trouvée`)
    console.log(`   Nombre de joueurs actuel: ${players.length}\n`)

    // 2. Vérifier si Sergio Armani est déjà présent
    const sergioExists = players.some((p: any) => 
      p.firstName === 'Sergio' && p.lastName === 'Armani'
    )

    if (sergioExists) {
      console.log('✅ Sergio Armani est déjà dans l\'inscription')
      return
    }

    // 3. Récupérer les données de Sergio Armani depuis playerAccounts
    const sergioAccounts = await db.collection('playerAccounts')
      .where('email', '==', 'sergioarmani2009@gmail.com')
      .where('teamId', '==', 'xcughtfAhtqVSvc2FbEG')
      .get()

    if (sergioAccounts.empty) {
      console.log('❌ Compte Sergio Armani non trouvé dans playerAccounts')
      return
    }

    const sergioAccount = sergioAccounts.docs[0].data()
    console.log(`📋 Données de Sergio Armani trouvées:`)
    console.log(`   - Prénom: ${sergioAccount.firstName}`)
    console.log(`   - Nom: ${sergioAccount.lastName}`)
    console.log(`   - Email: ${sergioAccount.email}`)
    console.log(`   - Position: ${sergioAccount.position || 'N/A'}`)
    console.log(`   - Numéro: ${sergioAccount.jerseyNumber || 'N/A'}\n`)

    // 4. Créer l'entrée pour l'inscription
    const sergioPlayerData = {
      firstName: sergioAccount.firstName,
      lastName: sergioAccount.lastName,
      email: sergioAccount.email,
      phone: sergioAccount.phone || '',
      birthDate: sergioAccount.birthDate || '',
      height: sergioAccount.height || 0,
      tshirtSize: sergioAccount.tshirtSize || '',
      position: sergioAccount.position || '',
      foot: sergioAccount.foot || '',
      jerseyNumber: sergioAccount.jerseyNumber || sergioAccount.number || 0,
      nickname: sergioAccount.nickname || ''
    }

    // 5. Ajouter Sergio Armani à la liste des joueurs
    const updatedPlayers = [...players, sergioPlayerData]

    console.log(`🔧 Ajout de Sergio Armani à l'inscription...`)
    await db.collection('teamRegistrations').doc(registrationId).update({
      players: updatedPlayers
    })
    console.log(`   ✅ Sergio Armani ajouté\n`)

    // 6. Afficher la liste finale
    const finalRegistration = await db.collection('teamRegistrations').doc(registrationId).get()
    const finalData = finalRegistration.data()
    const finalPlayers = finalData?.players || []

    console.log(`📋 Liste finale des joueurs (${finalPlayers.length}):`)
    finalPlayers.forEach((p: any, index: number) => {
      console.log(`   ${index + 1}. ${p.firstName} ${p.lastName} (${p.email})`)
    })

    // 7. Vérifier les doublons dans playerAccounts
    console.log(`\n🔍 Vérification des doublons dans playerAccounts...`)
    const allSergioAccounts = await db.collection('playerAccounts')
      .where('email', '==', 'sergioarmani2009@gmail.com')
      .get()

    if (allSergioAccounts.size > 1) {
      console.log(`⚠️  ${allSergioAccounts.size} comptes trouvés pour Sergio Armani`)
      console.log(`   IDs:`)
      allSergioAccounts.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`   ${index + 1}. ${doc.id} - Équipe: ${data.teamName || data.teamId || 'N/A'}`)
      })
    } else {
      console.log(`✅ Pas de doublon dans playerAccounts`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

addSergioBack()
  .then(() => {
    console.log('\n✅ Correction terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

