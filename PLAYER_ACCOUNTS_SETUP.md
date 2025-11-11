# Configuration des Comptes Joueurs

## Fonctionnement

Quand un admin approuve une équipe dans `/admin/team-registrations`, le système:

1. ✅ Crée l'équipe dans Firestore
2. ✅ Crée les joueurs dans Firestore avec leurs emails
3. ✅ Crée automatiquement un compte Firebase Auth pour chaque joueur
4. ✅ Génère un lien de création de mot de passe
5. ✅ Envoie un email à chaque joueur avec le lien

## Configuration Firebase Admin SDK

### 1. Créer un Service Account

1. Allez dans Firebase Console → Project Settings → Service Accounts
2. Cliquez sur "Generate new private key"
3. Téléchargez le fichier JSON

### 2. Configurer les variables d'environnement

Créez un fichier `.env.local` avec:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important:** La clé privée doit être entre guillemets et contenir les `\n` pour les retours à la ligne.

## Configuration Email (Optionnel)

Pour l'instant, les emails sont loggés dans la console. Pour envoyer de vrais emails:

### Option 1: SendGrid (Recommandé)

```bash
npm install @sendgrid/mail
```

Dans `lib/email-service.ts`:

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendEmail(data: EmailData) {
  await sgMail.send({
    to: data.to,
    from: process.env.EMAIL_FROM!,
    subject: data.subject,
    html: data.html
  })
}
```

### Option 2: Resend (Simple)

```bash
npm install resend
```

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(data: EmailData) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: data.to,
    subject: data.subject,
    html: data.html
  })
}
```

## Flux Utilisateur

### Pour le Joueur:

1. 📧 Reçoit un email "Bienvenue dans ComeBac League"
2. 🔗 Clique sur "Créer mon mot de passe"
3. 🔐 Crée son mot de passe sur Firebase
4. ✅ Se connecte avec son email et mot de passe
5. 🎮 Accède à son profil joueur

### Pour l'Admin:

1. Va sur `/admin/team-registrations`
2. Clique sur "Approuver" pour une équipe
3. Le système crée automatiquement:
   - L'équipe
   - Les joueurs
   - Les comptes Firebase Auth
   - Envoie les emails

## Vérification

Pour vérifier que tout fonctionne:

1. Approuvez une équipe
2. Vérifiez la console pour voir les logs des emails
3. Vérifiez Firebase Console → Authentication pour voir les comptes créés
4. Vérifiez Firestore → `playerAccounts` pour voir les infos

## Sécurité

- ✅ Les comptes sont créés avec `emailVerified: false`
- ✅ Les joueurs doivent créer leur mot de passe via le lien sécurisé
- ✅ Le lien expire après 24h
- ✅ Les emails sont stockés de manière sécurisée dans Firestore

## Troubleshooting

### "Firebase Admin not initialized"
→ Vérifiez que les variables d'environnement sont bien configurées

### "Email already exists"
→ Normal si le joueur a déjà un compte. Le système continue avec les autres.

### "Emails not sent"
→ Normal si vous n'avez pas configuré de service d'email. Vérifiez les logs de la console.

## Prochaines Étapes

1. Configurer un vrai service d'email (SendGrid/Resend)
2. Personnaliser le template d'email
3. Ajouter des notifications dans l'app
4. Créer une page de gestion des comptes joueurs
