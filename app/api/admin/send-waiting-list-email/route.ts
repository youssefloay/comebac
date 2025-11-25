import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { captainEmail, captainName, teamName } = await request.json()

    if (!captainEmail || !captainName || !teamName) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f9fafb;
            padding: 20px;
          }
          .container {
            max-width: 560px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
          .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            padding: 32px 24px;
            text-align: center;
          }
          .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
          }
          .header h1 {
            color: white;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
          }
          .content {
            padding: 32px 24px;
          }
          .content p {
            color: #4b5563;
            margin-bottom: 16px;
            font-size: 15px;
          }
          .info-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .info-box p {
            color: #92400e;
            margin: 0;
            font-size: 15px;
            line-height: 1.6;
          }
          .encouragement {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .encouragement p {
            color: #065f46;
            margin: 0;
            font-size: 15px;
            line-height: 1.6;
          }
          .footer {
            background: #f9fafb;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 13px;
            margin: 6px 0;
          }
          .contact {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
          }
          .contact p {
            font-size: 13px;
            margin: 4px 0;
          }
          .contact a {
            color: #2563eb;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⏳</div>
            <h1>Votre équipe est en liste d'attente</h1>
          </div>
          
          <div class="content">
            <p>Bonjour <strong>${captainName}</strong>,</p>
            
            <p>Nous vous informons que votre équipe <strong>${teamName}</strong> a été placée en <strong>liste d'attente</strong> pour la ComeBac League.</p>
            
            <div class="info-box">
              <p><strong>📋 Statut actuel :</strong> Votre inscription est en attente de validation. Nous avons atteint la capacité maximale pour le moment, mais nous travaillons activement pour ouvrir de nouvelles places.</p>
            </div>
            
            <div class="encouragement">
              <p><strong>💪 Ne perdez pas espoir !</strong></p>
              <p>Votre équipe est bien enregistrée et nous vous contacterons dès qu'une place se libère. Nous apprécions votre patience et votre intérêt pour la ComeBac League.</p>
            </div>
            
            <p style="margin-top: 24px;">Nous vous tiendrons informé de l'évolution de votre dossier. En attendant, n'hésitez pas à nous contacter si vous avez des questions.</p>
            
            <div class="contact">
              <p style="color: #4b5563; font-weight: 600;">Besoin d'aide ou avez des questions ?</p>
              <p>📧 <a href="mailto:contact@comebac.com">contact@comebac.com</a></p>
              <p>📱 <a href="https://wa.me/33634051384">WhatsApp: +33 6 34 05 13 84</a></p>
              <p>📷 <a href="https://instagram.com/comebac.league">Instagram: @comebac.league</a></p>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>ComeBac League</strong></p>
            <p>Championnat de Football Scolaire</p>
            <p style="margin-top: 12px; font-size: 12px; color: #9ca3af;">
              Cette notification a été envoyée automatiquement. Merci de ne pas répondre à cet email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailResult = await sendEmail({
      to: captainEmail,
      subject: `⏳ Liste d'attente - Équipe ${teamName}`,
      html
    })

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Email envoyé avec succès',
        resendEmailId: emailResult.data?.id || null,
        resendStatus: emailResult.data?.status || null
      })
    } else {
      return NextResponse.json(
        { 
          error: emailResult.error || 'Erreur lors de l\'envoi de l\'email',
          details: emailResult.error === 'API key not configured' ? 'Vérifiez que RESEND_API_KEY est configurée sur Vercel.' : ''
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

