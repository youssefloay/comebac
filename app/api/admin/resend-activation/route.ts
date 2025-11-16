import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { sendEmail } from '@/lib/email-service'
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

    // Envoyer l'email
    const emailSent = await sendEmail({
      to: email,
      subject: '🔐 Activez votre compte Comebac',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        🔐 Activez votre compte
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Bonjour <strong>${name || 'Joueur'}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Votre compte Comebac a été créé ! Pour l'activer et définir votre mot de passe, cliquez sur le bouton ci-dessous :
                      </p>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                              Activer mon compte
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Ce lien est valide pendant 1 heure. Si vous n'avez pas demandé cette activation, vous pouvez ignorer cet email.
                      </p>

                      <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
                        </p>
                        <p style="margin: 0; color: #3b82f6; font-size: 12px; word-break: break-all;">
                          ${resetLink}
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                        <strong>Comebac</strong> - Votre plateforme de gestion d'équipe
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    })

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    console.log(`✅ Email d'activation renvoyé à ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Email d\'activation envoyé'
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
