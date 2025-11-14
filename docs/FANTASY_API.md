# Fantasy API Documentation

Documentation complète de l'API Fantasy ComeBac League.

## Table des matières

- [Endpoints Publics](#endpoints-publics)
  - [Créer une équipe Fantasy](#post-apifantasycreate-team)
  - [Récupérer une équipe Fantasy](#get-apifantasyget-team)
  - [Effectuer un transfert](#post-apifantasytransfers)
  - [Utiliser le Wildcard](#post-apifantasywildcard)
  - [Vérifier le Wildcard](#get-apifantasywildcard)
  - [Récupérer le classement](#get-apifantasyleaderboard)
  - [Récupérer les stats d'un joueur](#get-apifantasyplayer-statsid)
- [Endpoints Admin](#endpoints-admin)
  - [Initialiser les données Fantasy](#post-apiadminfantasyinit-data)
  - [Créer une nouvelle gameweek](#post-apiadminfantasygameweek)
  - [Clôturer la gameweek active](#patch-apiadminfantasygameweek)
  - [Récupérer la gameweek active](#get-apiadminfantasygameweek)
  - [Démarrer une nouvelle gameweek](#post-apiadminfantasystart-gameweek)
  - [Mettre à jour après un match](#post-apiadminfantasyupdate-after-match)
  - [Mettre à jour les prix](#post-apiadminfantasyupdate-prices)
  - [Recalculer les points manuellement](#post-apiadminfantasyupdate-points)
- [Modèles de données](#modèles-de-données)
- [Codes d'erreur](#codes-derreur)

---

## Endpoints Publics

### POST `/api/fantasy/create-team`

Créer une nouvelle équipe Fantasy pour un utilisateur.


**Request Body:**
```json
{
  "userId": "string (required)",
  "teamName": "string (required, 3-30 caractères)",
  "formation": "Formation (required, ex: '4-2-0', '3-3-0', '3-2-1', '2-3-1', '2-2-2')",
  "players": [
    {
      "playerId": "string",
      "position": "Position ('Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant')",
      "price": "number"
    }
  ],
  "captainId": "string (required, doit être un playerId de l'équipe)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Équipe Fantasy créée avec succès",
  "team": {
    "id": "string",
    "userId": "string",
    "teamName": "string",
    "budget": 100,
    "budgetRemaining": "number",
    "formation": "Formation",
    "players": [...],
    "captainId": "string",
    "totalPoints": 0,
    "gameweekPoints": 0,
    "rank": 0,
    "weeklyRank": 0,
    "transfers": 2,
    "wildcardUsed": false,
    "badges": [],
    "createdAt": "Timestamp",
    "updatedAt": "Timestamp"
  }
}
```

**Validations:**
- L'utilisateur ne doit pas avoir déjà une équipe Fantasy
- Le nom d'équipe doit contenir entre 3 et 30 caractères
- Exactement 7 joueurs doivent être sélectionnés
- La composition doit respecter la formation choisie
- Le budget total ne doit pas dépasser 100M€
- Maximum 3 joueurs d'une même équipe réelle
- Le capitaine doit être un joueur de l'équipe

**Erreurs possibles:**
- `400` - Validation échouée (voir `errors` dans la réponse)
- `400` - Utilisateur a déjà une équipe Fantasy
- `500` - Erreur serveur

**Exemple de requête:**
```bash
curl -X POST https://your-domain.com/api/fantasy/create-team \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "teamName": "Les Champions",
    "formation": "4-2-0",
    "players": [
      {
        "playerId": "player1",
        "position": "Gardien",
        "price": 5.0
      },
      {
        "playerId": "player2",
        "position": "Défenseur",
        "price": 6.5
      }
    ],
    "captainId": "player2"
  }'
```

---

### GET `/api/fantasy/get-team`

Récupérer l'équipe Fantasy d'un utilisateur avec tous les détails des joueurs.

**Query Parameters:**
- `userId` (required): ID de l'utilisateur

**Response (200):**
```json
{
  "success": true,
  "team": {
    "id": "string",
    "userId": "string",
    "teamName": "string",
    "budget": 100,
    "budgetRemaining": "number",
    "formation": "Formation",
    "players": [
      {
        "playerId": "string",
        "position": "Position",
        "price": "number",
        "points": "number",
        "gameweekPoints": "number",
        "isCaptain": "boolean",
        "name": "string",
        "photo": "string | null",
        "number": "number | null",
        "teamId": "string",
        "teamName": "string",
        "teamLogo": "string | null",
        "teamColor": "string | null",
        "school": "string | null",
        "seasonStats": {
          "goals": "number",
          "assists": "number",
          "matches": "number",
          "yellowCards": "number",
          "redCards": "number",
          "minutesPlayed": "number"
        }
      }
    ],
    "captainId": "string",
    "totalPoints": "number",
    "gameweekPoints": "number",
    "rank": "number",
    "weeklyRank": "number",
    "transfers": "number",
    "wildcardUsed": "boolean",
    "badges": ["string"],
    "createdAt": "Timestamp",
    "updatedAt": "Timestamp"
  }
}
```

**Optimisations:**
- Utilise des requêtes batch pour récupérer les détails des joueurs
- Utilise des requêtes batch pour récupérer les informations des équipes
- Les points sont calculés en temps réel depuis la base de données

**Erreurs possibles:**
- `400` - userId manquant
- `404` - Aucune équipe Fantasy trouvée
- `500` - Erreur serveur

**Exemple de requête:**
```bash
curl -X GET "https://your-domain.com/api/fantasy/get-team?userId=user123"
```

---

### POST `/api/fantasy/transfers`

Effectuer un transfert de joueur dans une équipe Fantasy.

**Request Body:**
```json
{
  "teamId": "string (required)",
  "userId": "string (required)",
  "playerOutId": "string (required, ID du joueur à remplacer)",
  "playerInId": "string (required, ID du nouveau joueur)",
  "playerInPrice": "number (required, prix actuel du nouveau joueur)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Transfert effectué avec succès",
  "team": {
    "id": "string",
    ...
  },
  "pointsDeducted": "number (0 si transfert gratuit, 4 sinon)",
  "transfersRemaining": "number"
}
```

**Règles:**
- 2 transferts gratuits par gameweek
- Chaque transfert supplémentaire coûte 4 points
- Le nouveau joueur doit avoir la même position que le joueur sortant
- Le budget doit permettre le transfert
- Le nouveau joueur ne doit pas déjà être dans l'équipe
- Les transferts sont bloqués pendant la gameweek (après la deadline)

**Erreurs possibles:**
- `400` - Paramètres manquants ou invalides
- `400` - Validation du transfert échouée
- `403` - L'équipe n'appartient pas à l'utilisateur
- `404` - Équipe ou joueur non trouvé
- `500` - Erreur serveur

**Exemple de requête:**
```bash
curl -X POST https://your-domain.com/api/fantasy/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "team123",
    "userId": "user123",
    "playerOutId": "player1",
    "playerInId": "player2",
    "playerInPrice": 7.5
  }'
```

---

### POST `/api/fantasy/wildcard`

Utiliser le Wildcard pour refaire complètement son équipe (une fois par saison).


**Request Body:**
```json
{
  "teamId": "string (required)",
  "userId": "string (required)",
  "formation": "Formation (required, peut être différente)",
  "players": [
    {
      "playerId": "string",
      "position": "Position",
      "price": "number"
    }
  ],
  "captainId": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Wildcard utilisé avec succès. Votre équipe a été complètement refaite !",
  "team": {
    "id": "string",
    "wildcardUsed": true,
    "transfers": 2,
    ...
  }
}
```

**Règles:**
- Le Wildcard ne peut être utilisé qu'une fois par saison
- Permet de changer tous les joueurs sans pénalité
- Permet de changer la formation
- Réinitialise les transferts gratuits à 2
- Toutes les validations d'équipe s'appliquent (budget, formation, etc.)

**Erreurs possibles:**
- `400` - Wildcard déjà utilisé
- `400` - Validation de l'équipe échouée
- `403` - L'équipe n'appartient pas à l'utilisateur
- `404` - Équipe non trouvée
- `500` - Erreur serveur

---

### GET `/api/fantasy/wildcard`

Vérifier la disponibilité du Wildcard pour une équipe.

**Query Parameters:**
- `teamId` (required): ID de l'équipe Fantasy

**Response (200):**
```json
{
  "success": true,
  "wildcardAvailable": "boolean",
  "wildcardUsed": "boolean"
}
```

**Exemple de requête:**
```bash
curl -X GET "https://your-domain.com/api/fantasy/wildcard?teamId=team123"
```

---

### GET `/api/fantasy/leaderboard`

Récupérer le classement Fantasy avec pagination et recherche.

**Query Parameters:**
- `type` (optional): `'global'` (défaut) ou `'weekly'`
- `page` (optional): Numéro de page (défaut: 1)
- `limit` (optional): Résultats par page (défaut: 50, max: 100)
- `search` (optional): Rechercher une équipe par nom
- `userId` (optional): Pour trouver la position de l'utilisateur

**Response (200):**
```json
{
  "success": true,
  "type": "global | weekly",
  "leaderboard": [
    {
      "id": "string",
      "rank": "number",
      "teamName": "string",
      "userId": "string",
      "userName": "string",
      "userPhoto": "string | null",
      "userSchool": "string | null",
      "totalPoints": "number",
      "gameweekPoints": "number",
      "badges": ["string"],
      "formation": "Formation",
      "createdAt": "Timestamp"
    }
  ],
  "userTeam": {
    "id": "string",
    "rank": "number",
    "teamName": "string",
    ...
  },
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number",
    "hasNextPage": "boolean",
    "hasPreviousPage": "boolean"
  }
}
```

**Optimisations:**
- Récupère uniquement les top 1000 équipes au lieu de toutes
- Utilise des requêtes batch pour les informations utilisateur
- Met à jour les rangs en arrière-plan sans bloquer la réponse
- Utilise des index composites Firestore pour un tri efficace
- Cache la popularité des joueurs pour éviter les recalculs

**Exemple de requête:**
```bash
# Classement global, page 1
curl -X GET "https://your-domain.com/api/fantasy/leaderboard?type=global&page=1&limit=50"

# Classement hebdomadaire avec position de l'utilisateur
curl -X GET "https://your-domain.com/api/fantasy/leaderboard?type=weekly&userId=user123"

# Recherche d'une équipe
curl -X GET "https://your-domain.com/api/fantasy/leaderboard?search=Champions"
```

---

### GET `/api/fantasy/player-stats/[id]`

Récupérer les statistiques Fantasy d'un joueur spécifique.

**Path Parameters:**
- `id` (required): ID du joueur

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "playerId": "string",
    "price": "number",
    "totalPoints": "number",
    "gameweekPoints": "number",
    "popularity": "number (pourcentage)",
    "form": ["number (points des derniers matchs)"],
    "priceChange": "number",
    "selectedBy": "number (nombre d'équipes)",
    "updatedAt": "Date"
  },
  "playerInfo": {
    "id": "string",
    "name": "string",
    "photo": "string | null",
    "position": "Position",
    "number": "number | null",
    "school": "string | null",
    "isCaptain": "boolean",
    "teamId": "string",
    "teamName": "string",
    "teamLogo": "string | null",
    "teamColor": "string | null",
    "seasonStats": {
      "goals": "number",
      "assists": "number",
      "matches": "number",
      "yellowCards": "number",
      "redCards": "number",
      "minutesPlayed": "number"
    }
  },
  "formAverage": "number (moyenne des 5 derniers matchs)",
  "priceDirection": "'up' | 'down' | 'stable'"
}
```

**Optimisations:**
- Cache les valeurs de popularité (mise à jour toutes les heures)
- Recalcule la popularité uniquement si les stats sont obsolètes
- Met à jour la popularité en arrière-plan

**Erreurs possibles:**
- `400` - ID du joueur manquant
- `404` - Joueur non trouvé
- `500` - Erreur serveur

**Exemple de requête:**
```bash
curl -X GET "https://your-domain.com/api/fantasy/player-stats/player123"
```

---

## Endpoints Admin

Tous les endpoints admin nécessitent une authentification avec un token Bearer et un rôle admin.

**Headers requis:**
```
Authorization: Bearer <firebase-id-token>
```

---

### POST `/api/admin/fantasy/init-data`

Initialiser les données Fantasy pour tous les joueurs (à exécuter une seule fois).

**Request Body:** Aucun

**Response (200):**
```json
{
  "success": true,
  "message": "✅ Initialisation terminée: X stats créées, Y ignorées. Gameweek 1 créée."
}
```

**Actions effectuées:**
- Calcule le prix initial de chaque joueur basé sur sa position et ses stats
- Crée les `player_fantasy_stats` pour tous les joueurs
- Crée la première gameweek si elle n'existe pas

**Erreurs possibles:**
- `401` - Non autorisé (token manquant ou invalide)
- `403` - Accès refusé (utilisateur non admin)
- `400` - Aucun joueur trouvé
- `500` - Erreur serveur

---

### POST `/api/admin/fantasy/gameweek`

Créer une nouvelle gameweek et clôturer l'actuelle.


**Request Body:**
```json
{
  "startDate": "string (optional, ISO date)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "✅ Gameweek X créée avec succès",
  "data": {
    "gameweekId": "string",
    "gameweekNumber": "number",
    "startDate": "string (ISO)",
    "endDate": "string (ISO)",
    "deadline": "string (ISO)",
    "teamsUpdated": "number",
    "notificationsSent": "number"
  }
}
```

**Actions effectuées:**
- Clôture la gameweek actuelle
- Calcule le classement hebdomadaire
- Réinitialise les transferts gratuits (2 par équipe)
- Réinitialise les points hebdomadaires (équipes et joueurs)
- Crée la nouvelle gameweek
- Envoie des notifications de deadline à tous les utilisateurs

---

### PATCH `/api/admin/fantasy/gameweek`

Clôturer la gameweek active sans en créer une nouvelle.

**Request Body:** Aucun

**Response (200):**
```json
{
  "success": true,
  "message": "✅ Gameweek X clôturée avec succès",
  "data": {
    "gameweekId": "string",
    "gameweekNumber": "number"
  }
}
```

**Actions effectuées:**
- Calcule le classement hebdomadaire
- Marque la gameweek comme inactive et complétée

---

### GET `/api/admin/fantasy/gameweek`

Récupérer les informations de la gameweek active et l'historique.

**Request Body:** Aucun

**Response (200):**
```json
{
  "success": true,
  "data": {
    "activeGameweek": {
      "id": "string",
      "number": "number",
      "startDate": "string (ISO)",
      "endDate": "string (ISO)",
      "deadline": "string (ISO)",
      "isActive": true,
      "isCompleted": false,
      "createdAt": "Date"
    },
    "gameweeksHistory": [
      {
        "id": "string",
        "number": "number",
        "startDate": "string (ISO)",
        "endDate": "string (ISO)",
        "deadline": "string (ISO)",
        "isActive": "boolean",
        "isCompleted": "boolean",
        "createdAt": "Date"
      }
    ]
  }
}
```

---

### POST `/api/admin/fantasy/start-gameweek`

Démarrer une nouvelle gameweek (alternative simplifiée à POST /gameweek).

**Request Body:** Aucun

**Response (200):**
```json
{
  "success": true,
  "message": "✅ Gameweek X démarrée: Y équipes mises à jour, Z notifications envoyées"
}
```

**Actions effectuées:**
- Identique à POST `/api/admin/fantasy/gameweek` mais sans paramètres personnalisables

---

### POST `/api/admin/fantasy/update-after-match`

Mettre à jour les points Fantasy après un match réel.

**Request Body:**
```json
{
  "matchId": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "✅ Match traité: X joueurs, Y équipes mises à jour, Z notifications envoyées"
}
```

**Actions effectuées:**
1. Récupère le match et son résultat
2. Extrait les statistiques de tous les joueurs (buts, passes, cartons, etc.)
3. Calcule les points Fantasy de chaque joueur selon la grille
4. Met à jour les `player_fantasy_stats`
5. Met à jour toutes les équipes Fantasy concernées
6. Applique le multiplicateur x2 pour les capitaines
7. Envoie des notifications aux utilisateurs
8. Met à jour le classement global

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

**Erreurs possibles:**
- `400` - matchId manquant
- `404` - Match ou résultat non trouvé
- `500` - Erreur serveur

---

### POST `/api/admin/fantasy/update-prices`

Mettre à jour les prix des joueurs basés sur leur forme récente.

**Request Body:** Aucun

**Response (200):**
```json
{
  "success": true,
  "message": "✅ Prix mis à jour: X modifiés, Y stables, Z sans forme"
}
```

**Règles de calcul:**
- Moyenne des 5 derniers matchs (forme)
- Forme > 8 points: +0.3M€
- Forme > 6 points: +0.2M€
- Forme > 4 points: +0.1M€
- Forme < 2 points: -0.3M€
- Forme < 3 points: -0.2M€
- Variation limitée à ±0.5M€ par gameweek
- Prix minimum: 4.0M€
- Prix maximum: 15.0M€

**Recommandation:** Exécuter hebdomadairement, idéalement au début d'une nouvelle gameweek.

---

### POST `/api/admin/fantasy/update-points`

Recalculer manuellement les points Fantasy (correction d'erreurs).

**Request Body:**
```json
{
  "mode": "string (required)",
  // Paramètres additionnels selon le mode
}
```

**Modes disponibles:**

#### Mode 1: `player_custom_stats`
Recalculer les points d'un joueur avec des stats personnalisées.

```json
{
  "mode": "player_custom_stats",
  "playerId": "string (required)",
  "matchStats": {
    "position": "Position",
    "minutesPlayed": "number",
    "goals": "number",
    "assists": "number",
    "cleanSheet": "boolean",
    "teamWon": "boolean",
    "teamDraw": "boolean",
    "yellowCards": "number",
    "redCards": "number",
    "goalsConceded": "number",
    "penaltySaved": "boolean",
    "penaltyMissed": "boolean"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Points mis à jour: X points calculés, Y équipes mises à jour",
  "data": {
    "playerId": "string",
    "pointsCalculated": "number",
    "teamsUpdated": "number",
    "matchStats": {...}
  }
}
```

#### Mode 2: `recalculate_team`
Recalculer tous les points d'une équipe Fantasy.

```json
{
  "mode": "recalculate_team",
  "teamId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Équipe recalculée: X points totaux, Y points gameweek",
  "data": {
    "teamId": "string",
    "teamName": "string",
    "totalPoints": "number",
    "gameweekPoints": "number",
    "playersCount": "number"
  }
}
```

#### Mode 3: `reset_gameweek`
Réinitialiser les points de gameweek pour toutes les équipes.

```json
{
  "mode": "reset_gameweek"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Points gameweek réinitialisés: X équipes, Y joueurs",
  "data": {
    "teamsReset": "number",
    "playersReset": "number"
  }
}
```

#### Mode 4: `correct_player_in_team`
Corriger les points d'un joueur spécifique dans une équipe.

```json
{
  "mode": "correct_player_in_team",
  "teamId": "string (required)",
  "playerId": "string (required)",
  "pointsAdjustment": "number (required, peut être négatif)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Points corrigés: +X points pour le joueur",
  "data": {
    "teamId": "string",
    "teamName": "string",
    "playerId": "string",
    "pointsAdjustment": "number",
    "newTotalPoints": "number"
  }
}
```

**Note:** Si l'ajustement est ≥ 5 points, une notification est envoyée à l'utilisateur.

---

## Modèles de données

### FantasyTeam
```typescript
interface FantasyTeam {
  id: string
  userId: string
  teamName: string
  budget: number              // 100M€ initial
  budgetRemaining: number
  formation: Formation        // "4-2-0", "3-3-0", "3-2-1", "2-3-1", "2-2-2"
  players: FantasyPlayer[]    // 7 joueurs
  captainId: string
  totalPoints: number
  gameweekPoints: number
  rank: number
  weeklyRank: number
  transfers: number           // Transferts gratuits restants
  wildcardUsed: boolean
  badges: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### FantasyPlayer
```typescript
interface FantasyPlayer {
  playerId: string
  position: Position          // "Gardien" | "Défenseur" | "Milieu" | "Attaquant"
  price: number
  points: number
  gameweekPoints: number
  isCaptain: boolean
}
```

### PlayerFantasyStats
```typescript
interface PlayerFantasyStats {
  playerId: string
  price: number
  totalPoints: number
  gameweekPoints: number
  popularity: number          // Pourcentage d'équipes
  form: number[]              // Points des derniers matchs
  priceChange: number
  selectedBy: number
  updatedAt: Timestamp
}
```

### Formation
```typescript
type Formation = "4-2-0" | "3-3-0" | "3-2-1" | "2-3-1" | "2-2-2"
// Format: Défenseurs-Milieux-Attaquants (+ 1 Gardien automatique)
```

### Position
```typescript
type Position = "Gardien" | "Défenseur" | "Milieu" | "Attaquant"
```

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| `400` | Requête invalide (paramètres manquants ou invalides) |
| `401` | Non autorisé (token manquant ou invalide) |
| `403` | Accès refusé (permissions insuffisantes) |
| `404` | Ressource non trouvée |
| `500` | Erreur serveur interne |

### Exemples de messages d'erreur

**Validation échouée:**
```json
{
  "error": "Validation échouée",
  "errors": [
    "Vous devez sélectionner exactement 7 joueurs",
    "Budget dépassé: 105M€ utilisés, 100M€ disponibles",
    "Maximum 3 joueurs d'une même équipe"
  ]
}
```

**Authentification:**
```json
{
  "error": "Non autorisé"
}
```

**Accès refusé:**
```json
{
  "error": "Accès refusé - Admin uniquement"
}
```

**Ressource non trouvée:**
```json
{
  "error": "Équipe Fantasy non trouvée"
}
```

---

## Notes d'implémentation

### Optimisations Firestore

1. **Index composites requis:**
   - `fantasy_teams`: `(totalPoints DESC, createdAt ASC)`
   - `fantasy_teams`: `(gameweekPoints DESC, createdAt ASC)`
   - `fantasy_teams`: `(userId ASC, createdAt DESC)`

2. **Requêtes batch:**
   - Utilisation de `batchFetchPlayers()` pour récupérer plusieurs joueurs
   - Utilisation de `batchFetchTeams()` pour récupérer plusieurs équipes
   - Utilisation de `batchFetchUsers()` pour récupérer plusieurs utilisateurs

3. **Cache:**
   - Popularité des joueurs mise en cache (1 heure)
   - Rangs mis à jour en arrière-plan

### Sécurité

1. **Authentification:**
   - Tous les endpoints admin nécessitent un token Firebase valide
   - Vérification du rôle admin dans Firestore

2. **Validation:**
   - Toutes les données sont validées côté serveur
   - Vérification de la propriété des équipes pour les modifications

3. **Rate limiting:**
   - Recommandé d'implémenter un rate limiting pour les endpoints publics
   - Particulièrement important pour `/leaderboard` et `/player-stats`

### Notifications

Les notifications Fantasy sont intégrées au système de notifications existant avec le type `fantasy_update` et les sous-types suivants:
- `points_earned`: Points gagnés après un match
- `captain_scored`: Le capitaine a marqué des points
- `badge_earned`: Nouveau badge débloqué
- `rank_improved`: Amélioration du classement
- `player_performance`: Performance exceptionnelle d'un joueur
- `transfer_deadline`: Rappel de deadline de transferts
- `player_alert`: Joueur blessé ou suspendu

---

## Exemples d'utilisation

### Workflow complet: Créer et gérer une équipe

```javascript
// 1. Créer une équipe
const createResponse = await fetch('/api/fantasy/create-team', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    teamName: 'Les Champions',
    formation: '4-2-0',
    players: [...],
    captainId: 'player1'
  })
})
const { team } = await createResponse.json()

// 2. Récupérer l'équipe
const getResponse = await fetch(`/api/fantasy/get-team?userId=user123`)
const { team: myTeam } = await getResponse.json()

// 3. Effectuer un transfert
const transferResponse = await fetch('/api/fantasy/transfers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teamId: team.id,
    userId: 'user123',
    playerOutId: 'player1',
    playerInId: 'player2',
    playerInPrice: 7.5
  })
})

// 4. Consulter le classement
const leaderboardResponse = await fetch('/api/fantasy/leaderboard?type=global&page=1')
const { leaderboard, userTeam } = await leaderboardResponse.json()

// 5. Consulter les stats d'un joueur
const statsResponse = await fetch('/api/fantasy/player-stats/player123')
const { stats, playerInfo } = await statsResponse.json()
```

### Workflow admin: Gestion d'une gameweek

```javascript
// 1. Initialiser les données (une seule fois)
const initResponse = await fetch('/api/admin/fantasy/init-data', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
})

// 2. Après chaque match
const updateResponse = await fetch('/api/admin/fantasy/update-after-match', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ matchId: 'match123' })
})

// 3. Démarrer une nouvelle gameweek
const gameweekResponse = await fetch('/api/admin/fantasy/start-gameweek', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
})

// 4. Mettre à jour les prix (hebdomadaire)
const pricesResponse = await fetch('/api/admin/fantasy/update-prices', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
})
```

---

## Support et contact

Pour toute question ou problème concernant l'API Fantasy, veuillez contacter l'équipe de développement.

**Version:** 1.0.0  
**Dernière mise à jour:** Novembre 2024
