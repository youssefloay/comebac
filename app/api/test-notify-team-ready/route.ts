import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.comebac.com'
    const validateUrl = `${appUrl}/api/admin/validate-team-registration?registrationId=test_registration_id&action=validate`
    const rejectUrl = `${appUrl}/api/admin/validate-team-registration?registrationId=test_registration_id&action=reject`
    const adminUrl = `${appUrl}/admin/team-registrations`

    // Email de test pour équipe prête à valider
    const emailContent = {
      subject: `✅ [TEST] Équipe prête à valider - Équipe Test (10 joueurs)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .button { display: inline-block; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
            .button-validate { background: #10b981; }
            .button-reject { background: #ef4444; }
            .button-view { background: #3b82f6; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .test-banner { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="test-banner">
              🧪 EMAIL DE TEST - Équipe prête à valider
            </div>
            <div class="header">
              <h1>✅ Équipe Prête à Valider</h1>
            </div>
            <div class="content">
              <p>L'équipe <strong>Équipe Test</strong> a atteint <strong>10 joueurs</strong> et est prête à être validée!</p>
              
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Action requise:</strong> Vous devez valider ou refuser cette inscription.</p>
              </div>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">📋 Détails de l'équipe</h3>
                <p><strong>Équipe:</strong> Équipe Test</p>
                <p><strong>École:</strong> École Test</p>
                <p><strong>Niveau:</strong> Grade Test</p>
                <p><strong>Capitaine:</strong> Jean Dupont</p>
                <p><strong>Email:</strong> jean.dupont@test.com</p>
                <p><strong>Nombre de joueurs:</strong> <strong style="color: #10b981; font-size: 18px;">10/10</strong></p>
                <p><strong>ID Inscription:</strong> test_registration_id</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${validateUrl}" class="button button-validate">
                  ✅ Valider l'équipe
                </a>
                <a href="${rejectUrl}" class="button button-reject">
                  ❌ Refuser l'équipe
                </a>
              </div>
              
              <div style="text-align: center;">
                <a href="${adminUrl}" class="button button-view">
                  📋 Voir toutes les inscriptions
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                💡 Après validation, les comptes joueurs seront créés automatiquement.
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
      console.log('✅ Email de test envoyé pour équipe prête')
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

