// Script pour supprimer complètement le compte Contact@comebac.com
// Usage: npx tsx scripts/remove-contact-account.ts

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function removeContactAccount() {
  try {
    const email = 'contact@comebac.com'
    console.log(`🗑️ Suppression complète de ${email}...`)

    let totalDeleted = 0

    // 1. Supprimer de players
    const playersQuery = query(collection(db, 'players'), where('email', '==', email))
    const playersSnap = await getDocs(playersQuery)
    for (const doc of playersSnap.docs) {
      await deleteDoc(doc.ref)
      totalDeleted++
      console.log(`✅ Supprimé de players: ${doc.id}`)
    }

    // 2. Supprimer de playerAccounts
    const playerAccountsQuery = query(collection(db, 'playerAccounts'), where('email', '==', email))
    const playerAccountsSnap = await getDocs(playerAccountsQuery)
    for (const doc of playerAccountsSnap.docs) {
      await deleteDoc(doc.ref)
      totalDeleted++
      console.log(`✅ Supprimé de playerAccounts: ${doc.id}`)
    }

    // 3. Supprimer de coachAccounts
    const coachAccountsQuery = query(collection(db, 'coachAccounts'), where('email', '==', email))
    const coachAccountsSnap = await getDocs(coachAccountsQuery)
    for (const doc of coachAccountsSnap.docs) {
      await deleteDoc(doc.ref)
      totalDeleted++
      console.log(`✅ Supprimé de coachAccounts: ${doc.id}`)
    }

    // 4. Supprimer de users
    const usersQuery = query(collection(db, 'users'), where('email', '==', email))
    const usersSnap = await getDocs(usersQuery)
    for (const doc of usersSnap.docs) {
      await deleteDoc(doc.ref)
      totalDeleted++
      console.log(`✅ Supprimé de users: ${doc.id}`)
    }

    // 5. Supprimer de userProfiles
    const userProfilesQuery = query(collection(db, 'userProfiles'), where('email', '==', email))
    const userProfilesSnap = await getDocs(userProfilesQuery)
    for (const doc of userProfilesSnap.docs) {
      await deleteDoc(doc.ref)
      totalDeleted++
      console.log(`✅ Supprimé de userProfiles: ${doc.id}`)
    }

    // 6. Retirer des teamRegistrations
    const registrationsSnap = await getDocs(collection(db, 'teamRegistrations'))
    for (const regDoc of registrationsSnap.docs) {
      const regData = regDoc.data()
      if (regData.players && Array.isArray(regData.players)) {
        const originalLength = regData.players.length
        const filteredPlayers = regData.players.filter((p: any) => p.email !== email)
        
        if (filteredPlayers.length < originalLength) {
          await regDoc.ref.update({ players: filteredPlayers })
          totalDeleted++
          console.log(`✅ Retiré de teamRegistrations: ${regDoc.id}`)
        }
      }
    }

    console.log(`\n🎉 Suppression terminée! ${totalDeleted} entrée(s) supprimée(s)`)
    console.log(`\n⚠️  Note: Pour supprimer le compte Firebase Auth, utilisez la console Firebase ou l'API admin`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

removeContactAccount()
