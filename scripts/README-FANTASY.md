# Scripts Fantasy ComeBac League

Ce document décrit les scripts disponibles pour gérer le mode Fantasy.

## 📋 Scripts disponibles

### 1. `init-fantasy-data.ts` - Initialisation des données Fantasy

**Description:** Script d'initialisation qui prépare la base de données pour le mode Fantasy.

**Ce qu'il fait:**
- ✅ Récupère tous les joueurs de la base de données
- ✅ Calcule le prix initial de chaque joueur basé sur:
  - Position (Gardien: 4.5M€, Défenseur: 5.0M€, Milieu: 6.0M€, Attaquant: 7.0M€)
  - Statistiques de saison (buts, passes, matchs joués)
  - Statut de capitaine
  - Note générale (overall)
- ✅ Crée les `PlayerFantasyStats` pour chaque joueur
- ✅ Crée la première gameweek (journée de championnat)

**Quand l'utiliser:**
- Au début de la saison Fantasy
- Après avoir ajouté de nouveaux joueurs dans la base de données
- Pour réinitialiser les données Fantasy (attention: vérifie les doublons)

**Usage:**
```bash
npm run init-fantasy
```

Ou directement:
```bash
npx tsx scripts/init-fantasy-data.ts
```

**Prérequis:**
- Variables d'environnement Firebase configurées dans `.env.local`
- Au moins un joueur dans la collection `players`

**Sécurité:**
- ✅ Le script vérifie si les stats Fantasy existent déjà pour éviter les doublons
- ✅ Le script vérifie si la gameweek existe déjà
- ✅ Affiche un résumé détaillé des opérations effectuées

**Exemple de sortie:**
```
🎮 ========================================
🎮 Initialisation des données Fantasy
🎮 ========================================

📥 Récupération de tous les joueurs...
✅ 42 joueurs récupérés

💰 Calcul des prix et création des stats Fantasy...
   ✅ Ahmed Mohamed - 5.2M€
   ✅ Omar Hassan - 6.1M€
   ✅ Youssef Ali - 7.8M€
   ...

📊 Résumé des stats Fantasy:
   ✅ Créées: 42
   ⏭️  Ignorées (déjà existantes): 0
   📈 Total: 42

📅 Création de la première gameweek...
✅ Gameweek 1 créée
   📅 Début: 14/11/2025
   📅 Fin: 21/11/2025
   ⏰ Deadline: 14/11/2025 à 10:00

🎉 ========================================
🎉 Initialisation terminée avec succès!
🎉 ========================================

📋 Prochaines étapes:
   1. Les utilisateurs peuvent maintenant créer leurs équipes Fantasy
   2. Après chaque match, exécutez le script de mise à jour des points
   3. Chaque semaine, exécutez le script de nouvelle gameweek
```

### 2. `update-fantasy-after-match.ts` - Mise à jour après un match

**Description:** Script qui met à jour toutes les équipes Fantasy après qu'un match soit terminé.

**Ce qu'il fait:**
- ✅ Récupère le résultat du match depuis `matchResults`
- ✅ Calcule les points Fantasy de tous les joueurs du match selon la grille de points
- ✅ Met à jour toutes les équipes Fantasy qui ont des joueurs du match
- ✅ Double les points du capitaine
- ✅ Envoie des notifications aux utilisateurs:
  - Points gagnés par l'équipe
  - Performance du capitaine (si ≥10 points)
  - Excellente performance d'un joueur (si ≥15 points)
  - Amélioration du classement
- ✅ Met à jour le classement global
- ✅ Vérifie et attribue les badges:
  - Top 10 de la semaine
  - Podium (top 3)
  - Century (100+ points en une gameweek)
  - Captain Parfait (meilleur capitaine)
- ✅ Met à jour les statistiques Fantasy des joueurs

**Quand l'utiliser:**
- Après chaque match terminé
- Pour recalculer les points d'un match spécifique
- Pour traiter tous les matchs en une fois (mode `--all`)

**Usage:**
```bash
# Traiter un match spécifique
npm run update-fantasy-after-match <matchId>

# Traiter tous les matchs terminés
npm run update-fantasy-after-match --all
```

Ou directement:
```bash
# Un match
npx tsx scripts/update-fantasy-after-match.ts abc123

# Tous les matchs
npx tsx scripts/update-fantasy-after-match.ts --all
```

