# 🔄 Système de Backup Automatique - ComeBac League

## 📋 Vue d'ensemble

Ce document explique comment configurer et utiliser le système de backup automatique de la base de données Firestore.

## 🎯 Options de Backup GRATUITES

### 1. Téléchargement Direct (100% GRATUIT - Recommandé)

L'API `/api/admin/backup` permet de créer un backup complet et de l'uploader automatiquement vers différents services.

#### Utilisation

```bash
# 1. Téléchargement direct (100% GRATUIT - Recommandé)
# Ouvrez simplement cette URL dans votre navigateur ou utilisez curl:
curl -X POST http://localhost:3000/api/admin/backup -o backup.json

# 2. Sauvegarde locale automatique (100% GRATUIT)
curl -X POST http://localhost:3000/api/admin/backup \
  -H "Content-Type: application/json" \
  -d '{"destination": "local", "upload": true}'
# Le fichier sera sauvegardé dans ./backups/

# 3. Envoi par email (100% GRATUIT - Via Resend)
curl -X POST http://localhost:3000/api/admin/backup \
  -H "Content-Type: application/json" \
  -d '{"destination": "email", "upload": true}'
# Le backup sera envoyé à l'email admin configuré
```

### 2. Backup via Script Automatique

Le script `scripts/backup-automatic.ts` peut être exécuté manuellement ou via un cron job.

#### Installation des dépendances

```bash
# Pour Google Cloud Storage
npm install @google-cloud/storage

# Pour AWS S3
npm install @aws-sdk/client-s3
```

#### Exécution manuelle

```bash
npm run backup:auto
# ou
ts-node scripts/backup-automatic.ts
```

#### Configuration Cron (Linux/Mac)

Ajoutez cette ligne à votre crontab (`crontab -e`):

```bash
# Backup tous les jours à 2h du matin
0 2 * * * cd /path/to/comebac && npm run backup:auto >> /var/log/comebac-backup.log 2>&1

# Backup tous les lundis à 3h du matin
0 3 * * 1 cd /path/to/comebac && npm run backup:auto >> /var/log/comebac-backup.log 2>&1

# Backup toutes les 6 heures
0 */6 * * * cd /path/to/comebac && npm run backup:auto >> /var/log/comebac-backup.log 2>&1
```

## ⚙️ Configuration (100% GRATUIT)

### Option 1: Téléchargement Direct (Aucune configuration requise)

**C'est la méthode la plus simple et 100% gratuite !**

1. Allez dans l'interface admin → Onglet "Réparations"
2. Cliquez sur "Backup Automatique"
3. Le fichier JSON sera téléchargé automatiquement
4. Sauvegardez-le où vous voulez (votre ordinateur, Google Drive, Dropbox, etc.)

### Option 2: Sauvegarde Locale Automatique

Aucune configuration requise ! Les backups seront sauvegardés dans le dossier `./backups/` sur votre serveur.

**Optionnel** - Pour changer le dossier de sauvegarde, ajoutez dans `.env.local`:

```env
BACKUP_LOCAL_DIR=./backups
BACKUP_MAX_FILES=30  # Nombre de backups à conserver (défaut: 30)
```

### Option 3: Envoi par Email (Gratuit via Resend)

Si vous avez déjà configuré Resend pour les emails, vous pouvez recevoir les backups par email:

```env
RESEND_API_KEY=votre_cle_resend
ADMIN_EMAIL=contact@comebac.com  # Email où recevoir les backups
```

**Note:** Les emails sont limités à ~20MB. Pour les backups plus volumineux, utilisez le téléchargement direct.

### Options Payantes (Non recommandées)

#### Pour Google Cloud Storage (PAYANT)

```env
# Google Cloud Storage
GCS_BUCKET_NAME=comebac-backups
GCS_PROJECT_ID=scolar-league
GCS_KEY_FILE=/path/to/service-account-key.json  # Optionnel
```

**Étapes pour configurer GCS:**

