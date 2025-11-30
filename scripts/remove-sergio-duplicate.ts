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

async function removeSergioDuplicate() {
  try {
    console.log('🔧 Suppression du doublon de Sergio Armani...\n')

    // 1. Trouver tous les comptes de Sergio Armani
    const allSergioAccounts = await db.collection('playerAccounts')
      .where('email', '==', 'sergioarmani2009@gmail.com')
      .get()

    if (allSergioAccounts.size <= 1) {
      console.log('✅ Pas de doublon trouvé')
      return
    }

    console.log(`📊 ${allSergioAccounts.size} comptes trouvés pour Sergio Armani\n`)

    // 2. Analyser chaque compte
    const accounts = allSergioAccounts.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    accounts.forEach((account: any, index: number) => {
      console.log(`📋 Compte ${index + 1}:`)
      console.log(`   - ID: ${account.id}`)
      console.log(`   - Nom: ${account.firstName} ${account.lastName}`)
      console.log(`   - Équipe: ${account.teamName || account.teamId || 'N/A'}`)
      console.log(`   - Position: ${account.position || 'N/A'}`)
      console.log(`   - Numéro: ${account.jerseyNumber || account.number || 'N/A'}`)
      console.log(`   - UID: ${account.uid || 'N/A'}`)
      console.log(`   - Créé: ${account.createdAt ? new Date(account.createdAt.seconds * 1000).toLocaleString() : 'N/A'}`)
      console.log(`   - Dernière connexion: ${account.lastLogin ? new Date(account.lastLogin.seconds * 1000).toLocaleString() : 'Jamais'}`)
      console.log('')
    })

    // 3. Déterminer lequel garder (celui avec UID ou le plus récent)
    const accountWithUid = accounts.find((a: any) => a.uid)
    const accountsToDelete = accountWithUid 
      ? accounts.filter((a: any) => a.id !== accountWithUid.id)
      : accounts.slice(1) // Garder le premier, supprimer les autres

    if (accountWithUid) {
      console.log(`✅ Garder le compte avec UID: ${accountWithUid.id}\n`)
    } else {
      console.log(`✅ Garder le premier compte: ${accounts[0].id}\n`)
    }

    // 4. Supprimer les doublons
    console.log(`🔧 Suppression de ${accountsToDelete.length} doublon(s)...`)
    for (const account of accountsToDelete) {
      await db.collection('playerAccounts').doc(account.id).delete()
      console.log(`   ✅ Supprimé: ${account.id}`)
    }

    console.log(`\n✅ ${accountsToDelete.length} doublon(s) supprimé(s)`)

    // 5. Vérifier le résultat
    const remainingAccounts = await db.collection('playerAccounts')
      .where('email', '==', 'sergioarmani2009@gmail.com')
      .get()

    console.log(`\n📊 Comptes restants: ${remainingAccounts.size}`)
    if (remainingAccounts.size === 1) {
      const remaining = remainingAccounts.docs[0].data()
      console.log(`   ✅ ${remaining.firstName} ${remaining.lastName} (${remaining.email})`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

removeSergioDuplicate()
  .then(() => {
    console.log('\n✅ Correction terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