**Prérequis:**
- Variables d'environnement Firebase Admin configurées
- Le match doit avoir un résultat dans `matchResults`
- Les équipes Fantasy doivent exister

**Grille de points appliquée:**

| Action | Gardien | Défenseur | Milieu | Attaquant |
|--------|---------|-----------|--------|-----------|
| Match joué (60+ min) | +2 | +2 | +2 | +2 |
| Match joué (<60 min) | +1 | +1 | +1 | +1 |
| But marqué | +10 | +6 | +5 | +4 |
| Passe décisive | +3 | +3 | +3 | +3 |
| Clean sheet | +4 | +4 | +1 | - |
| 2 buts encaissés | -1 | - | - | - |
| Victoire équipe | +2 | +2 | +2 | +2 |
| Match nul | +1 | +1 | +1 | +1 |
| Carton jaune | -1 | -1 | -1 | -1 |
| Carton rouge | -3 | -3 | -3 | -3 |
| Penalty arrêté | +5 | - | - | - |
| Penalty manqué | -2 | -2 | -2 | -2 |

**Exemple de sortie:**
```
============================================================
🎮 Traitement du match: abc123
============================================================
📍 Match: team1 vs team2
📊 Score: 3 - 2

👥 8 joueurs ont participé au match

📈 Points Fantasy par joueur:
  • player1: 12 points (2⚽ 1🅰️)
  • player2: 8 points (1⚽ 0🅰️)
  • player3: 5 points (0⚽ 1🅰️)
  ...

📊 Mise à jour des équipes Fantasy...
  ✅ Les Guerriers: +24 points
  ✅ Dream Team: +18 points
  ✅ FC Champions: +15 points

✅ 12 équipes mises à jour
✅ 15 notifications envoyées

🏆 Mise à jour du classement...
✅ Classement mis à jour

  🏆 2 badge(s) attribué(s) à Les Guerriers

✅ Traitement du match abc123 terminé

============================================================
✅ Script terminé avec succès
============================================================
```

**Notifications envoyées:**
- 📧 Points gagnés (si > 0)
- 👑 Capitaine performant (si ≥ 10 points)
- ⭐ Joueur exceptionnel (si ≥ 15 points)
- 📈 Amélioration du classement (top 100, 50, 10)
- 🏆 Nouveau badge débloqué

**Badges vérifiés:**
- 🏆 Top 10 de la semaine (rang hebdomadaire ≤ 10)
- 🥇 Podium (rang général ≤ 3)
- 💯 Century (≥ 100 points en une gameweek)
- 👑 Captain Parfait (capitaine avec ≥ 20 points)

### 3. `update-player-prices.ts` - Mise à jour des prix des joueurs

**Description:** Script qui ajuste les prix de tous les joueurs basés sur leur forme récente.

**Ce qu'il fait:**
- ✅ Récupère tous les joueurs et leurs statistiques Fantasy
- ✅ Calcule la forme récente (moyenne des 5 derniers matchs)
- ✅ Ajuste les prix selon la performance:
  - Forme excellente (>8 pts/match): +0.3M€
  - Bonne forme (6-8 pts/match): +0.2M€
  - Forme correcte (4-6 pts/match): +0.1M€
  - Forme moyenne (3-4 pts/match): pas de changement
  - Mauvaise forme (2-3 pts/match): -0.2M€
  - Très mauvaise forme (<2 pts/match): -0.3M€
- ✅ Limite les variations à ±0.5M€ par gameweek
- ✅ Maintient les prix entre 4.0M€ et 15.0M€
- ✅ Affiche un résumé détaillé avec top 5 des augmentations/diminutions

**Quand l'utiliser:**
- Hebdomadairement, au début d'une nouvelle gameweek
- Après plusieurs matchs pour ajuster les prix
- Peut être automatisé avec un cron job

**Usage:**
```bash
# Mise à jour réelle
npm run update-player-prices

# Mode simulation (dry-run) - aucune modification
npm run update-player-prices -- --dry-run
```

Ou directement:
```bash
# Mise à jour réelle
npx tsx scripts/update-player-prices.ts

# Mode simulation
npx tsx scripts/update-player-prices.ts --dry-run
```

