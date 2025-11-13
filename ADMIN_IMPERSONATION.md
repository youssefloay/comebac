# 🎭 Système d'Impersonation Admin

## Vue d'ensemble

Le système d'impersonation permet aux administrateurs de se faire passer pour n'importe quel entraîneur ou joueur afin de voir et gérer l'interface comme s'ils étaient cette personne.

## ✅ Fonctionnalités Implémentées

### 1. Page de Sélection (`/admin/impersonate`)

**Interface de sélection:**
- ✅ Onglets "Entraîneurs" et "Joueurs"
- ✅ Compteur du nombre total dans chaque catégorie
- ✅ Barre de recherche (nom, email, équipe)
- ✅ Cartes cliquables pour chaque personne
- ✅ Informations affichées :
  - Entraîneurs : Nom, email, équipe
  - Joueurs : Nom, email, équipe, position, numéro

**Design:**
- ✅ Cartes avec avatars colorés
- ✅ Badges pour équipe et position
- ✅ Hover effects
- ✅ Responsive mobile et desktop

### 2. Bouton d'Accès dans le Dashboard Admin

**Emplacement:**
- ✅ Sidebar admin (bouton violet avec 👤)
- ✅ Texte : "Se faire passer pour..."
- ✅ Positionné avant le bouton "Inscriptions"

### 3. Mode Impersonation

**Fonctionnement:**
- ✅ Stockage de l'ID dans `sessionStorage`
- ✅ Chargement des vraies données de la personne
- ✅ Interface complète et fonctionnelle
- ✅ Toutes les actions possibles

**Données stockées:**
```javascript
// Pour un entraîneur
sessionStorage.setItem('impersonateCoachId', coachId)
sessionStorage.setItem('impersonateCoachName', fullName)

// Pour un joueur
sessionStorage.setItem('impersonatePlayerId', playerId)
sessionStorage.setItem('impersonatePlayerName', fullName)
```

### 4. Bouton de Sortie

**Emplacement:**
- ✅ Sidebar desktop (en haut, avant déconnexion)
- ✅ Menu mobile (drawer)
- ✅ Bouton jaune avec 👤
- ✅ Texte : "Quitter le mode impersonation"

**Action:**
- ✅ Supprime les données de sessionStorage
- ✅ Redirige vers `/admin/impersonate`
- ✅ Permet de choisir une autre personne

## 🔄 Flux d'Utilisation

### Impersonation d'un Entraîneur

1. Admin clique sur "Se faire passer pour..." dans le dashboard
2. Sélectionne l'onglet "Entraîneurs"
3. Recherche ou parcourt la liste
4. Clique sur un entraîneur
5. **Redirigé vers `/coach`** avec les données de l'entraîneur
6. Peut :
   - Voir le tableau de bord
   - Gérer l'équipe
   - Créer/modifier des compositions
   - Voir les matchs et statistiques
7. Clique sur "Quitter le mode impersonation" pour revenir

### Impersonation d'un Joueur

1. Admin clique sur "Se faire passer pour..." dans le dashboard
2. Sélectionne l'onglet "Joueurs"
3. Recherche ou parcourt la liste
4. Clique sur un joueur
5. **Redirigé vers `/player`** avec les données du joueur
6. Peut :
   - Voir le tableau de bord
   - Voir son équipe et la composition
   - Consulter les matchs
   - Voir son profil et badges
7. Clique sur "Quitter le mode impersonation" pour revenir

## 🔐 Sécurité

### Vérifications Implémentées

**Layouts (Coach & Player):**
```typescript
// Vérifier si admin en mode impersonation
const impersonateId = sessionStorage.getItem('impersonateCoachId')
if (isAdmin && impersonateId) {
  // Charger les données de la personne impersonnée
  loadImpersonatedData(impersonateId)
}
```

**Pages (Coach & Player):**
```typescript
// Permettre l'accès si admin en impersonation
if (isAdmin && sessionStorage.getItem('impersonateId')) {
  setIsAuthorized(true)
} else {
  // Vérifications normales
}
```

### Protection

- ✅ Seuls les admins peuvent accéder à `/admin/impersonate`
- ✅ Les données sont chargées depuis Firestore (pas de fake data)
- ✅ Toutes les actions sont réelles et enregistrées
- ✅ Le sessionStorage est nettoyé à la sortie

## 📊 Données Accessibles

### En tant qu'Entraîneur

**Lecture:**
- ✅ Informations de l'équipe
- ✅ Liste des joueurs avec statuts
- ✅ Matchs à venir et passés
- ✅ Compositions existantes
- ✅ Statistiques de l'équipe

**Modification:**
- ✅ Statuts des joueurs (Titulaire/Remplaçant/Blessé/Suspendu)
- ✅ Création de compositions
- ✅ Validation de compositions
- ✅ Toutes les actions d'un entraîneur normal

### En tant que Joueur

**Lecture:**
- ✅ Informations personnelles
- ✅ Équipe et coéquipiers
- ✅ Composition du prochain match
- ✅ Matchs à venir et passés
- ✅ Statistiques personnelles
- ✅ Badges et récompenses

