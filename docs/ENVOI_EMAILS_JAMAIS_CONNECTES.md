no# 📧 Envoi d'emails aux comptes jamais connectés

Ce guide explique comment envoyer des emails de rappel aux utilisateurs qui n'ont jamais activé leur compte.

## 🎯 Objectif

Envoyer automatiquement un email de rappel à tous les comptes (joueurs et coaches) qui ont été créés mais qui ne se sont jamais connectés.

## 📋 Prérequis

1. **Configuration Firebase Admin** : Les variables d'environnement Firebase doivent être configurées dans `.env.local`
2. **Configuration Resend** : Vous devez avoir une clé API Resend configurée

### Configuration de Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Obtenez votre clé API
3. Ajoutez-la dans votre fichier `.env.local` :

```bash
RESEND_API_KEY=re_votre_cle_api_ici
EMAIL_FROM=ComeBac League <noreply@votre-domaine.com>
```

## 🚀 Utilisation

### Option 1 : Via le script CLI (Recommandé)

#### Mode simulation (Dry Run)
Pour voir quels comptes seraient concernés sans envoyer d'emails :

```bash
npm run send-never-logged-in-emails
```

#### Envoi réel
Pour envoyer les emails :

```bash
npm run send-never-logged-in-emails -- --send
```

### Option 2 : Via l'API

Vous pouvez aussi appeler l'API directement :

```bash
# Mode simulation
curl -X POST http://localhost:3000/api/admin/send-never-logged-in-emails \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Envoi réel
curl -X POST http://localhost:3000/api/admin/send-never-logged-in-emails \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

## 📊 Résultats

Le script affiche :
- Le nombre total de comptes jamais connectés
- Le statut de chaque envoi (réussi/échoué)
- Les détails de chaque compte :
  - Nom
  - Email
  - Type (joueur/coach)
  - Équipe
  - Date de création

### Exemple de sortie

```
🚀 Script d'envoi d'emails aux comptes jamais connectés
============================================================
Mode: 🔍 DRY RUN (simulation)
============================================================

ℹ️  Mode simulation activé - aucun email ne sera envoyé
ℹ️  Pour envoyer les emails, utilisez: npm run send-never-logged-in-emails -- --send

✅ Traitement terminé
📊 Total de comptes jamais connectés: 5

📋 Résultats:
────────────────────────────────────────────────────────────
🔍 dry-run: 5

📝 Détails:
────────────────────────────────────────────────────────────
1. 🔍 ⚽ Jean Dupont
   Email: jean.dupont@example.com
   Équipe: Les Aigles
   Type: player
   Créé le: 10/11/2025

2. 🔍 🏆 Marie Martin
   Email: marie.martin@example.com
   Équipe: Les Lions
   Type: coach
   Créé le: 12/11/2025
```

## 📧 Contenu de l'email

L'email envoyé contient :
- Un message personnalisé avec le nom de l'utilisateur
- Le nom de son équipe
- Un lien pour créer son mot de passe (valable 1 heure)
- Une liste des fonctionnalités disponibles selon le type de compte
- Un design différent pour les coaches (orange/rouge) et les joueurs (vert/bleu)

## 🔒 Sécurité

- Le lien de réinitialisation est généré par Firebase et expire après 1 heure
- Seuls les comptes avec `lastSignInTime` null sont ciblés
- Le mode dry-run permet de vérifier avant d'envoyer

## ⚠️ Notes importantes

1. **Limite d'envoi** : Vérifiez les limites de votre plan Resend
2. **Spam** : N'envoyez pas trop souvent aux mêmes utilisateurs
3. **Test** : Utilisez toujours le mode dry-run d'abord
4. **Logs** : Les résultats sont affichés dans la console

## 🐛 Dépannage

### "RESEND_API_KEY non configurée"
- Vérifiez que la clé API est bien dans `.env.local`
- Redémarrez votre serveur Next.js après modification

### "Failed to initialize Resend client"
- Vérifiez que votre clé API est valide
- Vérifiez votre connexion internet

### Aucun email reçu
- Vérifiez les logs de la console
- Vérifiez le dossier spam
- Vérifiez que l'email FROM est vérifié dans Resend

## 📚 Fichiers concernés

- `/app/api/admin/send-never-logged-in-emails/route.ts` - API endpoint
- `/scripts/send-never-logged-in-emails.ts` - Script CLI
- `/lib/email-service.ts` - Service d'envoi d'emails
- `/lib/firebase-admin.ts` - Configuration Firebase Admin