**Prérequis:**
- Variables d'environnement Firebase Admin configurées
- Les joueurs doivent avoir des `PlayerFantasyStats` avec historique de forme
- Au moins un match doit avoir été joué pour avoir des données de forme

**Mode dry-run:**
Le mode `--dry-run` permet de simuler les changements sans modifier la base de données. Utile pour:
- Vérifier les changements avant de les appliquer
- Tester la logique de calcul
- Générer des rapports

**Exemple de sortie:**
```
======================================================================
💰 MISE À JOUR DES PRIX DES JOUEURS FANTASY
======================================================================

📊 42 joueurs à traiter

📈 +0.3M€ Ahmed Mohamed (Attaquant): 7.5M€ → 7.8M€ - 🔥 Excellente (8.4 pts/match)
📈 +0.2M€ Omar Hassan (Milieu): 6.0M€ → 6.2M€ - ✅ Bonne (6.8 pts/match)
➖ Youssef Ali (Défenseur): 5.5M€ (stable) - 👍 Correcte (4.2 pts/match)
📉 -0.2M€ Karim Ibrahim (Gardien): 5.0M€ → 4.8M€ - 👎 Mauvaise (2.5 pts/match)
...

======================================================================
📊 RÉSUMÉ DE LA MISE À JOUR
======================================================================

✅ Joueurs traités: 42
   📈 Prix augmentés: 12
   📉 Prix diminués: 8
   ➖ Prix stables: 18
   ⏭️  Sans forme: 4
   🔄 Total modifiés: 20

📈 TOP 5 DES PLUS GRANDES AUGMENTATIONS:
   1. Ahmed Mohamed (Attaquant): +0.3M€ (7.5M€ → 7.8M€)
   2. Omar Hassan (Milieu): +0.2M€ (6.0M€ → 6.2M€)
   3. Ali Mahmoud (Attaquant): +0.2M€ (8.0M€ → 8.2M€)
   4. Hassan Ahmed (Milieu): +0.1M€ (5.5M€ → 5.6M€)
   5. Mohamed Ali (Défenseur): +0.1M€ (5.0M€ → 5.1M€)

📉 TOP 5 DES PLUS GRANDES DIMINUTIONS:
   1. Karim Ibrahim (Gardien): -0.3M€ (5.0M€ → 4.7M€)
   2. Ibrahim Hassan (Défenseur): -0.2M€ (5.5M€ → 5.3M€)
   3. Mahmoud Omar (Milieu): -0.2M€ (6.0M€ → 5.8M€)
   4. Ali Hassan (Attaquant): -0.1M€ (7.0M€ → 6.9M€)
   5. Hassan Karim (Défenseur): -0.1M€ (5.0M€ → 4.9M€)

======================================================================
✅ Mise à jour des prix terminée avec succès
======================================================================
```

**Impact sur les équipes Fantasy:**
- Les prix mis à jour affectent les futurs transferts
- Les joueurs déjà dans une équipe conservent leur prix d'achat
- Les utilisateurs voient les nouveaux prix dans la liste des joueurs disponibles
- Les variations de prix sont visibles sur les profils des joueurs

**Automatisation recommandée:**
```bash
# Cron job hebdomadaire (chaque lundi à 2h du matin)
0 2 * * 1 cd /path/to/project && npm run update-player-prices
```

### 4. `start-new-gameweek.ts` - Démarrage d'une nouvelle gameweek

**Description:** Script qui démarre une nouvelle gameweek et prépare toutes les équipes Fantasy.

**Ce qu'il fait:**
- ✅ Récupère la gameweek active actuelle
- ✅ Calcule le classement hebdomadaire de la gameweek précédente
- ✅ Clôture la gameweek actuelle (marque comme complétée)
- ✅ Réinitialise les transferts gratuits (2 par équipe)
- ✅ Réinitialise les points hebdomadaires de toutes les équipes
- ✅ Réinitialise les points hebdomadaires des joueurs dans les stats Fantasy
- ✅ Crée une nouvelle gameweek avec:
  - Numéro incrémenté
  - Date de début (fin de la gameweek précédente ou date personnalisée)
  - Date de fin (7 jours après le début)
  - Deadline (2 heures avant le début)
- ✅ Envoie des notifications de deadline à tous les utilisateurs
- ✅ Affiche le top 3 de la gameweek précédente

