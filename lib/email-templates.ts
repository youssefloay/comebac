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
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .logo-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
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
            <img src="${logoUrl}" alt="ComeBac League" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="logo-fallback" style="display: none;">CB</div>
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
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .logo-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
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
            <img src="${logoUrl}" alt="ComeBac League" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="logo-fallback" style="display: none;">CB</div>
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

export function getPasswordResetEmailHtml(email: string, resetLink: string) {
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
          background: linear-gradient(135deg, #dc2626 0%, #f97316 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .logo-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
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
          margin: 32px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #dc2626 0%, #f97316 100%);
          color: white !important;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
        }
        .alert {
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
          padding: 14px;
          border-radius: 6px;
          margin: 24px 0;
        }
        .alert p {
          color: #92400e;
          margin: 0;
          font-size: 14px;
        }
        .info {
          background: #fef2f2;
          border-left: 3px solid #dc2626;
          padding: 14px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .info p {
          color: #991b1b;
          margin: 0;
          font-size: 14px;
        }
        .info a {
          color: #dc2626;
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
          color: #dc2626;
          text-decoration: none;
        }
        .link-fallback {
          margin-top: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          word-break: break-all;
        }
        .link-fallback p {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }
        .link-fallback a {
          color: #dc2626;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <img src="${logoUrl}" alt="ComeBac League" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="logo-fallback" style="display: none;">CB</div>
          </div>
          <h1>🔐 Réinitialisation de mot de passe</h1>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          
          <p>Une demande de réinitialisation du mot de passe a été faite pour votre compte <strong>${email}</strong> sur ComeBac League.</p>
          
          <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
          </div>
          
          <div class="alert">
            <p><strong>⏰ Important :</strong> Ce lien est valable pendant 1 heure. Si vous n'utilisez pas ce lien dans ce délai, vous devrez en demander un nouveau.</p>
          </div>
          
          <div class="info">
            <p><strong>🔒 Sécurité :</strong></p>
            <p style="margin-top: 8px;">
              • Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.<br>
              • Votre mot de passe actuel reste valide jusqu'à ce que vous en créiez un nouveau.<br>
              • Ne partagez jamais ce lien avec quelqu'un d'autre.
            </p>
          </div>
          
          <div class="link-fallback">
            <p><strong>Le bouton ne fonctionne pas ?</strong></p>
            <p style="margin-top: 8px;">
              Copiez-collez ce lien dans votre navigateur :<br>
              <a href="${resetLink}">${resetLink}</a>
            </p>
          </div>
          
          <div class="contact">
            <p style="color: #4b5563; font-weight: 600;">💬 Besoin d'aide ?</p>
            <p>📧 Email : <a href="mailto:contact@comebac.com">contact@comebac.com</a></p>
            <p>📱 WhatsApp : <a href="https://wa.me/33634051384">+33 6 34 05 13 84</a></p>
            <p>📷 Instagram : <a href="https://instagram.com/comebac.league">@comebac.league</a></p>
          </div>
          
          <p style="margin-top: 24px; color: #4b5563;">
            À bientôt sur le terrain ⚽<br>
            <strong>L'équipe ComeBac League</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>ComeBac League</strong></p>
          <p>Championnat de Football Scolaire</p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
            Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getSpectatorApprovalEmailHtml(
  firstName: string,
  lastName: string,
  teamName: string,
  matchDate: string,
  matchTime: string,
  venue: string,
  matchType: 'regular' | 'preseason',
  qrCodeDataUrl?: string
) {
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .logo-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
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
        .success-box {
          background: #d1fae5;
          border-left: 4px solid #10b981;
          padding: 16px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .success-box p {
          color: #065f46;
          margin: 0;
          font-weight: 500;
        }
        .match-info {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
          padding: 16px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .match-info p {
          color: #1e40af;
          margin: 8px 0;
          font-size: 14px;
        }
        .match-info strong {
          color: #1e3a8a;
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
          <div class="logo">
            <img src="${logoUrl}" alt="ComeBac League" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="logo-fallback" style="display: none;">CB</div>
          </div>
          <h1>✅ Request Approved / Demande approuvée</h1>
        </div>
        
        <div class="content">
          <!-- French Section -->
          <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
            <p style="margin-bottom: 16px;"><strong>🇫🇷 Français</strong></p>
            <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
            
            <div class="success-box">
              <p>🎉 Votre demande de spectateur a été <strong>approuvée</strong> !</p>
            </div>
            
            <p>Vous êtes maintenant inscrit(e) pour assister au match suivant :</p>
            
            <div class="match-info">
              <p><strong>Équipe :</strong> ${teamName}</p>
              <p><strong>Date :</strong> ${matchDate}</p>
              <p><strong>Heure :</strong> ${matchTime}</p>
              ${venue ? `<p><strong>Lieu :</strong> ${venue}</p>` : ''}
              ${matchType === 'preseason' ? '<p><strong>Type :</strong> Match Preseason</p>' : ''}
            </div>
            
            ${qrCodeDataUrl ? `
            <div style="text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
              <p style="color: #1f2937; font-weight: 600; margin-bottom: 12px; font-size: 16px;">📱 Votre QR Code d'entrée</p>
              <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 250px; height: 250px; margin: 0 auto; display: block; border: 3px solid #10b981; border-radius: 8px; padding: 10px; background: white;" />
              <p style="color: #6b7280; font-size: 13px; margin-top: 12px;">Présentez ce QR code à l'entrée pour valider votre présence</p>
            </div>
            ` : ''}
            
            <p><strong>Important :</strong></p>
            <ul style="color: #4b5563; margin-left: 20px; margin-bottom: 16px;">
              <li>Présentez-vous au moins 10 minutes avant le début du match</li>
              ${qrCodeDataUrl ? '<li>Apportez ce QR code (sur votre téléphone ou imprimé)</li>' : '<li>Apportez une pièce d\'identité valide</li>'}
              <li>Respectez les règles du stade et les consignes de sécurité</li>
            </ul>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Nous avons hâte de vous voir au match ! ⚽
            </p>
          </div>

          <!-- English Section -->
          <div>
            <p style="margin-bottom: 16px;"><strong>🇬🇧 English</strong></p>
            <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
            
            <div class="success-box">
              <p>🎉 Your spectator request has been <strong>approved</strong>!</p>
            </div>
            
            <p>You are now registered to attend the following match:</p>
            
            <div class="match-info">
              <p><strong>Team:</strong> ${teamName}</p>
              <p><strong>Date:</strong> ${matchDate}</p>
              <p><strong>Time:</strong> ${matchTime}</p>
              ${venue ? `<p><strong>Venue:</strong> ${venue}</p>` : ''}
              ${matchType === 'preseason' ? '<p><strong>Type:</strong> Preseason Match</p>' : ''}
            </div>
            
            ${qrCodeDataUrl ? `
            <div style="text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
              <p style="color: #1f2937; font-weight: 600; margin-bottom: 12px; font-size: 16px;">📱 Your Entry QR Code</p>
              <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 250px; height: 250px; margin: 0 auto; display: block; border: 3px solid #10b981; border-radius: 8px; padding: 10px; background: white;" />
              <p style="color: #6b7280; font-size: 13px; margin-top: 12px;">Present this QR code at the entrance to validate your attendance</p>
            </div>
            ` : ''}
            
            <p><strong>Important:</strong></p>
            <ul style="color: #4b5563; margin-left: 20px; margin-bottom: 16px;">
              <li>Arrive at least 10 minutes before the match starts</li>
              ${qrCodeDataUrl ? '<li>Bring this QR code (on your phone or printed)</li>' : '<li>Bring a valid ID</li>'}
              <li>Respect stadium rules and safety guidelines</li>
            </ul>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              We look forward to seeing you at the match! ⚽
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>ComeBac League</strong></p>
          <p>Championnat de Football Scolaire / School Football Championship</p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
            Pour toute question / For any questions, contactez-nous à / contact us at contact@comebac.com
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getSpectatorRejectionEmailHtml(
  firstName: string,
  lastName: string,
  teamName: string,
  matchDate: string,
  rejectionComment?: string
) {
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
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .logo-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
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
          padding: 16px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .info-box p {
          color: #92400e;
          margin: 0;
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
          <div class="logo">
            <img src="${logoUrl}" alt="ComeBac League" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="logo-fallback" style="display: none;">CB</div>
          </div>
          <h1>Request Rejected / Demande refusée</h1>
        </div>
        
        <div class="content">
          <!-- French Section -->
          <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
            <p style="margin-bottom: 16px;"><strong>🇫🇷 Français</strong></p>
            <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
            
            <div class="info-box">
              <p>Nous regrettons de vous informer que votre demande de spectateur pour le match de <strong>${teamName}</strong> le <strong>${matchDate}</strong> a été refusée.</p>
            </div>
            
            ${rejectionComment ? `
            <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #991b1b; margin: 0; font-weight: 600; margin-bottom: 8px;">Raison du refus :</p>
              <p style="color: #991b1b; margin: 0;">${rejectionComment.replace(/\n/g, '<br>')}</p>
            </div>
            ` : `
            <p>Cela peut être dû à :</p>
            <ul style="color: #4b5563; margin-left: 20px; margin-bottom: 16px;">
              <li>Le nombre maximum de spectateurs a été atteint</li>
              <li>Des restrictions spécifiques pour ce match</li>
              <li>Des informations manquantes ou incorrectes</li>
            </ul>
            `}
            
            <p>Nous vous encourageons à faire une nouvelle demande pour un autre match si vous le souhaitez.</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Pour toute question, n'hésitez pas à nous contacter à contact@comebac.com
            </p>
          </div>

          <!-- English Section -->
          <div>
            <p style="margin-bottom: 16px;"><strong>🇬🇧 English</strong></p>
            <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
            
            <div class="info-box">
              <p>We regret to inform you that your spectator request for the <strong>${teamName}</strong> match on <strong>${matchDate}</strong> has been rejected.</p>
            </div>
            
            ${rejectionComment ? `
            <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #991b1b; margin: 0; font-weight: 600; margin-bottom: 8px;">Rejection reason:</p>
              <p style="color: #991b1b; margin: 0;">${rejectionComment.replace(/\n/g, '<br>')}</p>
            </div>
            ` : `
            <p>This may be due to:</p>
            <ul style="color: #4b5563; margin-left: 20px; margin-bottom: 16px;">
              <li>The maximum number of spectators has been reached</li>
              <li>Specific restrictions for this match</li>
              <li>Missing or incorrect information</li>
            </ul>
            `}
            
            <p>We encourage you to submit a new request for another match if you wish.</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              For any questions, please contact us at contact@comebac.com
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>ComeBac League</strong></p>
          <p>Championnat de Football Scolaire / School Football Championship</p>
        </div>
      </div>
    </body>
    </html>
  `
}
