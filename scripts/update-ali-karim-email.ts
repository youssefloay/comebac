/**
 * Script pour mettre à jour l'email d'Ali Karim partout
 * Usage: npx tsx scripts/update-ali-karim-email.ts
 */

import { adminAuth, adminDb } from '../lib/firebase-admin'
import { getPasswordResetActionCodeSettings } from '../lib/password-reset'

async function updateAliKarimEmail() {
  const oldEmail = 'eliali@gmail.com'
  const newEmail = prompt('Quel est le nouvel email d\'Ali Karim?')
  
  if (!newEmail) {
    console.log('❌ Aucun email fourni')
    return
  }

  console.log(`🔄 Mise à jour de l'email d'Ali Karim`)
  console.log(`   Ancien: ${oldEmail}`)
  console.log(`   Nouveau: ${newEmail}`)
  console.log('')

  try {
    // 1. Trouver le compte Firebase Auth avec l'ancien email
    console.log('1️⃣ Recherche du compte Firebase Auth...')
    let firebaseUser
    try {
      firebaseUser = await adminAuth.getUserByEmail(oldEmail)
      console.log('   ✅ Compte trouvé:', firebaseUser.uid)
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('   ⚠️ Compte Firebase non trouvé avec l\'ancien email')
        console.log('   Recherche avec le nouveau email...')
        try {
          firebaseUser = await adminAuth.getUserByEmail(newEmail)
          console.log('   ✅ Compte déjà mis à jour:', firebaseUser.uid)
        } catch {
          console.log('   ❌ Aucun compte trouvé')
          return
        }
      } else {
        throw error
      }
    }

    // 2. Mettre à jour l'email dans Firebase Auth
    if (firebaseUser.email !== newEmail) {
      console.log('\n2️⃣ Mise à jour Firebase Auth...')
      await adminAuth.updateUser(firebaseUser.uid, {
        email: newEmail
      })
      console.log('   ✅ Email mis à jour dans Firebase Auth')
    } else {
      console.log('\n2️⃣ Firebase Auth déjà à jour')
    }

    // 3. Mettre à jour dans la collection players
    console.log('\n3️⃣ Mise à jour dans players...')
    const playersSnap = await adminDb.collection('players')
      .where('email', '==', oldEmail)
      .get()
    
    if (!playersSnap.empty) {
      for (const doc of playersSnap.docs) {
        await doc.ref.update({ email: newEmail })
        console.log(`   ✅ Joueur mis à jour: ${doc.data().name}`)
      }
    } else {
      console.log('   ⚠️ Aucun joueur trouvé avec l\'ancien email')
    }

    // 4. Mettre à jour dans la collection playerAccounts
    console.log('\n4️⃣ Mise à jour dans playerAccounts...')
    const accountsSnap = await adminDb.collection('playerAccounts')
      .where('email', '==', oldEmail)
      .get()
    
    if (!accountsSnap.empty) {
      for (const doc of accountsSnap.docs) {
        await doc.ref.update({ email: newEmail })
        console.log(`   ✅ Compte joueur mis à jour: ${doc.data().firstName} ${doc.data().lastName}`)
      }
    } else {
      console.log('   ⚠️ Aucun compte joueur trouvé avec l\'ancien email')
    }

    // 5. Mettre à jour dans teamRegistrations
    console.log('\n5️⃣ Mise à jour dans teamRegistrations...')
    const registrationsSnap = await adminDb.collection('teamRegistrations').get()
    
    for (const doc of registrationsSnap.docs) {
      const data = doc.data()
      let updated = false
      
      // Vérifier le capitaine
      if (data.captain?.email === oldEmail) {
        await doc.ref.update({
          'captain.email': newEmail
        })
        updated = true
      }
      
      // Vérifier les joueurs
      if (data.players && Array.isArray(data.players)) {
        const players = data.players
        let playersUpdated = false
        
        for (let i = 0; i < players.length; i++) {
          if (players[i].email === oldEmail) {
            players[i].email = newEmail
            playersUpdated = true
          }
        }
        
        if (playersUpdated) {
          await doc.ref.update({ players })
          updated = true
        }
      }
      
      if (updated) {
        console.log(`   ✅ Inscription mise à jour: ${data.teamName}`)
      }
    }

    // 6. Envoyer un email au nouveau email
    console.log('\n6️⃣ Envoi de l\'email d\'activation...')
    const resetLink = await adminAuth.generatePasswordResetLink(newEmail, getPasswordResetActionCodeSettings(newEmail))
    
    console.log('   ✅ Lien généré:', resetLink)
    console.log('\n📧 Pour envoyer l\'email, utilisez l\'API ou le bouton dans l\'interface admin')
    
    console.log('\n✅ TERMINÉ!')
    console.log(`\nAli Karim peut maintenant se connecter avec: ${newEmail}`)
    
  } catch (error) {
    console.error('\n❌ Erreur:', error)
  }
}

// Fonction prompt pour Node.js
function prompt(question: string): string | null {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question + ' ', (answer: string) => {
      rl.close()
      resolve(answer || null)
    })
  }) as any
}

updateAliKarimEmail().catch(console.error)