**Quand l'utiliser:**
- Au début de chaque nouvelle gameweek (semaine de championnat)
- Typiquement le lundi matin avant les matchs de la semaine
- Peut être automatisé avec un cron job

**Usage:**
```bash
# Démarrer la prochaine gameweek (date automatique)
npm run start-new-gameweek

# Spécifier une date de début personnalisée
npm run start-new-gameweek -- --date "2024-12-01"
```

Ou directement:
```bash
# Date automatique
npx tsx scripts/start-new-gameweek.ts

# Date personnalisée
npx tsx scripts/start-new-gameweek.ts --date "2024-12-01"
```

**Prérequis:**
- Variables d'environnement Firebase Admin configurées
- Au moins une gameweek doit exister (créée par `init-fantasy-data.ts`)
- Des équipes Fantasy doivent exister pour envoyer les notifications

**Exemple de sortie:**
```
============================================================
🎮 Démarrage d'une nouvelle gameweek Fantasy
============================================================

📊 Gameweek actuelle: 3

🏆 Calcul du classement hebdomadaire (Gameweek 3)...
✅ Classement hebdomadaire calculé

🏆 Top 3 de la gameweek 3:
   1. Les Guerriers: 87 points
   2. Dream Team: 82 points
   3. FC Champions: 79 points

📅 Clôture de la gameweek actuelle...
✅ Gameweek clôturée

🔄 Réinitialisation des transferts gratuits...
✅ 24 équipes mises à jour avec 2 transferts gratuits

🔄 Réinitialisation des points hebdomadaires...
✅ 24 équipes réinitialisées

🔄 Réinitialisation des stats hebdomadaires des joueurs...
✅ 42 joueurs réinitialisés

📅 Création de la gameweek 4...
✅ Gameweek 4 créée
   📅 Début: 21/11/2025 à 12:00
   📅 Fin: 28/11/2025 à 12:00
   ⏰ Deadline: 21/11/2025 à 10:00

📬 Envoi des notifications de deadline...
✅ 24 notifications envoyées

============================================================
✅ Nouvelle gameweek 4 démarrée avec succès!
============================================================

📊 Résumé:
   • Gameweek: 4
   • Équipes mises à jour: 24
   • Notifications envoyées: 24
   • Date de début: 21/11/2025 à 12:00

📋 Prochaines étapes:
   1. Les utilisateurs peuvent effectuer leurs transferts
   2. Après chaque match, exécutez le script de mise à jour des points
   3. À la fin de la gameweek, exécutez à nouveau ce script
```

**Notifications envoyées:**
- 📧 Notification à tous les utilisateurs avec équipe Fantasy
- Message: "⏰ Nouvelle gameweek X ! Deadline de transferts dans Yh"
- Lien vers la page des transferts
- Métadonnées incluant le numéro de gameweek et les heures restantes

**Ordre des opérations:**
1. Calcul du classement hebdomadaire (avant réinitialisation)
2. Clôture de la gameweek actuelle
3. Réinitialisation des transferts gratuits
4. Réinitialisation des points hebdomadaires (équipes)
5. Réinitialisation des points hebdomadaires (joueurs)
6. Création de la nouvelle gameweek
7. Envoi des notifications

**Automatisation recommandée:**
```bash
# Cron job hebdomadaire (chaque lundi à 8h du matin)
0 8 * * 1 cd /path/to/project && npm run start-new-gameweek
```

**Workflow complet hebdomadaire:**
```bash
# 1. Démarrer la nouvelle gameweek (lundi matin)
npm run start-new-gameweek

# 2. Mettre à jour les prix des joueurs (lundi matin)
npm run update-player-prices

# 3. Après chaque match de la semaine
npm run update-fantasy-after-match <matchId>
```

## 🗄️ Collections Firestore créées

### `player_fantasy_stats`
Statistiques Fantasy pour chaque joueur:
```typescript
{
  playerId: string          // ID du joueur
  price: number            // Prix actuel (4.0 - 15.0M€)
  totalPoints: number      // Points totaux de la saison
  gameweekPoints: number   // Points de la gameweek en cours
  popularity: number       // % d'équipes qui l'ont sélectionné
  form: number[]          // Points des 5 derniers matchs
  priceChange: number     // Variation de prix récente
  selectedBy: number      // Nombre d'équipes qui l'ont
  updatedAt: Timestamp
}
```