1. Créez un bucket dans Google Cloud Storage:
   ```bash
   gsutil mb gs://comebac-backups
   ```

2. Configurez les permissions IAM:
   ```bash
   gsutil iam ch serviceAccount:YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com:objectAdmin gs://comebac-backups
   ```

3. Ou utilisez les credentials par défaut de votre environnement

#### Pour AWS S3

```env
# AWS S3
AWS_S3_BUCKET_NAME=comebac-backups
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

**Étapes pour configurer S3:**

1. Créez un bucket S3 dans AWS Console
2. Créez un utilisateur IAM avec les permissions `s3:PutObject`
3. Générez les clés d'accès

#### Pour Backup Local

```env
# Backup Local (optionnel)
BACKUP_LOCAL_DIR=./backups
BACKUP_MAX_FILES=30  # Nombre de backups à conserver
```

### Configuration du Script Automatique

Ajoutez dans `package.json`:

```json
{
  "scripts": {
    "backup:auto": "ts-node scripts/backup-automatic.ts"
  }
}
```

## 📦 Collections Sauvegardées

Le système sauvegarde automatiquement toutes ces collections:

- `teams` - Équipes
- `players` - Joueurs
- `coachAccounts` - Comptes coaches
- `playerAccounts` - Comptes joueurs
- `teamRegistrations` - Inscriptions d'équipes
- `matches` - Matchs
- `matchResults` - Résultats
- `lineups` - Compositions
- `notifications` - Notifications
- `userProfiles` - Profils utilisateurs
- `teamStatistics` - Statistiques d'équipes
- `seasonArchives` - Archives des saisons
- `fantasyTeams` - Équipes Fantasy
- `favorites` - Favoris

## 🔄 Workflow de Backup

1. **Récupération des données**: Toutes les collections sont récupérées en parallèle
2. **Création du fichier JSON**: Les données sont formatées avec métadonnées
3. **Upload (optionnel)**: Le fichier est uploadé vers le service de stockage choisi
4. **Nettoyage**: Les anciens backups sont supprimés (si configuré)

## 📊 Format du Backup

Le fichier de backup contient:

```json
{
  "metadata": {
    "backupDate": "2025-01-XXT...",
    "backupVersion": "1.0",
    "projectId": "scolar-league",
    "totalCollections": 14,
    "totalDocuments": 1234
  },
  "collections": {
    "teams": [...],
    "players": [...],
    ...
  },
  "summary": {
    "teams": 10,
    "players": 150,
    ...
  }
}
```

## 🚀 Intégration avec Vercel Cron (Recommandé)

Si vous déployez sur Vercel, vous pouvez utiliser Vercel Cron:

1. Créez `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/backup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

2. L'API sera appelée automatiquement selon le schedule

## 🔐 Sécurité

- Les backups contiennent des données sensibles (emails, etc.)
- Stockez les backups dans un bucket privé
- Configurez les permissions IAM correctement
- Chiffrez les backups si nécessaire
- Ne commitez jamais les clés d'accès dans Git

## 📝 Restauration

Pour restaurer un backup:

1. Téléchargez le fichier de backup
2. Utilisez l'API d'import ou un script de restauration
3. Vérifiez l'intégrité des données

## 🐛 Dépannage

### Erreur: "Variables GCS requises"
- Vérifiez que `GCS_BUCKET_NAME` et `GCS_PROJECT_ID` sont configurés
- Vérifiez les permissions du service account

### Erreur: "Upload échoué"
- Vérifiez votre connexion internet
- Vérifiez les permissions du bucket
- Vérifiez les logs pour plus de détails

### Backup trop volumineux
- Le backup peut être volumineux si beaucoup de données
- Considérez un backup incrémental
- Compressez les backups avant upload

## 📚 Ressources

- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Vercel Cron Documentation](https://vercel.com/docs/cron-jobs)

---

**Dernière mise à jour**: 2025-01-XX