**Modification:**
- ✅ Profil personnel (si éditable)
- ✅ Toutes les actions d'un joueur normal

## 🎨 Interface Visuelle

### Indicateurs d'Impersonation

**Bouton de sortie (jaune):**
```
┌─────────────────────────────────────┐
│ 👤 Quitter le mode impersonation   │
└─────────────────────────────────────┘
```

**Visible uniquement si:**
- L'utilisateur est admin
- Il y a un ID d'impersonation dans sessionStorage

### Page de Sélection

**Cartes Entraîneurs:**
```
┌─────────────────────────────────┐
│  [OJ]  Jean Dupont              │
│        jean@email.com           │
│        [Les Aigles]             │
│                                 │
│  Voir comme entraîneur →        │
└─────────────────────────────────┘
```

**Cartes Joueurs:**
```
┌─────────────────────────────────┐
│  [MD]  Marie Durand             │
│   10   marie@email.com          │
│        [Milieu] [Les Aigles]    │
│                                 │
│  Voir comme joueur →            │
└─────────────────────────────────┘
```

## 🗂️ Structure des Fichiers

```
app/admin/impersonate/
└── page.tsx                    ✅ Page de sélection

app/coach/
├── layout.tsx                  ✅ Modifié (impersonation)
└── page.tsx                    ✅ Modifié (impersonation)

app/player/
├── layout.tsx                  ✅ Modifié (impersonation)
└── page.tsx                    ✅ Modifié (impersonation)

components/dashboard/
└── dashboard.tsx               ✅ Modifié (bouton ajouté)
```

## 🔧 Modifications Techniques

### 1. Layouts (Coach & Player)

**Avant:**
```typescript
if (isAdmin) {
  // Données de démo
  setData(demoData)
}
```

**Après:**
```typescript
const impersonateId = sessionStorage.getItem('impersonateId')
if (isAdmin && impersonateId) {
  // Charger vraies données
  const doc = await getDoc(db, 'collection', impersonateId)
  setData(doc.data())
} else if (isAdmin) {
  // Données de démo
  setData(demoData)
}
```

### 2. Pages (Coach & Player)

**Avant:**
```typescript
if (isAdmin) {
  router.push('/admin')
}
```

**Après:**
```typescript
if (isAdmin && !sessionStorage.getItem('impersonateId')) {
  router.push('/admin')
}
```

### 3. Dashboard Admin

**Ajout du bouton:**
```typescript
<button onClick={() => window.location.href = '/admin/impersonate'}>
  👤 Se faire passer pour...
</button>
```

## 🎯 Cas d'Usage

### 1. Support Client
- Admin peut voir exactement ce que voit l'utilisateur
- Reproduire et déboguer les problèmes
- Vérifier les permissions et accès

### 2. Tests
- Tester les fonctionnalités sans créer de comptes
- Vérifier les différentes vues (entraîneur/joueur)
- Valider les compositions et actions

### 3. Démonstration
- Montrer les fonctionnalités aux clients
- Présenter différents profils
- Faire des démos en direct

### 4. Administration
- Corriger des erreurs pour les utilisateurs
- Valider des compositions en urgence
- Gérer les équipes à distance

## 🚀 Améliorations Futures

### Fonctionnalités
- [ ] Historique des impersonations
- [ ] Logs d'audit des actions en impersonation
- [ ] Notification à l'utilisateur impersonné
- [ ] Limite de temps d'impersonation
- [ ] Permissions granulaires (lecture seule vs modification)

### UX
- [ ] Bannière visible en mode impersonation
- [ ] Raccourci clavier pour sortir (Esc)
- [ ] Favoris pour accès rapide
- [ ] Dernières impersonations

### Sécurité
- [ ] Validation côté serveur
- [ ] Logs de toutes les actions
- [ ] Alerte si actions sensibles
- [ ] Confirmation pour actions critiques

## 📝 Notes

- Le sessionStorage est utilisé (pas localStorage) pour que l'impersonation ne persiste pas entre les sessions
- Les données sont réelles, pas simulées
- Toutes les actions sont enregistrées normalement
- L'admin garde ses permissions admin même en impersonation
- Le bouton de sortie est toujours visible et accessible

## 🔗 URLs

- Page de sélection : http://localhost:3000/admin/impersonate
- Espace Entraîneur : http://localhost:3000/coach
- Espace Joueur : http://localhost:3000/player
- Dashboard Admin : http://localhost:3000/admin

## ✅ Résultat

**L'admin peut maintenant :**
1. ✅ Voir la liste de tous les entraîneurs et joueurs
2. ✅ Se faire passer pour n'importe qui
3. ✅ Accéder à l'interface complète de la personne
4. ✅ Effectuer toutes les actions possibles
5. ✅ Sortir facilement du mode impersonation
6. ✅ Choisir une autre personne rapidement

**Le système est prêt à l'emploi ! 🎉**
