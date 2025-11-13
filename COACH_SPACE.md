# Espace Entraîneur - Comebac League

## 📋 Vue d'ensemble

L'Espace Entraîneur est une section dédiée permettant aux entraîneurs de gérer leur équipe, préparer les matchs, créer des compositions officielles et consulter les statistiques.

## 🎨 Design

L'interface reprend exactement le même style visuel que l'espace joueur :
- **Header identique** avec logo et navigation
- **Menu latéral** (desktop) et **navigation bottom** (mobile)
- **Même identité graphique** : couleurs, typographie, espacements
- **Responsive** : fluide sur mobile et ordinateur
- **Animations** : transitions douces avec Framer Motion

## 🚀 Fonctionnalités

### 1. Tableau de bord (`/coach`)
- **Vue d'ensemble de l'équipe** avec statistiques clés
- **Position au classement** en temps réel
- **Prochains matchs** avec alertes de composition manquante
- **Derniers résultats** avec indicateurs V/N/D
- **Alerte automatique** si composition non validée 24h avant match
- **Bouton rapide** "Créer une composition" pour le prochain match
- Activité récente de l'équipe

### 2. Mon Équipe (`/coach/team`)
- **Liste complète des joueurs** avec photos et informations
- **Gestion des statuts** : Titulaire (vert), Remplaçant (bleu), Blessé (orange), Suspendu (rouge)
- **Statistiques individuelles** : buts, passes, matchs, minutes, cartons
- **Statistiques globales de l'équipe** : buts totaux, passes, cartons
- **Modification en temps réel** du statut des joueurs
- Informations de contact et détails personnels
- Vue en grille responsive

### 3. Compositions (`/coach/lineups`)
- **Sélection du match** parmi les matchs à venir
- **Terrain 2D interactif** avec formation 2-2-1
- **Sélection de 5 titulaires** et **3 remplaçants**
- **Validation de la composition** avec confirmation visuelle
- **Verrouillage automatique** 24h avant le match
- **Visibilité progressive** :
  - Immédiate pour les joueurs de l'équipe
  - Publique 30 minutes avant le match
- **Joueurs indisponibles** (blessés/suspendus) clairement identifiés
- Message de confirmation "Composition validée ✅"

### 4. Matchs (`/coach/matches`)
- Calendrier des matchs
- Matchs à venir et passés
- Résultats et scores
- Localisation et horaires

### 5. Statistiques (`/coach/stats`)
- Vue d'ensemble de l'équipe
- Meilleurs buteurs et passeurs
- Tableau détaillé par joueur
- Graphiques et analyses

### 6. Notifications (`/coach/notifications`)
- Alertes importantes
- Mises à jour des matchs
- Notifications d'équipe
- Système de lecture/non-lu

## 🗂️ Structure des fichiers

```
app/coach/
├── layout.tsx              # Layout principal avec sidebar
├── page.tsx                # Dashboard
├── team/
│   └── page.tsx           # Gestion de l'équipe
├── lineups/
│   └── page.tsx           # Compositions
├── matches/
│   └── page.tsx           # Calendrier des matchs
├── stats/
│   └── page.tsx           # Statistiques
└── notifications/
    └── page.tsx           # Notifications

components/dashboard/
└── coach-dashboard.tsx     # Composant dashboard
```

## 🔐 Authentification

L'accès à l'espace entraîneur nécessite :
1. Un compte utilisateur authentifié
2. Un enregistrement dans la collection `coachAccounts` de Firestore
3. Un `teamId` associé

## 📊 Collections Firestore

### `coachAccounts`
```typescript
{
  email: string
  firstName: string
  lastName: string
  teamId: string
  teamName: string
  photo?: string
  createdAt: Timestamp
}
```

### `teams`
```typescript
{
  name: string
  logo?: string
  color?: string
  stats?: {
    matchesPlayed: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
  }
}
```

### `playerAccounts`
```typescript
{
  firstName: string
  lastName: string
  email: string
  teamId: string
  position: string
  jerseyNumber: number
  stats?: {
    matchesPlayed: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
  }
}
```

## 🎯 Navigation

### Desktop
- Sidebar fixe à gauche (280px)
- Menu vertical avec icônes
- Bouton de déconnexion en bas
- Bouton "Basculer sur Utilisateur"

### Mobile
- Bottom navigation (4 items principaux)
- Drawer latéral pour le menu complet
- Bouton hamburger pour ouvrir le drawer
- Safe area pour les encoches

## 🎨 Thème visuel

### Couleurs principales
- **Primaire** : Bleu (#3B82F6)
- **Succès** : Vert (#10B981)
- **Attention** : Jaune (#F59E0B)
- **Danger** : Rouge (#EF4444)
- **Entraîneur** : Orange (#F97316)

### Composants
- Cards avec shadow-md
- Bordures arrondies (rounded-lg)
- Transitions fluides
- Hover effects
- Loading states

## 🔄 Prochaines étapes

### Fonctionnalités à ajouter
- [ ] Édition des compositions avec drag & drop fonctionnel
- [ ] Sauvegarde des compositions dans Firestore
- [ ] Système de notifications en temps réel
- [ ] Chat d'équipe
- [ ] Gestion des absences/blessures
- [ ] Export PDF des compositions
- [ ] Statistiques avancées avec graphiques
- [ ] Historique des matchs détaillé
- [ ] Planification des entraînements

### Améliorations UX
- [ ] Recherche et filtres
- [ ] Tri des tableaux
- [ ] Mode sombre
- [ ] Raccourcis clavier
- [ ] Tutoriel interactif
- [ ] Feedback utilisateur amélioré

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 768px
- **Tablet** : 768px - 1024px
- **Desktop** : > 1024px

### Adaptations
- Grid responsive (1/2/3 colonnes)
- Navigation adaptative
- Tailles de police fluides
- Images optimisées
- Touch-friendly sur mobile

## 🚀 Déploiement

L'espace entraîneur est automatiquement déployé avec l'application principale. Aucune configuration supplémentaire n'est nécessaire.

## 📝 Notes

- Tous les composants utilisent TypeScript
- Validation des données côté client et serveur
- Gestion d'erreur robuste
- Loading states partout
- Accessibilité (ARIA labels)
- SEO optimisé

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités :
1. Créer une nouvelle page dans `app/coach/`
2. Ajouter l'entrée dans le menu (`layout.tsx`)
3. Créer les composants nécessaires
4. Tester sur mobile et desktop
5. Documenter les changements
