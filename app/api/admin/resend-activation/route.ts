import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { generateWelcomeEmail, sendCoachWelcomeEmail, sendEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    let user
    try {
      user = await adminAuth.getUserByEmail(email)
    } catch (error) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Générer un lien de réinitialisation de mot de passe
    const resetLink = await adminAuth.generatePasswordResetLink(email, getPasswordResetActionCodeSettings(email))

    // Chercher les infos joueur / coach pour personnaliser
    let emailResult
    let matchedType: 'player' | 'coach' | 'unknown' = 'unknown'

    const playerSnap = await adminDb
      .collection('playerAccounts')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!playerSnap.empty) {
      const playerDoc = playerSnap.docs[0]
      const data = playerDoc.data() as any
      matchedType = 'player'
      let teamName = data.teamName || 'votre équipe'
      if (!teamName && data.teamId) {
        const teamDoc = await adminDb.collection('teams').doc(data.teamId).get()
        if (teamDoc.exists) {
          teamName = teamDoc.data()?.name || teamName
        }
      }
      const playerName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || name || user.displayName || 'Joueur'
      
      console.log(`📧 Envoi email joueur à ${email} pour ${teamName}`)
      emailResult = await sendEmail(generateWelcomeEmail(playerName, teamName, resetLink, email))
      
      console.log(`📧 Résultat envoi email joueur:`, emailResult.success ? '✅ Succès' : `❌ Erreur: ${emailResult.error}`)
      
      // Enregistrer la date de dernière relance
      if (emailResult?.success || emailResult?.error === 'API key not configured') {
        await adminDb.collection('playerAccounts').doc(playerDoc.id).update({
          lastResendDate: new Date().toISOString()
        })
        console.log(`✅ Date de relance enregistrée pour joueur ${email}`)
      }
    } else {
      const coachSnap = await adminDb
        .collection('coachAccounts')
        .where('email', '==', email)
        .limit(1)
        .get()

      if (!coachSnap.empty) {
        const coachDoc = coachSnap.docs[0]
        const data = coachDoc.data() as any
        matchedType = 'coach'
        const coachFirstName = data.firstName || name?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Coach'
        const coachLastName = data.lastName || name?.split(' ').slice(1).join(' ') || user.displayName?.split(' ').slice(1).join(' ') || ''
        const teamName = data.teamName || 'votre équipe'
        
        console.log(`📧 Envoi email coach à ${email} pour ${teamName}`)
        emailResult = await sendCoachWelcomeEmail({
          email,
          firstName: coachFirstName,
          lastName: coachLastName,
          teamName,
          resetLink
        })
        
        console.log(`📧 Résultat envoi email coach:`, emailResult.success ? '✅ Succès' : `❌ Erreur: ${emailResult.error}`)
        
        // Enregistrer la date de dernière relance
        if (emailResult?.success || emailResult?.error === 'API key not configured') {
          await adminDb.collection('coachAccounts').doc(coachDoc.id).update({
            lastResendDate: new Date().toISOString()
          })
          console.log(`✅ Date de relance enregistrée pour coach ${email}`)
        }
      }
    }

    if (!emailResult) {
      // Fallback sur un template générique mais avec logo
      console.log(`⚠️ Aucun compte playerAccounts ou coachAccounts trouvé, utilisation du template générique`)
      const fallbackName = name || user.displayName || 'Joueur'
      emailResult = await sendEmail(generateWelcomeEmail(fallbackName, 'ComeBac League', resetLink, email))
      console.log(`📧 Résultat envoi email générique:`, emailResult.success ? '✅ Succès' : `❌ Erreur: ${emailResult.error}`)
    }

    const isEmailSent = emailResult?.success || emailResult?.error === 'API key not configured'

    if (!isEmailSent) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    console.log(`✅ Email d'activation renvoyé à ${email}`)

    return NextResponse.json({
      success: true,
      message: emailResult?.success ? 'Email d\'activation envoyé' : 'Aucun email envoyé (mode local)'
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
