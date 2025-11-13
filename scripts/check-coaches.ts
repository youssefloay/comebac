import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkCoaches() {
  try {
    console.log('🔍 Vérification des entraîneurs dans la base de données...\n')

    const coachesSnap = await getDocs(collection(db, 'coachAccounts'))
    
    console.log(`📊 Nombre total d'entraîneurs: ${coachesSnap.size}\n`)

    if (coachesSnap.empty) {
      console.log('❌ Aucun entraîneur trouvé dans la collection "coachAccounts"')
      console.log('\n💡 Pour créer un entraîneur, vous devez:')
      console.log('   1. Avoir une équipe enregistrée')
      console.log('   2. Créer un compte entraîneur manuellement dans Firestore')
      console.log('   3. Ou utiliser l\'interface admin pour créer des comptes')
    } else {
      console.log('✅ Entraîneurs trouvés:\n')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      coachesSnap.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`\n${index + 1}. ${data.firstName} ${data.lastName}`)
        console.log(`   ID: ${doc.id}`)
        console.log(`   Email: ${data.email}`)
        console.log(`   Équipe: ${data.teamName || 'Non définie'}`)
        console.log(`   Team ID: ${data.teamId || 'Non défini'}`)
      })
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }

    // Vérifier aussi les équipes
    console.log('\n\n🔍 Vérification des équipes...\n')
    const teamsSnap = await getDocs(collection(db, 'teams'))
    console.log(`📊 Nombre total d'équipes: ${teamsSnap.size}\n`)

    if (!teamsSnap.empty) {
      console.log('✅ Équipes trouvées:\n')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      teamsSnap.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`\n${index + 1}. ${data.name}`)
        console.log(`   ID: ${doc.id}`)
        console.log(`   Couleur: ${data.color || 'Non définie'}`)
        if (data.coach) {
          console.log(`   Entraîneur: ${data.coach.firstName} ${data.coach.lastName}`)
          console.log(`   Email entraîneur: ${data.coach.email}`)
        } else {
          console.log(`   Entraîneur: Non défini`)
        }
      })
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

checkCoaches()