### `fantasy_gameweeks`
Informations sur les gameweeks:
```typescript
{
  number: number          // Numéro de la gameweek
  startDate: Timestamp    // Date de début
  endDate: Timestamp      // Date de fin
  deadline: Timestamp     // Deadline pour les transferts
  isActive: boolean       // Si c'est la gameweek active
  isCompleted: boolean    // Si elle est terminée
}
```

## 🔄 Workflow complet

1. **Initialisation** (une fois au début de la saison)
   ```bash
   npm run init-fantasy
   ```

2. **Après chaque match**
   ```bash
   npm run update-fantasy-after-match <matchId>
   ```
   - Calcule les points des joueurs
   - Met à jour les équipes Fantasy
   - Envoie les notifications
   - Attribue les badges

3. **Chaque semaine**
   ```bash
   npm run start-new-gameweek
   ```
   - Clôture la gameweek actuelle
   - Crée une nouvelle gameweek
   - Réinitialise les transferts gratuits
   - Réinitialise les points hebdomadaires
   - Envoie les notifications de deadline

## 🛠️ Développement

### Ajouter un nouveau script

1. Créer le fichier dans `scripts/`
2. Ajouter l'entrée dans `package.json`:
   ```json
   "scripts": {
     "mon-script": "npx tsx scripts/mon-script.ts"
   }
   ```
3. Documenter dans ce README

### Structure recommandée

```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Configuration Firebase
const firebaseConfig = { /* ... */ }
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function monScript() {
  try {
    console.log('🚀 Début du script...')
    // Logique du script
    console.log('✅ Script terminé')
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

monScript()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
```

## 🌐 API Admin

### `/api/admin/fantasy/gameweek` - Gestion des gameweeks

**POST** - Créer une nouvelle gameweek
```typescript
// Request
POST /api/admin/fantasy/gameweek
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2024-12-01" // Optionnel, date de début personnalisée
}

// Response
{
  "success": true,
  "message": "✅ Gameweek 4 créée avec succès",
  "data": {
    "gameweekId": "abc123",
    "gameweekNumber": 4,
    "startDate": "2024-12-01T00:00:00.000Z",
    "endDate": "2024-12-08T00:00:00.000Z",
    "deadline": "2024-11-30T22:00:00.000Z",
    "teamsUpdated": 24,
    "notificationsSent": 24
  }
}
```

**PATCH** - Clôturer la gameweek active
```typescript
// Request
PATCH /api/admin/fantasy/gameweek
Authorization: Bearer <token>

// Response
{
  "success": true,
  "message": "✅ Gameweek 3 clôturée avec succès",
  "data": {
    "gameweekId": "xyz789",
    "gameweekNumber": 3
  }
}
```

**GET** - Récupérer les informations de la gameweek active
```typescript
// Request
GET /api/admin/fantasy/gameweek
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "activeGameweek": {
      "id": "abc123",
      "number": 4,
      "startDate": "2024-12-01T00:00:00.000Z",
      "endDate": "2024-12-08T00:00:00.000Z",
      "deadline": "2024-11-30T22:00:00.000Z",
      "isActive": true,
      "isCompleted": false
    },
    "gameweeksHistory": [
      // 10 dernières gameweeks
    ]
  }
}
```

**Fonctionnalités:**
- ✅ Authentification admin requise
- ✅ Clôture automatique de la gameweek précédente lors de la création
- ✅ Calcul du classement hebdomadaire avant clôture
- ✅ Réinitialisation des transferts gratuits (2 par équipe)
- ✅ Réinitialisation des points hebdomadaires
- ✅ Envoi de notifications de deadline
- ✅ Historique des 10 dernières gameweeks

## 📚 Ressources

- [Documentation Fantasy](../docs/FANTASY_API.md) (à créer)
- [Design Document](../.kiro/specs/fantasy-mode/design.md)
- [Requirements](../.kiro/specs/fantasy-mode/requirements.md)
- [Tasks](../.kiro/specs/fantasy-mode/tasks.md)

## ⚠️ Notes importantes

- **Toujours tester sur un environnement de développement d'abord**
- Les scripts modifient directement la base de données
- Faire des backups avant d'exécuter des scripts de migration
- Vérifier les variables d'environnement avant l'exécution
