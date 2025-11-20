import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.comebac.com'
    const adminUrl = `${appUrl}/admin/team-registrations`

    // Email de test pour la création d'un lien collaboratif
    const emailContent = {
      subject: `🔗 [TEST] Nouveau lien collaboratif créé - Équipe Test`,
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
            .test-banner { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="test-banner">
              🧪 EMAIL DE TEST - Création de lien collaboratif
            </div>
            <div class="header">
              <h1>🔗 Nouveau Lien Collaboratif Créé</h1>
            </div>
            <div class="content">
              <p>Un nouveau lien collaboratif vient d'être créé pour une équipe!</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">📋 Détails de l'équipe</h3>
                <p><strong>Équipe:</strong> Équipe Test</p>
                <p><strong>École:</strong> École Test</p>
                <p><strong>Niveau:</strong> Grade Test</p>
                <p><strong>Capitaine:</strong> Jean Dupont</p>
                <p><strong>Email:</strong> jean.dupont@test.com</p>
                <p><strong>Token:</strong></p>
                <div class="token-box">test_token_123456789</div>
                <p><strong>ID Inscription:</strong> test_registration_id</p>
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
      console.log('✅ Email de test envoyé pour lien collaboratif')
      return NextResponse.json({ 
        success: true,
        message: 'Email de test envoyé avec succès'
      })
    } else {
      console.error('❌ Échec envoi email de test:', result.error)
      return NextResponse.json({ 
        success: false,
        error: 'Échec envoi email de test',
        details: result.error
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Erreur envoi email de test:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi de l\'email de test',
      details: error.message
    }, { status: 500 })
  }
}

