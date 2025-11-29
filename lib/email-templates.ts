export function getPlayerWelcomeEmailHtml(playerName: string, teamName: string, resetLink: string, playerEmail: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.comebac.com').replace(/\/$/, '')
  const assetBaseUrl = (process.env.NEXT_PUBLIC_EMAIL_ASSET_URL || 'https://www.comebac.com').replace(/\/$/, '')
  const logoUrl = `${assetBaseUrl}/comebac.png?v=2`

  return `
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
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }
        .logo img {
          width: 100%;
          height: auto;
          display: block;
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
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
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
        .features {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
          padding: 16px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .features h3 {
          color: #1d4ed8;
          font-size: 15px;
          margin: 0 0 12px 0;
        }
        .features ul {
          margin: 0;
          padding-left: 20px;
          color: #2563eb;
        }
        .features li {
          margin: 6px 0;
          font-size: 14px;
        }
        .info {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
          padding: 14px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .info p {
          color: #1e40af;
          margin: 0;
          font-size: 14px;
        }
        .info a {
          color: #2563eb;
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
          color: #2563eb;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <img src="${logoUrl}" alt="ComeBac League" />
          </div>
          <h1>Bienvenue dans ComeBac League</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${playerName}</strong>,</p>
          
          <p>Félicitations ! Ton compte joueur a été créé pour l'équipe <strong>${teamName}</strong>.</p>
          
          <p>Pour accéder à ton espace joueur et profiter de toutes les fonctionnalités, clique sur le bouton ci-dessous pour créer ton mot de passe :</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">🔐 Créer mon mot de passe</a>
          </div>
          
          <div class="alert">
            <p><strong>⏰ Ce lien expire dans 1 heure</strong></p>
          </div>
          
          <div class="features">
            <h3>🎯 Ce que tu pourras faire :</h3>
            <ul>
              <li>📊 Consulter tes statistiques personnelles (buts, passes, cartons...)</li>
              <li>🏆 Voir le classement de ton équipe et les résultats</li>
              <li>📅 Consulter le calendrier des matchs à venir</li>
              <li>🎖️ Débloquer des badges et suivre ta progression</li>
              <li>📱 Recevoir des notifications pour tes matchs</li>
              <li>⚽ Accéder à ta carte de joueur personnalisée</li>
            </ul>
          </div>
          
          <div class="info">
            <p><strong>Lien expiré ?</strong></p>
            <p style="margin-top: 8px;">
              Pas de panique ! Tu peux toujours créer ton mot de passe :<br><br>
              1. Va sur <a href="${baseUrl}/login">${baseUrl}/login</a><br>
              2. Entre ton email : <strong>${playerEmail}</strong><br>
              3. Clique sur "Mot de passe oublié"
            </p>
          </div>
          
          <div class="contact">
            <p style="color: #4b5563; font-weight: 600;">💬 Besoin d'aide ?</p>
            <p>📧 Email : <a href="mailto:contact@comebac.com">contact@comebac.com</a></p>
            <p>📱 WhatsApp : <a href="https://wa.me/33634051384">+33 6 34 05 13 84</a></p>
            <p>📷 Instagram : <a href="https://instagram.com/comebac.league">@comebac.league</a></p>
          </div>
          
          <p style="margin-top: 24px; color: #4b5563;">
            Sportivement,<br>
            <strong>L'équipe ComeBac League</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>ComeBac League</strong></p>
          <p>Championnat de Football Scolaire</p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
            Si tu n'as pas demandé ce compte, ignore cet email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getCoachWelcomeEmailHtml(email: string, firstName: string, lastName: string, teamName: string, resetLink: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.comebac.com').replace(/\/$/, '')
  const assetBaseUrl = (process.env.NEXT_PUBLIC_EMAIL_ASSET_URL || 'https://www.comebac.com').replace(/\/$/, '')
  const logoUrl = `${assetBaseUrl}/comebac.png?v=2`

  return `
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
          background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }
        .logo img {
          width: 100%;
          height: auto;
          display: block;
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
          background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
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
          background: #fff7ed;
          border-left: 3px solid #f97316;
          padding: 14px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .info p {
          color: #9a3412;
          margin: 0;
          font-size: 14px;
        }
        .info a {
          color: #ea580c;
          text-decoration: underline;
        }
        .features {
          background: #fef2f2;
          border-left: 3px solid #dc2626;
          padding: 16px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .features h3 {
          color: #991b1b;
          font-size: 15px;
          margin: 0 0 12px 0;
        }
        .features ul {
          margin: 0;
          padding-left: 20px;
          color: #b91c1c;
        }
        .features li {
          margin: 6px 0;
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
          color: #ea580c;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <img src="${logoUrl}" alt="ComeBac League" />
          </div>
          <h1>Bienvenue Coach</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
          
          <p>Félicitations ! Votre compte coach a été créé pour l'équipe <strong>${teamName}</strong>.</p>
          
          <p>Pour accéder à votre espace coach et gérer votre équipe, cliquez sur le bouton ci-dessous pour créer votre mot de passe :</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">🔐 Créer mon mot de passe</a>
          </div>
          
          <div class="alert">
            <p><strong>⏰ Ce lien expire dans 1 heure</strong></p>
          </div>
          
          <div class="features">
            <h3>🎯 Vos fonctionnalités coach :</h3>
            <ul>
              <li>✅ Gérer les statuts de vos joueurs (présent, absent, blessé)</li>
              <li>✅ Créer et valider les compositions d'équipe</li>
              <li>📊 Consulter les statistiques détaillées de votre équipe</li>
              <li>📅 Voir le calendrier complet des matchs</li>
              <li>🏆 Suivre le classement et les résultats</li>
              <li>📱 Recevoir des notifications importantes</li>
              <li>👥 Gérer votre effectif et les informations des joueurs</li>
            </ul>
          </div>
          
          <div class="info">
            <p><strong>Lien expiré ?</strong></p>
            <p style="margin-top: 8px;">
              Pas de problème ! Vous pouvez toujours créer votre mot de passe :<br><br>
              1. Allez sur <a href="${baseUrl}/login">${baseUrl}/login</a><br>
              2. Entrez votre email : <strong>${email}</strong><br>
              3. Cliquez sur "Mot de passe oublié"
            </p>
          </div>
          
          <div class="contact">
            <p style="color: #4b5563; font-weight: 600;">💬 Besoin d'aide ?</p>
            <p>📧 Email : <a href="mailto:contact@comebac.com">contact@comebac.com</a></p>
            <p>📱 WhatsApp : <a href="https://wa.me/33634051384">+33 6 34 05 13 84</a></p>
            <p>📷 Instagram : <a href="https://instagram.com/comebac.league">@comebac.league</a></p>
          </div>
          
          <p style="margin-top: 24px; color: #4b5563;">
            Sportivement,<br>
            <strong>L'équipe ComeBac League</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>ComeBac League</strong></p>
          <p>Championnat de Football Scolaire</p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
            Si vous n'avez pas demandé ce compte, ignorez cet email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
