# ⚽ ComeBac League - Plateforme de Gestion de Ligue de Football

Une application web moderne et performante pour la gestion complète d'une ligue de football avec des statistiques avancées, des cartes de joueurs personnalisées et une interface d'administration complète.

## 🌟 Fonctionnalités Principales

### 🎮 Cartes de Joueurs Personnalisées
- **Cartes authentiques** avec informations détaillées des joueurs
- **Design moderne** avec couleurs et styles personnalisés
- **Informations complètes** : surnom, taille, position, pied fort
- **Responsive design** adapté à tous les écrans (mobile, tablette, desktop)

### 📊 Gestion Complète des Matchs
- **Calendrier interactif** avec tous les matchs de la saison
- **Résultats détaillés** avec buteurs, passeurs et cartons
- **Système de cartons** avec sélection des joueurs par équipe
- **Statistiques en temps réel** après chaque match
- **Compositions d'équipe** gérées par les coaches

### 🏆 Statistiques Avancées
- **Classement général** avec points, victoires, défaites, nuls
- **Meilleurs buteurs** et passeurs de la ligue
- **Statistiques d'équipes** avec historique des matchs
- **Comparaisons d'équipes** head-to-head
- **Pages publiques** pour consultation sans authentification

### 👨‍💼 Interface d'Administration
- **Dashboard complet** pour la gestion des données
- **Gestion des équipes** et joueurs
- **Gestion des coaches** et inscriptions
- **Saisie des résultats** avec interface intuitive
- **Export Excel** des données d'équipes
- **Outils de maintenance** et backup automatique
- **Gestion des notifications** et emails

### 👥 Gestion des Utilisateurs
- **Comptes joueurs** avec profils complets
- **Comptes coaches** pour la gestion d'équipes
- **Authentification sécurisée** via Firebase Auth
- **Profils personnalisables** avec photos
- **Notifications en temps réel**

## 🚀 Technologies Utilisées

### Frontend
- **Next.js 16** - Framework React avec App Router
- **TypeScript** - Typage statique pour plus de robustesse
- **Tailwind CSS** - Framework CSS utilitaire
- **Framer Motion** - Animations fluides
- **Lucide React** - Icônes modernes et cohérentes

### Backend & Base de Données
- **Firebase Firestore** - Base de données NoSQL en temps réel
- **Firebase Auth** - Authentification sécurisée
- **Firebase Storage** - Stockage de fichiers (photos de profil)
- **API Routes Next.js** - Endpoints REST intégrés avec cache

### Performance & Optimisation
- **Cache en mémoire** pour les API routes publiques
- **Headers de cache** optimisés (CDN-ready)
- **Limites de données** pour réduire les requêtes Firestore
- **Lazy loading** des composants lourds
- **PWA Ready** - Installation possible sur mobile

### Design & UX
- **Responsive Design** - Optimisé pour tous les appareils
- **Mode sombre/clair** - Interface adaptative
- **Animations CSS** - Transitions fluides et modernes
- **Interface moderne** avec gradients et effets visuels

## 📱 Structure du Projet

```
comebac/
├── app/                          # App Router Next.js
│   ├── admin/                    # Pages d'administration
│   ├── api/                      # API Routes
│   │   ├── admin/                # Routes admin (backup, export, etc.)
│   │   ├── public/               # Routes publiques (cache optimisé)
│   │   └── player/               # Routes joueur
│   ├── public/                   # Pages publiques (équipes, matchs)
│   ├── player/                   # Pages joueur
│   └── coach/                    # Pages coach
├── components/                   # Composants React
│   ├── admin/                    # Interface admin
│   ├── fifa/                     # Cartes joueurs
│   ├── matches/                  # Gestion des matchs
│   ├── sofa/                     # Navigation et layout
│   ├── premier-league/           # Navigation Premier League
│   ├── public/                   # Composants pages publiques
│   └── ui/                       # Composants UI réutilisables
├── lib/                          # Utilitaires et configuration
│   ├── firebase.ts               # Configuration Firebase
│   ├── types.ts                  # Types TypeScript
│   ├── db.ts                     # Fonctions base de données
│   ├── statistics.ts             # Calculs statistiques
│   └── email-templates.ts        # Templates d'emails
├── scripts/                      # Scripts utilitaires
│   ├── backup-automatic.ts       # Backup automatique
│   └── generate-pwa-icons.sh     # Génération d'icônes PWA
├── public/                       # Assets statiques
│   ├── icons/                    # Icônes PWA optimisées
│   └── comebac.png               # Logo principal
└── docs/                         # Documentation
    ├── PERFORMANCE_OPTIMIZATIONS_2025.md
    └── BACKUP_AUTOMATIQUE.md
```

## 🛠️ Installation et Configuration

### Prérequis
- **Node.js 18+**
- **npm** ou **yarn**
- **Compte Firebase** avec projet configuré

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/youssefloay/comebac.git
cd comebac
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Firebase**

