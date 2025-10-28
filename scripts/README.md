# Scripts de Test - SOFA Score

Ce dossier contient des scripts pour générer des données de test et tester les fonctionnalités de l'application.

## 🚀 Scripts Disponibles

### Configuration Complète
```bash
npm run setup-test-data
```
Exécute tous les scripts dans l'ordre pour configurer des données de test complètes.

### Scripts Individuels

#### Générer des Résultats de Matchs
```bash
npm run generate-results
```
- Génère des résultats pour les matchs existants
- Ajoute des buts, passes décisives et cartons
- Crée des données réalistes pour tester les popups

#### Mettre à Jour les Statistiques
```bash
npm run update-stats
```
- Calcule les statistiques des équipes basées sur les résultats
- Met à jour le classement
- Calcule points, victoires, défaites, buts pour/contre

## 📊 Données Générées

### Résultats de Matchs
- **Match 1**: 2-1 avec buts et cartons jaunes
- **Match 2**: 0-3 avec carton rouge et plusieurs buts
- **Match 3**: 1-1 match nul avec cartons

### Statistiques d'Équipes
- Points calculés (3 pour victoire, 1 pour nul)
- Buts pour et contre
- Nombre de matchs joués
- Classement automatique

## 🧪 Tests Possibles

Après avoir exécuté les scripts, vous pouvez tester :

### ✅ Cartes de Match
- Affichage des scores sur la page d'accueil
- Popup avec détails au clic
- Buts avec passes décisives
- Cartons jaunes et rouges

### ✅ Statistiques
- Page classement mise à jour
- Statistiques des équipes
- Calculs automatiques des points

### ✅ Interface
- Responsive design
- Animations des popups
- Navigation entre les pages

## 🔧 Configuration

Assurez-vous que vos variables d'environnement Firebase sont configurées dans `.env.local` :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 📝 Notes

- Les scripts vérifient les données existantes pour éviter les doublons
- Les résultats sont générés avec des noms de joueurs réalistes
- Les statistiques sont recalculées à chaque exécution
- Tous les timestamps sont automatiquement gérés