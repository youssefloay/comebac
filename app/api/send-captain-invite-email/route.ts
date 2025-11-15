import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { captainEmail, captainName, teamName, token } = await request.json()

    if (!captainEmail || !captainName || !teamName || !token) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${appUrl}/join-team/${token}`
    const statusLink = `${appUrl}/team-registration/${token}/status`

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
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
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
          .info {
            background: #eff6ff;
            border-left: 3px solid #3b82f6;
            padding: 16px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .info p {
            color: #1e40af;
            margin: 0;
            font-size: 14px;
          }
          .link-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 12px;
            border-radius: 8px;
            margin: 12px 0;
            word-break: break-all;
          }
          .link-box a {
            color: #2563eb;
            text-decoration: none;
            font-size: 14px;
          }
          .steps {
            background: #f0fdf4;
            border-left: 3px solid: #10b981;
            padding: 16px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .steps ol {
            margin: 8px 0 0 20px;
            color: #065f46;
          }
          .steps li {
            margin: 4px 0;
            font-size: 14px;
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
            <div class="logo">⚽</div>
            <h1>Équipe créée avec succès!</h1>
          </div>
          
          <div class="content">
            <p>Bonjour <strong>${captainName}</strong>,</p>
            
            <p>Votre équipe <strong>${teamName}</strong> a été créée avec succès en mode collaboratif!</p>
            
            <div class="info">
              <p><strong>📋 Prochaines étapes:</strong></p>
            </div>

            <div class="steps">
              <ol>
                <li>Partagez le lien d'invitation à vos joueurs (max 10)</li>
                <li>Chaque joueur remplit ses informations</li>
                <li>Une fois que vous avez au moins 7 joueurs, soumettez pour validation</li>
                <li>L'admin validera votre équipe</li>
              </ol>
            </div>

            <p><strong>🔗 Lien d'invitation pour vos joueurs:</strong></p>
            <div class="link-box">
              <a href="${inviteLink}">${inviteLink}</a>
            </div>
            <p style="font-size: 13px; color: #6b7280;">Copiez et partagez ce lien avec vos joueurs</p>

            <p style="margin-top: 24px;"><strong>📊 Lien de suivi de votre équipe:</strong></p>
            <div class="link-box">
              <a href="${statusLink}">${statusLink}</a>
            </div>
            <p style="font-size: 13px; color: #6b7280;">Utilisez ce lien pour voir qui s'est inscrit et soumettre pour validation</p>

            <div class="info" style="margin-top: 24px;">
              <p><strong>💡 Conseil:</strong> Gardez ces liens précieusement! Vous en aurez besoin pour gérer votre équipe.</p>
            </div>
            
            <div class="contact">
              <p style="color: #4b5563; font-weight: 600;">Besoin d'aide?</p>
              <p>📧 <a href="mailto:contact@comebac.com">contact@comebac.com</a></p>
              <p>📱 <a href="https://wa.me/33634051384">WhatsApp: +33 6 34 05 13 84</a></p>
              <p>📷 <a href="https://instagram.com/comebac.league">Instagram: @comebac.league</a></p>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>ComeBac League</strong></p>
            <p>Championnat de Football Scolaire</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailResult = await sendEmail({
      to: captainEmail,
      subject: `Équipe ${teamName} créée - Liens d'invitation`,
      html
    })

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Email envoyé avec succès'
      })
    } else {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
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
