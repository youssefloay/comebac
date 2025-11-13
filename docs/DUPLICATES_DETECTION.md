# ⚠️ Détection des Doublons

## 🎯 Objectif

Détecter et gérer les emails qui existent dans plusieurs collections de la base de données.

## 🔍 Pourquoi des doublons ?

Un même email peut apparaître dans plusieurs collections pour différentes raisons :

### Cas 1 : Inscription puis ajout comme joueur
```
1. Utilisateur s'inscrit → Compte créé dans "users"
2. Admin l'ajoute comme joueur → Compte créé dans "playerAccounts"
3. Résultat : 2 comptes avec le même email
```

### Cas 2 : Import de données
```
1. Import d'une équipe avec joueurs
2. Un joueur avait déjà un compte utilisateur
3. Résultat : Doublon entre "users" et "playerAccounts"
```

### Cas 3 : Création manuelle
```
1. Admin crée un compte entraîneur
2. Plus tard, crée aussi un compte utilisateur avec le même email
3. Résultat : Doublon entre "coachAccounts" et "users"
```

## 📊 Collections vérifiées

L'outil vérifie 4 collections :
- **playerAccounts** 👥 - Comptes joueurs
- **coachAccounts** 🎯 - Comptes entraîneurs
- **users** 👤 - Comptes utilisateurs
- **userProfiles** 📋 - Profils utilisateurs

## 🚀 Comment utiliser

### Accès
1. Aller dans **Admin Dashboard**
2. Cliquer sur l'onglet **"🔧 Réparations"**
3. Cliquer sur **"⚠️ Détecter les doublons"**

### Interface
La page affiche :
- **Statistiques** : Nombre total de comptes par collection
- **Nombre de doublons** : Emails en double
- **Liste détaillée** : Chaque email en doublon avec tous ses comptes

### Exemple d'affichage

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ yassinelhosseiny886@gmail.com                            │
│ 2 comptes                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [1] Yassin mohamed                                          │
│     👤 Utilisateur                                           │
│     Collection: users                                        │
│     ID: abc123                                               │
│                                                              │
│ [2] Hosseiny Yassin                                         │
│     👥 Joueur                                                │
│     Collection: playerAccounts                               │
│     ID: def456                                               │
│     Équipe: Saints                                           │
│                                                              │
│ 💡 Action recommandée:                                       │
│ Gardez le compte Joueur et supprimez l'autre                │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Comment résoudre

### Étape 1 : Identifier le bon compte
Généralement, gardez :
- **playerAccounts** si c'est un joueur actif
- **coachAccounts** si c'est un entraîneur actif
- **users** seulement si pas de compte joueur/entraîneur

### Étape 2 : Supprimer les doublons
1. Aller dans **Admin → Comptes**
2. Chercher l'email en doublon
3. Supprimer les comptes inutiles
4. Garder le compte le plus complet

### Étape 3 : Vérifier
1. Retourner dans **Réparations → Détecter les doublons**
2. Cliquer sur **"Actualiser"**
3. Vérifier que le doublon a disparu

## ⚡ API Endpoint

```typescript
GET /api/admin/detect-duplicates

Response:
{
  success: true,
  totalEmails: 150,
  duplicatesCount: 3,
  duplicates: [
    {
      email: "user@example.com",
      count: 2,
      accounts: [
        {
          collection: "users",
          id: "abc123",
          email: "user@example.com",
          firstName: "John",
          lastName: "Doe",
          type: "user"
        },
        {
          collection: "playerAccounts",
          id: "def456",
          email: "user@example.com",
          firstName: "John",
          lastName: "Doe",
          type: "player"
        }
      ]
    }
  ],
  summary: {
    totalAccounts: 200,
    players: 80,
    coaches: 20,
    users: 90,
    profiles: 10
  }
}
```

## 🎨 Codes couleur

- 🔵 **Bleu** : playerAccounts (Joueurs)
- 🟠 **Orange** : coachAccounts (Entraîneurs)
- 🟣 **Violet** : users (Utilisateurs)
- ⚪ **Gris** : userProfiles (Profils)

## ⚠️ Avertissements

### Ne pas supprimer
- Le compte avec le plus d'informations
- Le compte utilisé activement (lastLogin récent)
- Le compte avec des données liées (équipe, matchs, etc.)

### Vérifier avant suppression
- Que l'utilisateur n'a pas de données importantes
- Que ce n'est pas le seul moyen de connexion
- Que l'email est bien vérifié sur le compte à garder

## 🔄 Prévention

Pour éviter les doublons à l'avenir :

1. **Vérifier avant création**
   - Chercher l'email dans toutes les collections
   - Utiliser la barre de recherche admin

2. **Utiliser l'API de changement de rôle**
   - Au lieu de créer un nouveau compte
   - Changer le rôle du compte existant

3. **Import de données**
   - Vérifier les emails existants
   - Mettre à jour au lieu de créer

## 📝 Exemple de résolution

### Cas : yassinelhosseiny886@gmail.com

**Situation :**
- Compte 1 : "Yassin mohamed" dans `users` (créé en premier)
- Compte 2 : "Hosseiny Yassin" dans `playerAccounts` (joueur actif)

**Solution :**
1. Garder le compte `playerAccounts` (compte joueur actif avec équipe)
2. Supprimer le compte `users` (compte basique sans données)
3. Raison : Le joueur a besoin de son compte pour accéder à l'app

**Résultat :**
- ✅ Un seul compte : "Hosseiny Yassin" (Joueur, Saints)
- ✅ Peut se connecter et voir son équipe
- ✅ Pas de confusion dans la recherche

## 🎯 Bonnes pratiques

1. **Vérifier régulièrement** : Lancer la détection chaque semaine
2. **Résoudre rapidement** : Ne pas laisser s'accumuler les doublons
3. **Documenter** : Noter pourquoi un compte a été supprimé
4. **Communiquer** : Prévenir l'utilisateur si changement important

## 🔗 Liens utiles

- Page de détection : `/admin/duplicates`
- Gestion des comptes : `/admin/accounts`
- Recherche globale : `/admin/search`
- Onglet Réparations : Dashboard Admin → Réparations
