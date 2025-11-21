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
      
      // Récupérer le nom de l'équipe avec plusieurs fallbacks
      let teamName = data.teamName || null
      
      // Si teamName n'existe pas ou est vide, chercher dans teams
      if (!teamName && data.teamId) {
        try {
          const teamDoc = await adminDb.collection('teams').doc(data.teamId).get()
          if (teamDoc.exists) {
            teamName = teamDoc.data()?.name || null
            console.log(`✅ Nom d'équipe récupéré depuis teams: ${teamName}`)
          } else {
            // Si pas dans teams, chercher dans teamRegistrations
            const regDoc = await adminDb.collection('teamRegistrations').doc(data.teamId).get()
            if (regDoc.exists) {
              teamName = regDoc.data()?.teamName || null
              console.log(`✅ Nom d'équipe récupéré depuis teamRegistrations: ${teamName}`)
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors de la récupération du nom d\'équipe:', error)
        }
      }
      
      // Fallback final
      if (!teamName || teamName === 'votre équipe') {
        teamName = 'ComeBac League'
        console.log(`⚠️ Nom d'équipe non trouvé, utilisation du fallback: ${teamName}`)
      } else {
        // Si on a trouvé un nom d'équipe valide et qu'il n'était pas dans playerAccounts, le mettre à jour
        if (data.teamName !== teamName && data.teamId) {
          try {
            await adminDb.collection('playerAccounts').doc(playerDoc.id).update({
              teamName: teamName
            })
            console.log(`✅ Nom d'équipe mis à jour dans playerAccounts: ${teamName}`)
          } catch (updateError) {
            console.error('❌ Erreur lors de la mise à jour du nom d\'équipe:', updateError)
          }
        }
      }
      
      const playerName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || name || user.displayName || 'Joueur'
      
      console.log(`📧 Envoi email joueur à ${email} pour l'équipe "${teamName}"`)
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
        
        // Récupérer le nom de l'équipe avec plusieurs fallbacks
        let teamName = data.teamName || null
        
        // Si teamName n'existe pas ou est vide, chercher dans teams
        if (!teamName && data.teamId) {
          try {
            const teamDoc = await adminDb.collection('teams').doc(data.teamId).get()
            if (teamDoc.exists) {
              teamName = teamDoc.data()?.name || null
              console.log(`✅ Nom d'équipe récupéré depuis teams: ${teamName}`)
            } else {
              // Si pas dans teams, chercher dans teamRegistrations
              const regDoc = await adminDb.collection('teamRegistrations').doc(data.teamId).get()
              if (regDoc.exists) {
                teamName = regDoc.data()?.teamName || null
                console.log(`✅ Nom d'équipe récupéré depuis teamRegistrations: ${teamName}`)
              }
            }
          } catch (error) {
            console.error('❌ Erreur lors de la récupération du nom d\'équipe:', error)
          }
        }
        
        // Fallback final
        if (!teamName || teamName === 'votre équipe') {
          teamName = 'ComeBac League'
          console.log(`⚠️ Nom d'équipe non trouvé, utilisation du fallback: ${teamName}`)
        } else {
          // Si on a trouvé un nom d'équipe valide et qu'il n'était pas dans coachAccounts, le mettre à jour
          if (data.teamName !== teamName && data.teamId) {
            try {
              await adminDb.collection('coachAccounts').doc(coachDoc.id).update({
                teamName: teamName
              })
              console.log(`✅ Nom d'équipe mis à jour dans coachAccounts: ${teamName}`)
            } catch (updateError) {
              console.error('❌ Erreur lors de la mise à jour du nom d\'équipe:', updateError)
            }
          }
        }
        
        console.log(`📧 Envoi email coach à ${email} pour l'équipe "${teamName}"`)
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
      console.error(`❌ Échec envoi email à ${email}:`, emailResult?.error)
      return NextResponse.json(
        { 
          success: false,
          error: emailResult?.error || 'Erreur lors de l\'envoi de l\'email',
          details: `Impossible d'envoyer l'email à ${email}`
        },
        { status: 500 }
      )
    }

    console.log(`✅ Email d'activation renvoyé à ${email}`)

    return NextResponse.json({
      success: true,
      message: emailResult?.success ? 'Email d\'activation envoyé' : 'Aucun email envoyé (mode local)'
    })

  } catch (error: any) {
    console.error('❌ Erreur dans resend-activation:', error)
    console.error('❌ Stack:', error.stack)
    console.error('❌ Email concerné:', email)
    
    // S'assurer de retourner toujours une réponse JSON valide
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
