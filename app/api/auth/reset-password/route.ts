import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { sendEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'
import { getPasswordResetEmailHtml } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin non initialisé' },
        { status: 500 }
      )
    }

    let user
    try {
      user = await adminAuth.getUserByEmail(email)
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Ne pas révéler que l'utilisateur n'existe pas pour des raisons de sécurité
        return NextResponse.json({
          success: true,
          message: 'Si cet email existe, un lien de réinitialisation a été envoyé.'
        })
      }
      throw error
    }

    // Générer un lien de réinitialisation de mot de passe
    const linkGenerationTime = Date.now()
    console.log(`🔗 Génération du lien de réinitialisation pour ${email} à ${new Date(linkGenerationTime).toISOString()}`)
    
    const resetLink = await adminAuth.generatePasswordResetLink(email, getPasswordResetActionCodeSettings(email))
    
    const linkGeneratedTime = Date.now()
    console.log(`✅ Lien généré en ${linkGeneratedTime - linkGenerationTime}ms`)

    // Envoyer l'email avec notre template personnalisé
    const emailSendStartTime = Date.now()
    const emailResult = await sendEmail({
      to: email,
      subject: '🔐 Réinitialisez votre mot de passe pour ComeBac',
      html: getPasswordResetEmailHtml(email, resetLink)
    })

    const emailSendTime = Date.now() - emailSendStartTime
    const totalTime = Date.now() - linkGenerationTime
    console.log(`✅ Email de réinitialisation envoyé à ${email}`)
    console.log(`⏱️  Temps total (génération + envoi): ${totalTime}ms`)
    console.log(`📧 Temps d'envoi email: ${emailSendTime}ms`)

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.'
      })
    } else {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailResult.error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la réinitialisation:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

