/**
 * Script pour mettre à jour l'email d'Ali Karim
 * eliali@gmail.com → boseliali@gmail.com
 */

import { adminAuth, adminDb } from '../lib/firebase-admin'
import { generateWelcomeEmail, sendEmail } from '../lib/email-service'
import { getPasswordResetActionCodeSettings } from '../lib/password-reset'

const OLD_EMAIL = 'eliali@gmail.com'
const NEW_EMAIL = 'boseliali@gmail.com'
const PLAYER_NAME = 'Ali Karim'
const TEAM_NAME = 'Se7en'

async function fixAliKarimEmail() {
  console.log('🔄 Mise à jour de l\'email d\'Ali Karim')
  console.log(`   ${OLD_EMAIL} → ${NEW_EMAIL}\n`)

  try {
    // 1. Mettre à jour Firebase Auth
    console.log('1️⃣ Mise à jour Firebase Auth...')
    let firebaseUser
    try {
      firebaseUser = await adminAuth.getUserByEmail(OLD_EMAIL)
      await adminAuth.updateUser(firebaseUser.uid, { email: NEW_EMAIL })
      console.log('   ✅ Firebase Auth mis à jour (UID:', firebaseUser.uid + ')')
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('   ⚠️ Compte non trouvé avec ancien email, recherche avec nouveau...')
        try {
          firebaseUser = await adminAuth.getUserByEmail(NEW_EMAIL)
          console.log('   ✅ Compte déjà à jour (UID:', firebaseUser.uid + ')')
        } catch {
          console.log('   ❌ Aucun compte trouvé')
          return
        }
      } else {
        throw error
      }
    }

    // 2. Mettre à jour dans players
    console.log('\n2️⃣ Mise à jour dans players...')
    const playersSnap = await adminDb.collection('players')
      .where('email', '==', OLD_EMAIL)
      .get()
    
    if (!playersSnap.empty) {
      for (const doc of playersSnap.docs) {
        await doc.ref.update({ email: NEW_EMAIL })
        console.log(`   ✅ Joueur mis à jour: ${doc.data().name}`)
      }
    } else {
      console.log('   ⚠️ Aucun joueur trouvé (peut-être déjà mis à jour)')
    }

    // 3. Mettre à jour dans playerAccounts
    console.log('\n3️⃣ Mise à jour dans playerAccounts...')
    const accountsSnap = await adminDb.collection('playerAccounts')
      .where('email', '==', OLD_EMAIL)
      .get()
    
    if (!accountsSnap.empty) {
      for (const doc of accountsSnap.docs) {
        await doc.ref.update({ email: NEW_EMAIL })
        console.log(`   ✅ Compte mis à jour: ${doc.data().firstName} ${doc.data().lastName}`)
      }
    } else {
      console.log('   ⚠️ Aucun compte trouvé (peut-être déjà mis à jour)')
    }

    // 4. Mettre à jour dans teamRegistrations
    console.log('\n4️⃣ Mise à jour dans teamRegistrations...')
    const registrationsSnap = await adminDb.collection('teamRegistrations').get()
    let updated = 0
    
    for (const doc of registrationsSnap.docs) {
      const data = doc.data()
      let needsUpdate = false
      const updates: any = {}
      
      // Vérifier le capitaine
      if (data.captain?.email === OLD_EMAIL) {
        updates['captain.email'] = NEW_EMAIL
        needsUpdate = true
      }
      
      // Vérifier les joueurs
      if (data.players && Array.isArray(data.players)) {
        const players = [...data.players]
        let playersUpdated = false
        
        for (let i = 0; i < players.length; i++) {
          if (players[i].email === OLD_EMAIL) {
            players[i].email = NEW_EMAIL
            playersUpdated = true
          }
        }
        
        if (playersUpdated) {
          updates.players = players
          needsUpdate = true
        }
      }
      
      if (needsUpdate) {
        await doc.ref.update(updates)
        console.log(`   ✅ Inscription mise à jour: ${data.teamName}`)
        updated++
      }
    }
    
    if (updated === 0) {
      console.log('   ⚠️ Aucune inscription à mettre à jour')
    }

    // 5. Générer un lien et envoyer l'email
    console.log('\n5️⃣ Envoi de l\'email d\'activation...')
    const resetLink = await adminAuth.generatePasswordResetLink(NEW_EMAIL, getPasswordResetActionCodeSettings(NEW_EMAIL))
    
    const emailData = generateWelcomeEmail(
      PLAYER_NAME,
      TEAM_NAME,
      resetLink,
      NEW_EMAIL
    )

    const emailResult = await sendEmail(emailData)

    if (emailResult.success) {
      console.log('   ✅ Email envoyé avec succès à', NEW_EMAIL)
    } else {
      console.log('   ❌ Erreur lors de l\'envoi:', emailResult.error)
    }

    console.log('\n✅ TERMINÉ!')
    console.log(`\nAli Karim peut maintenant se connecter avec: ${NEW_EMAIL}`)
    
  } catch (error) {
    console.error('\n❌ Erreur:', error)
  }
}

fixAliKarimEmail().catch(console.error)
