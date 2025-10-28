# ⚽ SOFA Score - Plateforme de Gestion de Ligue Scolaire

Une application web moderne pour la gestion complète d'une ligue de football scolaire avec des cartes FIFA authentiques et des statistiques avancées.

## 🌟 Fonctionnalités Principales

### 🎮 Cartes FIFA Authentiques
- **Cartes personnalisées** avec informations réelles des élèves
- **Design FIFA officiel** avec couleurs et styles authentiques
- **Informations personnelles** : âge, école, taille, pied fort, classe
- **Responsive design** adapté à tous les écrans (mobile, tablette, desktop)

### 📊 Gestion Complète des Matchs
- **Calendrier interactif** avec tous les matchs de la saison
- **Résultats détaillés** avec buteurs, passeurs et cartons
- **Système de cartons** avec sélection des joueurs par équipe
- **Statistiques en temps réel** après chaque match

### 🏆 Statistiques Avancées
- **Classement général** avec points, victoires, défaites
- **Meilleurs buteurs** et passeurs de la ligue
- **Analytics avancées** avec métriques de performance
- **Tendances de saison** et prédictions IA
- **Comparaisons d'équipes** head-to-head

### 👨‍💼 Interface d'Administration
- **Dashboard complet** pour la gestion des données
- **Gestion des équipes** et joueurs
- **Saisie des résultats** avec interface intuitive
- **Outils de maintenance** et réinitialisation

## 🚀 Technologies Utilisées

### Frontend
- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique pour plus de robustesse
- **Tailwind CSS** - Framework CSS utilitaire
- **Lucide React** - Icônes modernes et cohérentes

### Backend & Base de Données
- **Firebase Firestore** - Base de données NoSQL en temps réel
- **Firebase Auth** - Authentification sécurisée
- **API Routes Next.js** - Endpoints REST intégrés

### Design & UX
- **Responsive Design** - Optimisé pour tous les appareils
- **Mode sombre/clair** - Interface adaptative
- **Animations CSS** - Transitions fluides et modernes
- **PWA Ready** - Installation possible sur mobile

## 📱 Captures d'Écran

### 🏠 Page d'Accueil
Interface moderne avec statistiques en temps réel et navigation intuitive.

### 🎮 Cartes FIFA
Cartes authentiques avec informations personnalisées des joueurs.

### 📊 Statistiques
Tableaux responsive avec mode mobile optimisé et couleurs adaptatives.

### ⚽ Gestion des Matchs
Interface d'administration pour saisir les résultats avec cartons visuels.

## 🛠️ Installation et Configuration

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Firebase

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/sofa-score.git
cd sofa-score
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Configuration Firebase**
Créer un fichier `.env.local` :
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Lancer le serveur de développement**
```bash
npm run dev
# ou
yarn dev
```

5. **Accéder à l'application**
Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📚 Structure du Projet

```
sofa-score/
├── app/                          # App Router Next.js
│   ├── admin/                    # Pages d'administration
│   ├── api/                      # API Routes
│   ├── public/                   # Pages publiques
│   └── globals.css               # Styles globaux
├── components/                   # Composants React
│   ├── dashboard/                # Interface admin
│   ├── fifa/                     # Cartes FIFA
│   ├── matches/                  # Gestion des matchs
│   ├── sofa/                     # Navigation et layout
│   └── ui/                       # Composants UI réutilisables
├── lib/                          # Utilitaires et configuration
│   ├── firebase.ts               # Configuration Firebase
│   ├── types.ts                  # Types TypeScript
│   ├── db.ts                     # Fonctions base de données
│   └── statistics.ts             # Calculs statistiques
├── styles/                       # Styles CSS
│   ├── fifa-cards.css            # Styles cartes FIFA
│   └── sofascore-theme.css       # Thème principal
└── public/                       # Assets statiques
```

## 🎯 Fonctionnalités Détaillées

### 🏆 Système de Classement
- **Points FIFA** : 3 points victoire, 1 point nul, 0 point défaite
- **Critères de départage** : différence de buts, buts marqués
- **Mise à jour automatique** après chaque résultat

### 🎮 Cartes FIFA Personnalisées
- **Informations scolaires** : école, classe, matières préférées
- **Données sportives** : position, pied fort, expérience
- **Design authentique** : couleurs et layout FIFA officiels
- **Responsive** : adaptation automatique mobile/desktop

### 📊 Analytics Avancées
- **Métriques de performance** : xG, passes réussies, duels gagnés
- **Tendances de saison** : évolution des performances
- **Prédictions IA** : probabilités de victoire basées sur l'historique
- **Comparaisons** : head-to-head entre équipes

### 🔐 Sécurité et Permissions
- **Accès public** : consultation des résultats et statistiques
- **Accès admin** : modification des données (authentification requise)
- **Validation des données** : contrôles de cohérence automatiques

## 🚀 Déploiement

### Vercel (Recommandé)
1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement
3. Déploiement automatique à chaque push

### Autres Plateformes
- **Netlify** : Compatible avec les API Routes
- **Firebase Hosting** : Intégration native avec Firestore
- **Railway** : Déploiement simple avec base de données

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
- Ajouter des tests pour les nouvelles fonctionnalités
- Documenter les changements dans le README

## 🐛 Signaler un Bug

Pour signaler un bug, veuillez :
1. Vérifier qu'il n'existe pas déjà dans les Issues
2. Créer une nouvelle Issue avec :
   - Description détaillée du problème
   - Étapes pour reproduire
   - Captures d'écran si applicable
   - Informations sur votre environnement

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Développeur Principal** : [Votre Nom]
- **Design UI/UX** : Interface inspirée FIFA et SofaScore
- **Données de Test** : Joueurs égyptiens avec écoles françaises du Caire

## 🙏 Remerciements

- **FIFA** pour l'inspiration du design des cartes
- **SofaScore** pour l'inspiration de l'interface statistiques
- **Communauté Open Source** pour les outils et bibliothèques utilisés

## 📞 Support

Pour toute question ou support :
- 📧 Email : [votre-email@example.com]
- 💬 Discord : [Lien vers serveur Discord]
- 📱 Twitter : [@votre-handle]

---

⭐ **N'hésitez pas à donner une étoile au projet si vous l'appréciez !** ⭐