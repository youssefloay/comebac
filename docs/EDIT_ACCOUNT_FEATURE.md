# ✏️ Fonctionnalité d'Édition de Compte avec Synchronisation Globale

## Vue d'ensemble

Cette fonctionnalité permet aux administrateurs de modifier n'importe quel compte depuis la recherche rapide et de propager automatiquement les modifications dans **toutes les collections** de la base de données.

## Accès

1. Aller sur `/admin/search` ou cliquer sur "🔍 Recherche rapide" dans la sidebar admin
2. Rechercher un utilisateur (joueur, entraîneur, admin, ou utilisateur)
3. Sélectionner le compte à modifier
4. Cliquer sur "✏️ Modifier"

## Fonctionnalités

### 🔍 Recherche et Sélection
- Recherche en temps réel avec autocomplétion
- Affichage détaillé du compte sélectionné
- Indicateurs visuels des collections synchronisées

### ✏️ Édition
Champs modifiables selon le type de compte :

**Tous les types :**
- Prénom
- Nom
- Email
- Nom d'équipe

**Joueurs uniquement :**
- Position (Gardien, Défenseur, Milieu, Attaquant)
- Numéro de maillot (1-99)

**Utilisateurs :**
- Rôle

### 🔄 Synchronisation Automatique

Quand vous modifiez un compte, les changements sont **automatiquement propagés** dans toutes les collections pertinentes :

#### 1. Collection principale
- `coachAccounts` (pour les entraîneurs)
- `playerAccounts` (pour les joueurs)
- `users` (pour les utilisateurs/admins)

#### 2. Profils utilisateurs
- `userProfiles` : Mise à jour du nom complet et des informations

#### 3. Équipes
- `teams` : 
  - Nom de l'équipe
  - Informations du coach (coachFirstName, coachLastName, coachEmail)
  - Liste des joueurs (firstName, lastName, email, position, jerseyNumber)

#### 4. Compositions
- `lineups` :
  - Joueurs titulaires (starters)
  - Remplaçants (substitutes)
  - Mise à jour des noms, positions, numéros

#### 5. Résultats
- `results` :
  - Noms des équipes
  - Noms des buteurs (scorers)

#### 6. Statistiques
- `statistics` :
  - Nom du joueur (playerName)
  - Nom de l'équipe (teamName)

## Exemple d'utilisation

### Scénario 1 : Corriger le nom d'un joueur

1. Rechercher "Jean Dupont"
2. Cliquer sur "✏️ Modifier"
3. Changer "Jean" → "John"
4. Cliquer sur "✅ Enregistrer"

**Résultat :** Le nom est mis à jour dans :
- `playerAccounts`
- `userProfiles`
- `teams` (dans la liste des joueurs)
- `lineups` (toutes les compositions où il apparaît)
- `results` (s'il a marqué des buts)
- `statistics` (ses statistiques personnelles)

### Scénario 2 : Changer le numéro de maillot

1. Rechercher le joueur
2. Modifier le numéro de 10 → 7
3. Enregistrer

**Résultat :** Le numéro est mis à jour dans :
- `playerAccounts`
- `teams`
- `lineups`

### Scénario 3 : Renommer une équipe

1. Rechercher un membre de l'équipe
2. Modifier "FC Barcelona" → "FC Barcelone"
3. Enregistrer

**Résultat :** Le nom est mis à jour dans :
- `coachAccounts` / `playerAccounts`
- `teams`
- `results` (tous les matchs de l'équipe)
- `statistics`

## Sécurité

### ⚠️ Avertissements
- Un message d'avertissement s'affiche avant la modification
- Les modifications sont **irréversibles**
- Toutes les collections sont mises à jour en une seule transaction (batch)

### 🔒 Permissions
- Accessible uniquement aux administrateurs
- Nécessite une authentification admin

## API

### Endpoint
```
POST /api/admin/update-account
```

### Paramètres
```typescript
{
  accountId: string      // ID du document dans la collection principale
  accountType: 'coach' | 'player' | 'user' | 'admin'
  uid?: string          // UID Firebase (optionnel)
  teamId?: string       // ID de l'équipe (optionnel)
  updates: {
    firstName?: string
    lastName?: string
    email?: string
    teamName?: string
    position?: string
    jerseyNumber?: number
    role?: string
  }
}
```

### Réponse
```typescript
{
  success: true,
  message: "Compte mis à jour avec succès",
  updatedCollections: string[]  // Liste des collections modifiées
}
```

## Indicateurs visuels

### Badges de synchronisation
Affichés sous les informations du compte :
- 🔵 Collection principale (coachAccounts, playerAccounts, users)
- 🔵 userProfiles (si uid existe)
- 🔵 teams (si teamId existe)
- 🔵 lineups (pour les joueurs)
- 🔵 statistics (pour les joueurs)
- 🔵 results (toujours)

### Statuts
- ✓ Actif : L'utilisateur s'est déjà connecté
- ✗ Jamais connecté : L'utilisateur n'a jamais utilisé son compte
- ⚠ Email non vérifié : L'email n'a pas été vérifié

## Limitations

1. **Pas de modification du type de compte** : Un joueur reste un joueur, un coach reste un coach
2. **Pas de modification de l'UID** : L'identifiant Firebase ne peut pas être changé
3. **Pas de modification du teamId** : L'ID de l'équipe ne peut pas être changé (mais le nom oui)

## Bonnes pratiques

1. **Vérifier avant de modifier** : Assurez-vous que les informations sont correctes
2. **Tester sur un compte de test** : Si possible, testez d'abord sur un compte non critique
3. **Documenter les changements** : Notez les modifications importantes
4. **Vérifier après modification** : Consultez les différentes pages pour confirmer la synchronisation

## Dépannage

### Problème : Les modifications ne s'appliquent pas partout
**Solution :** Vérifiez que le compte a bien un `uid` et un `teamId` renseignés

### Problème : Erreur lors de l'enregistrement
**Solution :** Vérifiez les logs serveur et assurez-vous que Firebase Admin est correctement configuré

### Problème : Certaines collections ne sont pas mises à jour
**Solution :** Vérifiez que les données existent dans ces collections (ex: un joueur sans statistiques n'aura rien à mettre à jour dans `statistics`)

## Améliorations futures

- [ ] Historique des modifications
- [ ] Annulation des modifications (undo)
- [ ] Modification en masse (plusieurs comptes à la fois)
- [ ] Prévisualisation des changements avant application
- [ ] Export des modifications effectuées
- [ ] Notifications aux utilisateurs concernés