Créer un fichier `.env.local` à la racine du projet :
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (pour les API routes)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key

# Email (optionnel - pour les notifications)
RESEND_API_KEY=your_resend_api_key
ADMIN_EMAIL=contact@comebac.com
```

4. **Lancer le serveur de développement**
```bash
npm run dev
```

5. **Accéder à l'application**
Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📚 Scripts Disponibles

### Développement
```bash
npm run dev          # Serveur de développement (Webpack)
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Linter ESLint
```

### Utilitaires
```bash
npm run backup:auto              # Backup automatique de la base de données
npm run generate-pwa-icons      # Générer les icônes PWA optimisées
npm run setup-test-data          # Configurer des données de test
npm run update-stats             # Mettre à jour les statistiques
```

## 🎯 Fonctionnalités Détaillées

### 🏆 Système de Classement
- **Points FIFA** : 3 points victoire, 1 point nul, 0 point défaite
- **Critères de départage** : différence de buts, buts marqués
- **Mise à jour automatique** après chaque résultat
- **Statistiques détaillées** par équipe

### 🎮 Cartes de Joueurs
- **Informations personnelles** : surnom, taille, position
- **Données sportives** : pied fort, expérience
- **Design moderne** : couleurs et layout personnalisés
- **Responsive** : adaptation automatique mobile/desktop

### 📊 Analytics et Performance
- **Optimisations de performance** : cache, limites de données
- **API routes optimisées** : réduction de 85-95% des requêtes Firestore
- **Core Web Vitals** : amélioration continue des métriques
- **Documentation** : voir `docs/PERFORMANCE_OPTIMIZATIONS_2025.md`

### 🔐 Sécurité et Permissions
- **Accès public** : consultation des résultats et statistiques
- **Accès joueur** : consultation de son profil et statistiques
- **Accès coach** : gestion de son équipe
- **Accès admin** : modification des données (authentification requise)
- **Validation des données** : contrôles de cohérence automatiques

### 💾 Backup et Maintenance
- **Backup automatique** : sauvegarde complète de la base de données
- **Export Excel** : export des données d'équipes avec sélection de colonnes
- **Documentation** : voir `docs/BACKUP_AUTOMATIQUE.md`

## 🚀 Déploiement

### Vercel (Recommandé)
1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement dans Vercel
3. Déploiement automatique à chaque push sur `main`

### Configuration Vercel
- **Framework Preset** : Next.js
- **Build Command** : `npm run build`
- **Output Directory** : `.next`
- **Node Version** : 18.x ou supérieur

### Variables d'Environnement Requises
Toutes les variables de `.env.local` doivent être configurées dans Vercel :
- Variables `NEXT_PUBLIC_*` pour le client
- Variables `FIREBASE_ADMIN_*` pour les API routes
- Variables optionnelles (`RESEND_API_KEY`, etc.)

## 📖 Documentation

### Documentation Disponible
- **[Optimisations de Performance](./docs/PERFORMANCE_OPTIMIZATIONS_2025.md)** - Détails des optimisations réalisées
- **[Système de Backup](./docs/BACKUP_AUTOMATIQUE.md)** - Guide complet du backup automatique
- **[Audit de Sécurité](./SECURITY-AUDIT.md)** - Points de sécurité à améliorer

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créer une branche** pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Commit** vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. **Push** vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Ouvrir une Pull Request**

### 📋 Guidelines de Contribution
- Utiliser TypeScript pour tous les nouveaux composants
- Suivre les conventions de nommage existantes
- Ajouter des commentaires pour les fonctions complexes
- Documenter les changements importants
- Tester les changements avant de créer une PR

## 🐛 Signaler un Bug

Pour signaler un bug, veuillez :
1. Vérifier qu'il n'existe pas déjà dans les Issues
2. Créer une nouvelle Issue avec :
   - Description détaillée du problème
   - Étapes pour reproduire
   - Captures d'écran si applicable
   - Informations sur votre environnement (OS, navigateur, version Node.js)

## 🔄 Changelog

### Janvier 2025
- ✅ Optimisations de performance majeures (cache, API routes)
- ✅ Nouveau logo et icônes PWA optimisées
- ✅ Export Excel amélioré avec sélection de colonnes
- ✅ Nettoyage des joueurs supprimés
- ✅ Amélioration de l'affichage du logo

### Décembre 2024
- ✅ Système de backup automatique
- ✅ Gestion des notifications
- ✅ Interface d'administration améliorée

## 🙏 Remerciements

- **Firebase** pour l'infrastructure backend
- **Next.js** pour le framework React
- **Tailwind CSS** pour le système de design
- **Communauté Open Source** pour les outils et bibliothèques utilisés

---

⭐ **N'hésitez pas à donner une étoile au projet si vous l'appréciez !** ⭐
