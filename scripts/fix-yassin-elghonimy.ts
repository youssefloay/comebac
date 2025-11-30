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

async function fixYassinElghonimy() {
  try {
    console.log('🔧 Correction de Yassin Elghonimy...\n')

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
    const teamId = data.teamId

    if (!teamId) {
      console.log('❌ L\'équipe Devils n\'a pas de teamId')
      return
    }

    console.log(`✅ Inscription Devils trouvée (ID: ${registrationId})`)
    console.log(`   teamId: ${teamId}\n`)

    // 2. Trouver Yassin Elghonimy dans l'inscription
    const players = data.players || []
    const yassinIndex = players.findIndex((p: any) => 
      p.firstName?.toLowerCase().includes('yassin') && 
      p.lastName?.toLowerCase().includes('elghonimy')
    )

    if (yassinIndex === -1) {
      console.log('❌ Yassin Elghonimy non trouvé dans l\'inscription')
      return
    }

    const yassinData = players[yassinIndex]
    console.log(`📋 Yassin Elghonimy trouvé:`)
    console.log(`   - Prénom: ${yassinData.firstName}`)
    console.log(`   - Nom: ${yassinData.lastName}`)
    console.log(`   - Email actuel (incorrect): ${yassinData.email}`)
    console.log(`   - Position: ${yassinData.position || 'N/A'}`)
    console.log(`   - Numéro: ${yassinData.jerseyNumber || yassinData.number || 'N/A'}\n`)

    // 3. Créer un email temporaire
    const tempEmail = `yassin.elghonimy.devils@temp.com`
    console.log(`📧 Email temporaire: ${tempEmail}\n`)

    // 4. Trouver et supprimer le doublon de Sergio Armani
    const sergioIndices: number[] = []
    players.forEach((p: any, index: number) => {
      if (p.email === 'sergioarmani2009@gmail.com') {
        sergioIndices.push(index)
      }
    })

    console.log(`📋 Doublons de Sergio Armani trouvés: ${sergioIndices.length}`)
    
    // Garder seulement le premier, supprimer les autres
    const playersToKeep = [...players]
    if (sergioIndices.length > 1) {
      // Supprimer les doublons en gardant le premier
      const seenEmails = new Set<string>()
      const uniquePlayers = players.filter((p: any, index: number) => {
        if (p.email === 'sergioarmani2009@gmail.com') {
          if (seenEmails.has(p.email)) {
            console.log(`   ❌ Suppression du doublon à l'index ${index}`)
            return false
          }
          seenEmails.add(p.email)
        }
        return true
      })
      playersToKeep.splice(0, playersToKeep.length, ...uniquePlayers)
      console.log(`   ✅ ${players.length - playersToKeep.length} doublon(s) supprimé(s)\n`)
    }

    // 5. Mettre à jour l'email de Yassin Elghonimy dans l'inscription
    const updatedPlayers = [...playersToKeep]
    updatedPlayers[yassinIndex] = {
      ...yassinData,
      email: tempEmail
    }

    console.log(`🔧 Mise à jour de l'inscription...`)
    await db.collection('teamRegistrations').doc(registrationId).update({
      players: updatedPlayers
    })
    console.log(`   ✅ Email de Yassin Elghonimy mis à jour dans l'inscription\n`)

    // 6. Vérifier si Yassin Elghonimy existe déjà dans playerAccounts
    const existingAccount = await db.collection('playerAccounts')
      .where('email', '==', tempEmail)
      .get()

    if (!existingAccount.empty) {
      console.log(`⚠️  Un compte existe déjà avec l'email ${tempEmail}`)
      console.log(`   ID: ${existingAccount.docs[0].id}`)
    } else {
      // 7. Créer le compte playerAccounts pour Yassin Elghonimy
      console.log(`📝 Création du compte playerAccounts...`)
      
      const playerAccountData = {
        firstName: yassinData.firstName,
        lastName: yassinData.lastName,
        email: tempEmail,
        phone: yassinData.phone || '',
        birthDate: yassinData.birthDate || '',
        height: yassinData.height || 0,
        tshirtSize: yassinData.tshirtSize || '',
        position: yassinData.position || '',
        foot: yassinData.foot || '',
        jerseyNumber: yassinData.jerseyNumber || yassinData.number || 0,
        nickname: yassinData.nickname || '',
        teamId: teamId,
        teamName: 'Devils',
        status: 'active',
        isActingCoach: false,
        isCaptain: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const newAccountRef = await db.collection('playerAccounts').add(playerAccountData)
      console.log(`   ✅ Compte créé avec l'ID: ${newAccountRef.id}\n`)

      // 8. Afficher le résumé
      console.log(`📋 Résumé des modifications:`)
      console.log(`   ✅ Compte playerAccounts créé pour Yassin Elghonimy`)
      console.log(`      - Email: ${tempEmail}`)
      console.log(`      - Équipe: Devils`)
      console.log(`      - Position: ${playerAccountData.position || 'N/A'}`)
      console.log(`      - Numéro: ${playerAccountData.jerseyNumber || 'N/A'}`)
      console.log(`   ✅ Email mis à jour dans teamRegistrations`)
      console.log(`   ✅ Doublon de Sergio Armani supprimé`)
    }

    // 9. Vérifier le résultat final
    const finalRegistration = await db.collection('teamRegistrations').doc(registrationId).get()
    const finalData = finalRegistration.data()
    const finalPlayers = finalData?.players || []

    console.log(`\n📋 Liste finale des joueurs dans l'inscription (${finalPlayers.length}):`)
    finalPlayers.forEach((p: any, index: number) => {
      console.log(`   ${index + 1}. ${p.firstName} ${p.lastName} (${p.email})`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

fixYassinElghonimy()
  .then(() => {
    console.log('\n✅ Correction terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

