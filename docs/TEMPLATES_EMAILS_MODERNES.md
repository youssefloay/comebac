# Templates d'Emails Modernes

## 📧 Vue d'ensemble

Les templates d'emails ont été complètement refondus pour être plus simples, modernes et professionnels.

## ✨ Nouveautés

### Design
- **Style épuré et moderne** avec un design minimaliste
- **Responsive** compatible tous appareils (mobile, tablette, desktop)
- **Couleurs adaptées** selon le type de compte:
  - Joueurs: Bleu → Vert
  - Coaches: Orange → Rouge

### Contenu
- **Logo ComeBac** en haut de l'email
- **Message clair et concis** sans texte superflu
- **Bouton d'action visible** pour créer le mot de passe
- **Alerte visuelle** indiquant que le lien expire dans 1 heure

### Informations de contact
Tous les emails incluent maintenant:
- 📧 **Email**: contact@comebac.com
- 📱 **WhatsApp**: +20 127 831 1195
- 📷 **Instagram**: @comebac.league

### Instructions si le lien expire
Si le lien de 1 heure expire, l'email explique comment:
1. Aller sur le site de connexion
2. Entrer son email
3. Cliquer sur "Mot de passe oublié"

## 📁 Fichiers modifiés

### `lib/email-service.ts`
- `generateWelcomeEmail()` - Email de bienvenue pour les joueurs
- `sendCoachWelcomeEmail()` - Email de bienvenue pour les coaches

### `app/admin/email-preview/page.tsx`
- Page de prévisualisation des templates
- Permet de basculer entre version joueur et coach
- Affiche les caractéristiques des emails

### `components/dashboard/tabs/maintenance-tab.tsx`
- Ajout d'un bouton "Prévisualiser emails" dans l'onglet Réparer
- Permet d'accéder rapidement à la page de prévisualisation

## 🎨 Structure des emails

```
┌─────────────────────────────────┐
│ Header (gradient coloré)        │
│   - Logo ComeBac (cercle)       │
│   - Titre "Bienvenue"            │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Contenu (fond blanc)             │
│   - Message de bienvenue         │
│   - Bouton d'action              │
│   - Alerte expiration (1h)       │
│   - Instructions si expiré       │
│   - Informations de contact      │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Footer (fond gris clair)         │
│   - ComeBac League               │
│   - Championnat de Football      │
└─────────────────────────────────┘
```

## 🔍 Prévisualisation

Pour voir les templates:
1. Aller dans **Admin** → **Réparer**
2. Cliquer sur le bouton **"Prévisualiser emails"**
3. Basculer entre version Joueur et Coach

Ou directement: `/admin/email-preview`

## 📝 Variables utilisées

### Email Joueur
- `playerName` - Nom du joueur
- `teamName` - Nom de l'équipe
- `playerEmail` - Email du joueur
- `resetLink` - Lien de création de mot de passe
- `appUrl` - URL de l'application

### Email Coach
- `firstName` - Prénom du coach
- `lastName` - Nom du coach
- `teamName` - Nom de l'équipe
- `email` - Email du coach
- `resetLink` - Lien de création de mot de passe
- `appUrl` - URL de l'application

## ⚙️ Configuration

Les emails utilisent la variable d'environnement:
- `NEXT_PUBLIC_APP_URL` - URL de l'application (défaut: https://www.comebac.com)
- `EMAIL_FROM` - Expéditeur des emails (défaut: ComeBac League)
- `RESEND_API_KEY` - Clé API Resend pour l'envoi

## 🚀 Utilisation

Les emails sont envoyés automatiquement lors de:
1. **Validation d'une équipe** - Tous les joueurs et coaches reçoivent un email
2. **Envoi manuel** - Via l'onglet Réparer → "Emails jamais connectés"

## 📊 Avantages

✅ **Plus simple** - Design épuré sans éléments superflus
✅ **Plus moderne** - Utilisation de gradients et coins arrondis
✅ **Plus pro** - Logo et informations de contact visibles
✅ **Plus clair** - Instructions précises et alerte d'expiration
✅ **Plus accessible** - Responsive et compatible tous clients email
