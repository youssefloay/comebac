"use client"

import { useState } from "react"

export default function EmailPreviewPage() {
  const [userType, setUserType] = useState<'player' | 'coach'>('player')
  
  const isCoach = userType === 'coach'
  const name = isCoach ? "Marie Martin" : "Jean Dupont"
  const email = isCoach ? "marie.martin@example.com" : "jean.dupont@example.com"
  const teamName = isCoach ? "Les Lions" : "Les Aigles"
  const resetLink = "#"
  const appUrl = "https://www.comebac.com"

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
          background: linear-gradient(135deg, ${isCoach ? '#f97316 0%, #dc2626' : '#3b82f6 0%, #10b981'} 100%);
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
        .button-container {
          text-align: center;
          margin: 24px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, ${isCoach ? '#f97316 0%, #dc2626' : '#3b82f6 0%, #10b981'} 100%);
          color: white !important;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
        }
        .alert {
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
          padding: 14px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .alert p {
          color: #92400e;
          margin: 0;
          font-size: 14px;
        }
        .info {
          background: ${isCoach ? '#fff7ed' : '#eff6ff'};
          border-left: 3px solid ${isCoach ? '#f97316' : '#3b82f6'};
          padding: 14px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .info p {
          color: ${isCoach ? '#9a3412' : '#1e40af'};
          margin: 0;
          font-size: 14px;
        }
        .info a {
          color: ${isCoach ? '#ea580c' : '#2563eb'};
          text-decoration: underline;
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
          color: ${isCoach ? '#ea580c' : '#2563eb'};
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">${isCoach ? '🏆' : '⚽'}</div>
          <h1>Bienvenue dans ComeBac League</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${name}</strong>,</p>
          
          <p>Votre équipe <strong>${teamName}</strong> a été validée. Créez votre mot de passe pour accéder à votre espace ${isCoach ? 'coach' : 'joueur'}:</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">Créer mon mot de passe</a>
          </div>
          
          <div class="alert">
            <p><strong>⏰ Ce lien expire dans 1 heure</strong></p>
          </div>
          
          <div class="info">
            <p><strong>Lien expiré?</strong></p>
            <p style="margin-top: 8px;">
              1. Allez sur <a href="${appUrl}/login">${appUrl}/login</a><br>
              2. Entrez votre email: <strong>${email}</strong><br>
              3. Cliquez sur "Mot de passe oublié"
            </p>
          </div>
          
          ${isCoach ? `
          <p><strong>Vos fonctionnalités:</strong></p>
          <p style="font-size: 14px; color: #6b7280;">
            • Gérer les statuts des joueurs<br>
            • Créer les compositions officielles<br>
            • Consulter les statistiques<br>
            • Voir le calendrier des matchs
          </p>
          ` : ''}
          
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">📧 Templates d'Emails</h1>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              ← Retour
            </button>
          </div>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setUserType('player')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition ${
                userType === 'player'
                  ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⚽ Email Joueur
            </button>
            <button
              onClick={() => setUserType('coach')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition ${
                userType === 'coach'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🏆 Email Coach
            </button>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Objet:</strong> Bienvenue dans ComeBac League
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Destinataire:</strong> {isCoach ? 'Entraîneurs' : 'Joueurs'} lors de la validation de l'équipe
            </p>
            <p className="text-sm text-gray-600">
              <strong>Expéditeur:</strong> ComeBac League &lt;noreply@comebac.com&gt;
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
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Caractéristiques</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Design moderne et épuré</li>
            <li>✅ Lien d'activation valable 1 heure</li>
            <li>✅ Instructions claires si le lien expire</li>
            <li>✅ Informations de contact (Email, WhatsApp, Instagram)</li>
            <li>✅ Responsive et compatible tous appareils</li>
            <li>✅ Couleurs adaptées selon le type (joueur/coach)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
