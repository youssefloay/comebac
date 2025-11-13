# Changelog - Barre de recherche Admin

## ✅ Corrections effectuées

### 1. Texte blanc non lisible - CORRIGÉ ✓
**Problème** : Le texte dans les suggestions apparaissait en blanc sur fond blanc

**Solution** :
- Changé tous les textes en `text-gray-900` (noir) pour les noms
- Changé les emails en `text-gray-600` (gris foncé)
- Ajouté des badges colorés avec texte contrasté :
  - Entraîneurs : `bg-orange-100 text-orange-700`
  - Joueurs : `bg-blue-100 text-blue-700`
  - Admins : `bg-purple-100 text-purple-700`
  - Utilisateurs : `bg-gray-100 text-gray-700`

### 2. Recherche limitée aux joueurs/entraîneurs - CORRIGÉ ✓
**Problème** : La recherche ne montrait que les joueurs et entraîneurs

**Solution** :
- Ajout de la collection `users` (utilisateurs réguliers et admins)
- Ajout de la collection `userProfiles` (profils utilisateurs)
- Évite les doublons entre les collections
- Nouveau type `SearchResult` avec 4 types possibles :
  - `'coach'` - Entraîneurs (orange)
  - `'player'` - Joueurs (bleu)
  - `'admin'` - Administrateurs (violet)
  - `'user'` - Utilisateurs réguliers (gris)

## 📊 Statistiques affichées

La page `/admin/search` affiche maintenant 4 compteurs :
- 🟠 Entraîneurs
- 🔵 Joueurs  
- 🟣 Admins
- ⚪ Utilisateurs

## 🎨 Avatars colorés

Chaque type d'utilisateur a un gradient unique :
- **Entraîneurs** : Orange → Rouge
- **Joueurs** : Bleu → Vert
- **Admins** : Violet → Rose
- **Utilisateurs** : Gris foncé → Gris très foncé

## 🔍 Recherche améliorée

La recherche fonctionne maintenant sur :
- Nom complet (prénom + nom)
- Email
- Nom d'équipe (si applicable)
- Position (pour les joueurs)
- Rôle (pour les utilisateurs)

## 📝 Fichiers modifiés

1. `components/admin/search-bar.tsx`
   - Interface `SearchResult` étendue
   - Support des 4 types d'utilisateurs
   - Couleurs de texte corrigées
   - Recherche sur le rôle ajoutée

2. `app/admin/search/page.tsx`
   - Chargement de `users` et `userProfiles`
   - Gestion des doublons
   - 4 compteurs de statistiques
   - Bouton "Se faire passer pour" conditionnel

3. `app/admin/impersonate/page.tsx`
   - Chargement de tous les utilisateurs
   - Recherche étendue à tous les types

## 🚀 Utilisation

```tsx
// La barre de recherche charge automatiquement tous les utilisateurs
<SearchBar
  data={searchData}  // Contient coaches, players, users, profiles
  onSelect={handleSelect}
  placeholder="Rechercher un utilisateur..."
/>
```

## ⚠️ Limitations

- Seuls les entraîneurs et joueurs peuvent être "impersonnés"
- Les admins et utilisateurs réguliers sont visibles mais pas impersonnables
- Ceci est intentionnel pour des raisons de sécurité

## 🎯 Pages affectées

- ✅ `/admin/search` - Page de recherche globale
- ✅ `/admin/impersonate` - Page d'impersonation
- ✅ Composant `SearchBar` réutilisable partout
