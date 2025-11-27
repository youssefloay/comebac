# Nouvelle Architecture de Base de Données

## 🎯 Objectif
Simplifier l'architecture sans perdre de données, en éliminant les duplications et en clarifiant les rôles de chaque collection.

## 📊 Architecture Actuelle (Avant)

### Collections Principales
1. **playerAccounts** - Comptes joueurs (source principale)
2. **players** - Données joueurs (duplication partielle)
3. **coachAccounts** - Comptes coaches
4. **teams** - Équipes (avec `teams.players` array)
5. **teamRegistrations** - Inscriptions (avec `teamRegistrations.players` array)
6. **users** - Utilisateurs génériques (legacy)
7. **userProfiles** - Profils utilisateurs (duplication avec users)

### Collections Secondaires
- **matches** - Matchs
- **matchResults** - Résultats
- **lineups** - Compositions
- **notifications** - Notifications
- **teamStatistics** - Statistiques équipes
- **seasonArchives** - Archives
- **fantasyTeams** - Équipes Fantasy
- **favorites** - Favoris

### Problèmes Identifiés
- ❌ `users` et `userProfiles` sont redondants
- ❌ `players` duplique des données de `playerAccounts`
- ❌ `teams.players` et `teamRegistrations.players` doivent être synchronisés
- ❌ Données dispersées dans plusieurs collections

## 🏗️ Architecture Nouvelle (Après)

### Collections Principales (Sources de Vérité)

#### 1. **accounts** (NOUVELLE - Fusion de users + userProfiles)
```typescript
{
  id: string (UID Firebase Auth)
  email: string
  emailVerified: boolean
  role: 'player' | 'coach' | 'admin' | 'user'
  firstName?: string
  lastName?: string
  displayName?: string
  phone?: string
  photoURL?: string
  createdAt: Timestamp
  lastLogin?: Timestamp
  // Données spécifiques joueur (si role === 'player')
  teamId?: string
  teamName?: string
  position?: string
  jerseyNumber?: number
  birthDate?: string
  height?: number
  foot?: string
  tshirtSize?: string
  grade?: string
  // Données spécifiques coach (si role === 'coach')
  teams?: string[] // Array de teamIds
}
```

#### 2. **playerAccounts** (CONSERVÉE - Source principale pour joueurs)
- Reste la source de vérité pour les joueurs
- Synchronisé avec `accounts` pour les joueurs
- Contient toutes les données joueur détaillées

#### 3. **coachAccounts** (CONSERVÉE - Source principale pour coaches)
- Reste la source de vérité pour les coaches
- Synchronisé avec `accounts` pour les coaches

#### 4. **teams** (CONSERVÉE - Améliorée)
```typescript
{
  id: string
  name: string
  schoolName?: string
  // ... autres champs
  players: Player[] // Synchronisé depuis playerAccounts
  coach?: Coach // Référence vers coachAccounts
}
```

#### 5. **teamRegistrations** (CONSERVÉE - Améliorée)
```typescript
{
  id: string
  teamName: string
  status: 'pending' | 'approved' | 'rejected'
  players: Player[] // Synchronisé depuis playerAccounts
  // ... autres champs
}
```

### Collections Dérivées (Statistiques uniquement)

#### 6. **playerStats** (NOUVELLE - Renommage de `players`)
- **Rôle**: Statistiques de match uniquement
- **Ne contient PAS** les données de profil (nom, email, etc.)
- **Contient**: goals, assists, matches, etc.
- **Référence**: `accountId` et `teamId` (pas de duplication de données)

```typescript
{
  id: string
  accountId: string // Référence vers accounts
  teamId: string
  season: string
  stats: {
    goals: number
    assists: number
    matches: number
    // ... autres stats
  }
}
```

### Collections Secondaires (Non modifiées)
- **matches** - Matchs
- **matchResults** - Résultats
- **lineups** - Compositions
- **notifications** - Notifications
- **teamStatistics** - Statistiques équipes
- **seasonArchives** - Archives
- **fantasyTeams** - Équipes Fantasy
- **favorites** - Favoris

## 🔄 Plan de Migration

### Phase 1: Préparation
1. ✅ Sauvegarde complète de toutes les collections
2. ✅ Analyse des données existantes
3. ✅ Vérification de l'intégrité

### Phase 2: Création de la nouvelle collection `accounts`
1. Fusionner `users` et `userProfiles` dans `accounts`
2. Enrichir avec les données de `playerAccounts` et `coachAccounts`
3. Créer les références bidirectionnelles

### Phase 3: Migration des données joueurs
1. Créer des entrées `accounts` pour tous les joueurs
2. Synchroniser `playerAccounts` avec `accounts`
3. Mettre à jour `teams.players` depuis `playerAccounts`

### Phase 4: Migration des données coaches
1. Créer des entrées `accounts` pour tous les coaches
2. Synchroniser `coachAccounts` avec `accounts`

### Phase 5: Refactorisation de `players` → `playerStats`
1. Extraire uniquement les statistiques de `players`
2. Créer `playerStats` avec références vers `accounts`
3. Supprimer les données de profil de `players`

### Phase 6: Nettoyage
1. Marquer `users` et `userProfiles` comme obsolètes (ne pas supprimer immédiatement)
2. Vérifier l'intégrité des données
3. Mettre à jour les requêtes dans le code

### Phase 7: Suppression (après validation)
1. Après validation complète, supprimer `users` et `userProfiles`
2. Supprimer les données dupliquées de `players`

## 📋 Règles de Synchronisation

### 1. accounts ↔ playerAccounts
- `accounts` = source de vérité pour email, nom, rôle
- `playerAccounts` = source de vérité pour données joueur détaillées
- Synchronisation bidirectionnelle lors des modifications

### 2. accounts ↔ coachAccounts
- `accounts` = source de vérité pour email, nom, rôle
- `coachAccounts` = source de vérité pour données coach détaillées
- Synchronisation bidirectionnelle lors des modifications

### 3. playerAccounts → teams.players
- `teams.players` est toujours synchronisé depuis `playerAccounts`
- Pas de modification directe de `teams.players`

### 4. playerAccounts → teamRegistrations.players
- `teamRegistrations.players` est synchronisé depuis `playerAccounts` lors de l'approbation
- Peut être modifié temporairement pendant l'inscription

### 5. playerAccounts → playerStats
- `playerStats` référence `playerAccounts` via `accountId`
- Pas de duplication de données de profil

## ✅ Avantages de la Nouvelle Architecture

1. **Clarté**: Chaque collection a un rôle précis
2. **Pas de duplication**: Données uniques dans une seule collection
3. **Performance**: Moins de requêtes, moins de données
4. **Maintenance**: Plus facile à maintenir et déboguer
5. **Évolutivité**: Plus facile d'ajouter de nouvelles fonctionnalités

## 🔒 Sécurité des Données

- ✅ Sauvegarde complète avant migration
- ✅ Script de rollback disponible
- ✅ Validation à chaque étape
- ✅ Vérification d'intégrité post-migration
- ✅ Conservation des collections originales pendant la période de validation

