import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

export async function POST(request: Request) {
  try {
    const { teamName, schoolName, captainName, captainEmail, playersCount } = await request.json()

    if (!teamName) {
      return NextResponse.json({ 
        error: 'Données manquantes' 
      }, { status: 400 })
    }

    // Email de notification pour l'admin
    const emailContent = {
      subject: `🔔 Nouvelle inscription d'équipe - ${teamName}`,
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
            .info-box { background: white; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Nouvelle Inscription d'Équipe</h1>
            </div>
            <div class="content">
              <p>Une nouvelle équipe vient de s'inscrire à la ComeBac League et attend votre validation!</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">📋 Détails de l'inscription</h3>
                <p><strong>Équipe:</strong> ${teamName}</p>
                <p><strong>École:</strong> ${schoolName}</p>
                <p><strong>Capitaine:</strong> ${captainName}</p>
                <p><strong>Email:</strong> ${captainEmail}</p>
                <p><strong>Nombre de joueurs:</strong> ${playersCount}</p>
              </div>
              
              <p><strong>Action requise:</strong></p>
              <ul>
                <li>Connectez-vous à l'interface admin</li>
                <li>Allez sur "Inscriptions d'Équipes"</li>
                <li>Examinez et validez l'inscription</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/team-registrations" class="button">
                  Voir les inscriptions
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                💡 Les comptes joueurs seront créés automatiquement après validation.
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

    // Récupérer l'email admin depuis les variables d'environnement ou utiliser la valeur par défaut
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@comebac.com'
    
    console.log('📧 Envoi notification admin à:', adminEmail)
    console.log('📋 Détails inscription:', { teamName, schoolName, captainName, captainEmail, playersCount })

    // Envoyer l'email à l'admin
    const result = await sendEmail({
      to: adminEmail,
      subject: emailContent.subject,
      html: emailContent.html
    })

    if (result.success) {
      console.log('✅ Notification admin envoyée avec succès pour:', teamName)
      console.log('✅ Email ID:', result.data?.id)
      return NextResponse.json({ 
        success: true,
        message: 'Notification envoyée',
        emailId: result.data?.id,
        sentTo: adminEmail
      })
    } else {
      console.error('❌ Échec notification admin:', result.error)
      console.error('❌ Détails erreur:', JSON.stringify(result, null, 2))
      return NextResponse.json({ 
        success: false,
        error: result.error || 'Échec envoi notification',
        details: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Erreur notification admin:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi de la notification' 
    }, { status: 500 })
  }
}
