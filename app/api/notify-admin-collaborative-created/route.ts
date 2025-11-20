import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

export async function POST(request: Request) {
  try {
    const { teamName, schoolName, teamGrade, captainName, captainEmail, token, registrationId } = await request.json()

    if (!teamName || !token) {
      return NextResponse.json({ 
        error: 'Données manquantes' 
      }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.comebac.com'
    const adminUrl = `${appUrl}/admin/team-registrations`

    // Email de notification pour l'admin
    const emailContent = {
      subject: `🔗 Nouveau lien collaboratif créé - ${teamName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .token-box { background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔗 Nouveau Lien Collaboratif Créé</h1>
            </div>
            <div class="content">
              <p>Un nouveau lien collaboratif vient d'être créé pour une équipe!</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">📋 Détails de l'équipe</h3>
                <p><strong>Équipe:</strong> ${teamName}</p>
                <p><strong>École:</strong> ${schoolName || 'Non spécifié'}</p>
                <p><strong>Niveau:</strong> ${teamGrade || 'Non spécifié'}</p>
                <p><strong>Capitaine:</strong> ${captainName}</p>
                <p><strong>Email:</strong> ${captainEmail}</p>
                <p><strong>Token:</strong></p>
                <div class="token-box">${token}</div>
                <p><strong>ID Inscription:</strong> ${registrationId}</p>
              </div>
              
              <p><strong>Mode d'inscription:</strong> Collaboratif</p>
              <p>Les joueurs peuvent maintenant rejoindre l'équipe via le lien partagé.</p>
              
              <div style="text-align: center;">
                <a href="${adminUrl}" class="button">
                  Voir les inscriptions
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                💡 Vous recevrez un autre email quand l'équipe atteindra 10 joueurs pour validation.
              </p>
            </div>
            <div class="footer">
              <p>ComeBac League - Système de Gestion</p>
              <p>Cette notification a été envoyée automatiquement</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Envoyer l'email à l'admin
    const result = await sendEmail({
      to: 'contact@comebac.com',
      subject: emailContent.subject,
      html: emailContent.html
    })

    if (result.success) {
      console.log('✅ Notification admin envoyée pour lien collaboratif:', teamName)
      return NextResponse.json({ 
        success: true,
        message: 'Notification envoyée'
      })
    } else {
      console.error('❌ Échec notification admin:', result.error)
      return NextResponse.json({ 
        success: false,
        error: 'Échec envoi notification'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Erreur notification admin:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi de la notification' 
    }, { status: 500 })
  }
}



