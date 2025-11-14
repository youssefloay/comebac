"use client"

import { useState } from "react"

export default function EmailPreviewPage() {
  const [userType, setUserType] = useState<'player' | 'coach'>('player')
  
  const isCoach = userType === 'coach'
  const name = isCoach ? "Marie Martin" : "Jean Dupont"
  const teamName = isCoach ? "Les Lions" : "Les Aigles"
  const resetLink = "#"

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, ${isCoach ? '#F97316 0%, #DC2626' : '#10b981 0%, #3b82f6'} 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, ${isCoach ? '#F97316 0%, #DC2626' : '#10b981 0%, #3b82f6'} 100%);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
        }
        .info-box {
          background: white;
          border-left: 4px solid ${isCoach ? '#F97316' : '#10b981'};
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 28px;">${isCoach ? '🏆 Rappel Coach' : '⚽ Rappel Joueur'}</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">ComeBac League</p>
      </div>
      
      <div class="content">
        <h2 style="color: ${isCoach ? '#F97316' : '#10b981'}; margin-top: 0;">Bonjour ${name},</h2>
        
        <p>Nous avons remarqué que vous n'avez pas encore activé votre compte <strong>${teamName}</strong> sur ComeBac League.</p>
        
        <div class="info-box">
          <p style="margin: 0;"><strong>⚠️ Votre compte est prêt !</strong> Il ne vous reste plus qu'à créer votre mot de passe pour y accéder.</p>
        </div>
        
        <p><strong>Pour activer votre compte :</strong></p>
        <ol>
          <li>Cliquez sur le bouton ci-dessous</li>
          <li>Créez votre mot de passe</li>
          <li>Connectez-vous et profitez de toutes les fonctionnalités</li>
        </ol>
        
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">
            🔐 Activer mon compte
          </a>
        </div>
        
        ${isCoach ? `
        <p><strong>En tant qu'entraîneur, vous pourrez :</strong></p>
        <ul>
          <li>✅ Gérer les statuts de vos joueurs</li>
          <li>✅ Créer et valider les compositions</li>
          <li>✅ Consulter les statistiques de votre équipe</li>
          <li>✅ Voir le calendrier des matchs</li>
        </ul>
        ` : `
        <p><strong>En tant que joueur, vous pourrez :</strong></p>
        <ul>
          <li>📊 Consulter vos statistiques personnelles</li>
          <li>🏆 Voir vos matchs à venir et passés</li>
          <li>🎖️ Débloquer des badges</li>
          <li>📱 Recevoir des notifications</li>
        </ul>
        `}
        
        <div class="info-box">
          <p style="margin: 0;"><strong>⏰ Ce lien est valable pendant 1 heure.</strong> Si vous ne l'utilisez pas maintenant, vous pourrez toujours utiliser "Mot de passe oublié" sur la page de connexion.</p>
        </div>
        
        <div class="info-box" style="border-left-color: #3b82f6;">
          <p style="margin: 0 0 10px 0;"><strong>💬 Besoin d'aide ?</strong></p>
          <p style="margin: 5px 0;">📧 Email : <a href="mailto:contact@comebac.com" style="color: #3b82f6;">contact@comebac.com</a></p>
          <p style="margin: 5px 0;">📱 WhatsApp : <a href="https://wa.me/33634051384" style="color: #25D366;">+33 6 34 05 13 84</a></p>
          <p style="margin: 5px 0;">📸 Instagram : <a href="https://www.instagram.com/comebac.league/" style="color: #E4405F;">@comebac.league</a></p>
        </div>
        
        <p>Si vous avez des questions, n'hésitez pas à contacter l'administration.</p>
        
        <p style="margin-top: 30px;">
          Sportivement,<br>
          <strong>L'équipe ComeBac League</strong>
        </p>
      </div>
      
      <div class="footer">
        <p>ComeBac League - Ligue de Football Scolaire</p>
        <p style="font-size: 12px; color: #9ca3af;">
          Si vous n'avez pas demandé ce compte, ignorez cet email.
        </p>
      </div>
    </body>
    </html>
  `

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">📧 Prévisualisation Email - Comptes Jamais Connectés</h1>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setUserType('player')}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                userType === 'player'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⚽ Version Joueur
            </button>
            <button
              onClick={() => setUserType('coach')}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                userType === 'coach'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🏆 Version Coach
            </button>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Destinataire :</strong> {isCoach ? 'Entraîneurs' : 'Joueurs'} qui ne se sont jamais connectés
            </p>
            <p className="text-sm text-gray-600">
              <strong>Objet :</strong> {isCoach ? '🏆' : '⚽'} Activez votre compte ComeBac League
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            dangerouslySetInnerHTML={{ __html: emailHtml }}
            className="email-preview"
          />
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Informations</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Le lien d'activation est généré automatiquement par Firebase</li>
            <li>• Le lien expire après 1 heure</li>
            <li>• Les informations de contact sont incluses pour faciliter le support</li>
            <li>• Le design s'adapte selon le type de compte (joueur/coach)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
