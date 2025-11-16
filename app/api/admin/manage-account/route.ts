import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { db } from '@/lib/firebase'
import { doc, deleteDoc } from 'firebase/firestore'
import { sendEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function POST(request: Request) {
  try {
    const { action, uid, email, accountId, collection } = await request.json()

    const auth = getAuth()

    if (action === 'delete') {
      // Supprimer le compte Firebase Auth
      await auth.deleteUser(uid)

      // Supprimer le document Firestore
      if (accountId && collection) {
        await deleteDoc(doc(db, collection, accountId))
      }

      return NextResponse.json({ 
        success: true,
        message: 'Compte supprimé avec succès'
      })
    }

    if (action === 'resetPassword') {
      // Générer un lien de réinitialisation de mot de passe
      const resetLink = await auth.generatePasswordResetLink(email, getPasswordResetActionCodeSettings(email))

      // Envoyer l'email (seulement si l'email est contact@comebac.com en mode test)
      const canSendEmail = email === 'contact@comebac.com' || process.env.NODE_ENV === 'production'
      
      if (canSendEmail) {
        try {
          await sendEmail({
          to: email,
          subject: 'Réinitialisation de votre mot de passe - ComeBac League',
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
                .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Réinitialisation de mot de passe</h1>
                </div>
                <div class="content">
                  <h2>Bonjour,</h2>
                  <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte ComeBac League.</p>
                  
                  <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe:</p>
                  
                  <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
                  </div>
                  
                  <p><strong>Important:</strong></p>
                  <ul>
                    <li>Ce lien est valable pendant 1 heure</li>
                    <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                    <li>Votre mot de passe actuel reste valide jusqu'à ce que vous en créiez un nouveau</li>
                  </ul>
                  
                  <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur:</p>
                  <p style="word-break: break-all; color: #3b82f6; font-size: 12px;">${resetLink}</p>
                  
                  <p>L'équipe ComeBac League</p>
                </div>
                <div class="footer">
                  <p>ComeBac League - Championnat Scolaire</p>
                  <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                </div>
              </div>
            </body>
            </html>
          `
        })

          console.log('✅ Email de réinitialisation envoyé à', email)
        } catch (emailError) {
          console.error('❌ Erreur d\'envoi d\'email:', emailError)
          // On continue même si l'email échoue, le lien est quand même généré
        }
      } else {
        console.log('⚠️ Email non envoyé (mode test) - Lien disponible dans la réponse')
        console.log('📧 Pour envoyer des emails à tous, vérifiez un domaine sur resend.com/domains')
      }

      return NextResponse.json({ 
        success: true,
        resetLink,
        message: 'Email de réinitialisation envoyé!'
      })
    }

    return NextResponse.json({ 
      error: 'Action non reconnue' 
    }, { status: 400 })

  } catch (error: any) {
    console.error('Erreur lors de la gestion du compte:', error)
    return NextResponse.json({ 
      error: error.message || 'Erreur lors de la gestion du compte' 
    }, { status: 500 })
  }
}
