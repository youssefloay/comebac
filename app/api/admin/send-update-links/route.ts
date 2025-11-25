import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { sendEmail } from '@/lib/email-service'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Récupérer toutes les inscriptions d'équipes (pending ou validated)
    const registrationsSnap = await adminDb.collection('teamRegistrations')
      .where('status', 'in', ['pending', 'pending_players', 'validated'])
      .get()

    if (registrationsSnap.empty) {
      return NextResponse.json({
        success: true,
        message: 'Aucune équipe à mettre à jour',
        sent: 0,
        skipped: 0
      })
    }

    let sent = 0
    let skipped = 0
    const errors: string[] = []

    for (const regDoc of registrationsSnap.docs) {
      const regData = regDoc.data()
      const playerCount = regData.players?.length || 0
      
      // Ne traiter que les équipes avec moins de 11 joueurs
      if (playerCount >= 11) {
        skipped++
        continue
      }

      // Vérifier si maxPlayers est déjà à 11
      if (regData.maxPlayers === 11) {
        skipped++
        continue
      }

      try {
        // Générer un token de mise à jour
        const updateToken = crypto.randomBytes(32).toString('hex')
        
        // Mettre à jour l'inscription avec le token et maxPlayers à 11
        await regDoc.ref.update({
          updateToken,
          updateTokenActive: true,
          updateTokenCreatedAt: new Date(),
          maxPlayers: 11
        })

        // Générer le lien de mise à jour
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.comebac.com'
        const updateLink = `${baseUrl}/update-registration/${updateToken}`

        // Envoyer l'email uniquement au capitaine
        const captainEmail = regData.captain?.email
        if (!captainEmail) {
          errors.push(`${regData.teamName}: Email du capitaine non trouvé`)
          continue
        }
          const emailHtml = `
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
                  background: #eff6ff;
                  border-left: 3px solid #3b82f6;
                  padding: 16px;
                  border-radius: 6px;
                  margin: 20px 0;
                }
                .info-box p {
                  color: #1e40af;
                  margin: 0;
                  font-size: 14px;
                }
                .button-container {
                  text-align: center;
                  margin: 24px 0;
                }
                .button {
                  display: inline-block;
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  color: white !important;
                  text-decoration: none;
                  padding: 14px 32px;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 15px;
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
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📢 Mise à jour importante</h1>
                </div>
                <div class="content">
                  <p>Bonjour,</p>
                  
                  <p>Nous avons une <strong>bonne nouvelle</strong> pour votre équipe <strong>${regData.teamName}</strong> !</p>
                  
                  <div class="info-box">
                    <p><strong>🎯 Nouvelle limite :</strong> Vous pouvez maintenant inscrire jusqu'à <strong>11 joueurs</strong> au lieu de 10 !</p>
                  </div>
                  
                  <p>Actuellement, votre équipe compte <strong>${playerCount} joueur${playerCount > 1 ? 's' : ''}</strong>.</p>
                  
                  <p>Pour mettre à jour votre inscription et profiter de cette nouvelle limite, cliquez sur le bouton ci-dessous :</p>
                  
                  <div class="button-container">
                    <a href="${updateLink}" class="button">Mettre à jour mon inscription</a>
                  </div>
                  
                  <p style="margin-top: 24px;"><strong>🔗 Lien de mise à jour :</strong></p>
                  <div class="link-box">
                    <a href="${updateLink}">${updateLink}</a>
                  </div>
                  
                  <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">
                    💡 Ce lien est valable indéfiniment. Vous pouvez l'utiliser à tout moment pour mettre à jour votre inscription.
                  </p>
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
            subject: `📢 Mise à jour : Nouvelle limite de 11 joueurs - ${regData.teamName}`,
            html: emailHtml
          })

          if (emailResult.success) {
            sent++
          } else {
            errors.push(`${regData.teamName}: ${emailResult.error}`)
          }
      } catch (error: any) {
        errors.push(`${regData.teamName}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Liens envoyés avec succès ! ${sent} email(s) envoyé(s), ${skipped} équipe(s) ignorée(s)${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`,
      sent,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi des liens' },
      { status: 500 }
    )
  }
}

