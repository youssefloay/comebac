import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

// Route de test pour vérifier l'envoi de notification admin
export async function GET() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@comebac.com'
    
    console.log('🧪 Test d\'envoi de notification admin')
    console.log('📧 Email de destination:', adminEmail)
    console.log('🔑 RESEND_API_KEY configurée:', !!process.env.RESEND_API_KEY)
    console.log('📤 EMAIL_FROM:', process.env.EMAIL_FROM || 'Non configuré')

    const testEmailContent = {
      subject: `🧪 Test - Notification Admin ComeBac League`,
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
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Test de Notification</h1>
            </div>
            <div class="content">
              <p>Ceci est un email de test pour vérifier que le système d'envoi de notifications fonctionne correctement.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">📋 Informations de test</h3>
                <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
                <p><strong>Équipe test:</strong> ElHAREEFA</p>
                <p><strong>Email destinataire:</strong> ${adminEmail}</p>
              </div>
              
              <p>Si vous recevez cet email, cela signifie que le système fonctionne correctement ! ✅</p>
            </div>
            <div class="footer">
              <p>ComeBac League - Système de Gestion</p>
              <p>Email de test automatique</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const result = await sendEmail({
      to: adminEmail,
      subject: testEmailContent.subject,
      html: testEmailContent.html
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email de test envoyé avec succès',
        emailId: result.data?.id,
        sentTo: adminEmail,
        config: {
          hasResendKey: !!process.env.RESEND_API_KEY,
          emailFrom: process.env.EMAIL_FROM || 'Non configuré',
          adminEmail: adminEmail
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Erreur inconnue',
        details: result.error,
        config: {
          hasResendKey: !!process.env.RESEND_API_KEY,
          emailFrom: process.env.EMAIL_FROM || 'Non configuré',
          adminEmail: adminEmail
        }
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Erreur test notification admin:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors du test',
      config: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM || 'Non configuré',
        adminEmail: process.env.ADMIN_EMAIL || 'contact@comebac.com'
      }
    }, { status: 500 })
  }
}

