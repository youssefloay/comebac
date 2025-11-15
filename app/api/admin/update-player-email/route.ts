import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { generateWelcomeEmail, sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { oldEmail, newEmail, playerName, teamName } = await request.json()

    if (!oldEmail || !newEmail) {
      return NextResponse.json(
        { error: 'oldEmail et newEmail requis' },
        { status: 400 }
      )
    }

    console.log(`🔄 Mise à jour email: ${oldEmail} → ${newEmail}`)

    // 1. Trouver et mettre à jour le compte Firebase Auth
    let firebaseUser
    try {
      firebaseUser = await adminAuth.getUserByEmail(oldEmail)
      await adminAuth.updateUser(firebaseUser.uid, { email: newEmail })
      console.log('✅ Firebase Auth mis à jour')
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Essayer avec le nouveau email (peut-être déjà mis à jour)
        try {
          firebaseUser = await adminAuth.getUserByEmail(newEmail)
          console.log('✅ Firebase Auth déjà à jour')
        } catch {
          return NextResponse.json(
            { error: 'Compte Firebase non trouvé' },
            { status: 404 }
          )
        }
      } else {
        throw error
      }
    }

    // 2. Mettre à jour dans players
    const playersSnap = await adminDb.collection('players')
      .where('email', '==', oldEmail)
      .get()
    
    for (const doc of playersSnap.docs) {
      await doc.ref.update({ email: newEmail })
    }
    console.log(`✅ ${playersSnap.size} joueur(s) mis à jour`)

    // 3. Mettre à jour dans playerAccounts
    const accountsSnap = await adminDb.collection('playerAccounts')
      .where('email', '==', oldEmail)
      .get()
    
    for (const doc of accountsSnap.docs) {
      await doc.ref.update({ email: newEmail })
    }
    console.log(`✅ ${accountsSnap.size} compte(s) mis à jour`)

    // 4. Mettre à jour dans teamRegistrations
    const registrationsSnap = await adminDb.collection('teamRegistrations').get()
    let registrationsUpdated = 0
    
    for (const doc of registrationsSnap.docs) {
      const data = doc.data()
      let updated = false
      const updates: any = {}
      
      // Vérifier le capitaine
      if (data.captain?.email === oldEmail) {
        updates['captain.email'] = newEmail
        updated = true
      }
      
      // Vérifier les joueurs
      if (data.players && Array.isArray(data.players)) {
        const players = [...data.players]
        let playersUpdated = false
        
        for (let i = 0; i < players.length; i++) {
          if (players[i].email === oldEmail) {
            players[i].email = newEmail
            playersUpdated = true
          }
        }
        
        if (playersUpdated) {
          updates.players = players
          updated = true
        }
      }
      
      if (updated) {
        await doc.ref.update(updates)
        registrationsUpdated++
      }
    }
    console.log(`✅ ${registrationsUpdated} inscription(s) mise(s) à jour`)

    // 5. Générer un lien et envoyer l'email
    const resetLink = await adminAuth.generatePasswordResetLink(newEmail)
    
    const emailData = generateWelcomeEmail(
      playerName || 'Joueur',
      teamName || 'votre équipe',
      resetLink,
      newEmail
    )

    const emailResult = await sendEmail(emailData)

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: `✅ Email mis à jour et email d'activation envoyé à ${newEmail}`
      })
    } else {
      return NextResponse.json({
        success: true,
        message: `✅ Email mis à jour mais erreur d'envoi: ${emailResult.error}`,
        warning: emailResult.error
      })
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
