# Guide de Configuration Capacitor pour iOS (IPA)

Ce guide vous explique comment transformer votre application Next.js en application iOS native (IPA) en utilisant Capacitor.

## 📋 Prérequis

1. **macOS** (obligatoire pour développer pour iOS)
2. **Xcode** (version 14.0 ou supérieure)
3. **Node.js** (version 18 ou supérieure)
4. **Compte développeur Apple** (pour publier sur l'App Store)
5. **CocoaPods** (gestionnaire de dépendances iOS)

## 🚀 Installation

### Étape 1: Installer Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
```

### Étape 2: Initialiser Capacitor

```bash
npx cap init
```

Lors de l'initialisation, vous devrez fournir:
- **App name**: ComeBac League
- **App ID**: com.comebac.league (ou votre propre ID)
- **Web dir**: out (pour Next.js export statique)

### Étape 3: Configurer Next.js pour l'export statique

Modifiez `next.config.mjs` pour ajouter l'export statique:

```javascript
const nextConfig = {
  output: 'export',
  // ... reste de votre config
}
```

### Étape 4: Ajouter la plateforme iOS

```bash
npm run build
npx cap add ios
```

### Étape 5: Synchroniser les fichiers

```bash
npx cap sync ios
```

## ⚙️ Configuration

### Fichier `capacitor.config.json`

Le fichier de configuration Capacitor doit être créé à la racine du projet:

```json
{
  "appId": "com.comebac.league",
  "appName": "ComeBac League",
  "webDir": "out",
  "server": {
    "iosScheme": "https",
    "androidScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#10b981"
    }
  }
}
```

### Configuration iOS spécifique

Dans Xcode, vous devrez:
1. Ouvrir `ios/App/App.xcworkspace`
2. Configurer le **Bundle Identifier** (doit correspondre à votre App ID)
3. Configurer les **Signing & Capabilities** avec votre compte développeur
4. Configurer les **Info.plist** pour les permissions nécessaires

## 🔧 Build et Test

### Build de développement

```bash
# 1. Build Next.js
npm run build

# 2. Synchroniser avec Capacitor
npx cap sync ios

# 3. Ouvrir dans Xcode
npx cap open ios

# 4. Dans Xcode: Product > Run (ou Cmd+R)
```

### Build pour TestFlight/App Store

1. Dans Xcode, sélectionnez **Any iOS Device** comme destination
2. **Product > Archive**
3. Une fois l'archive créée, **Distribute App**
4. Choisissez **App Store Connect**
5. Suivez l'assistant de distribution

## 📱 Génération de l'IPA

### Méthode 1: Via Xcode (Recommandé)

1. Archivez l'application dans Xcode
2. Exportez l'archive
3. Choisissez **Ad Hoc** ou **App Store** selon vos besoins
4. L'IPA sera généré dans le dossier choisi

### Méthode 2: Via ligne de commande

```bash
# Build l'application
npm run build
npx cap sync ios

# Dans Xcode, utilisez xcodebuild
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive

# Export l'IPA
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist
```

## 🔐 Configuration des Certificats

Pour publier sur l'App Store, vous avez besoin de:

1. **Certificat de distribution** (dans Apple Developer Portal)
2. **Provisioning Profile** pour votre App ID
3. **App Store Connect** - créer votre app et configurer les métadonnées

## 📝 Checklist avant publication

- [ ] Tester sur un appareil physique
- [ ] Vérifier toutes les fonctionnalités
- [ ] Configurer les icônes et splash screens
- [ ] Configurer les permissions (notifications, caméra, etc.)
- [ ] Tester les notifications push
- [ ] Vérifier la compatibilité avec différentes versions d'iOS
- [ ] Préparer les screenshots pour l'App Store
- [ ] Rédiger la description de l'app
- [ ] Configurer les métadonnées dans App Store Connect

## 🐛 Dépannage

### Erreur: "No such module 'Capacitor'"
```bash
cd ios/App
pod install
```

### Erreur: "Code signing is required"
- Vérifiez que vous avez configuré le Signing & Capabilities dans Xcode
- Assurez-vous d'avoir un compte développeur Apple valide

### L'app ne se connecte pas à Firebase
- Vérifiez que les domaines Firebase sont autorisés dans la console Firebase
- Vérifiez la configuration CSP dans `next.config.mjs`

## 📚 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Documentation Capacitor iOS](https://capacitorjs.com/docs/ios)
- [Guide Apple Developer](https://developer.apple.com/documentation/)

## ⚠️ Notes importantes

1. **Next.js avec Capacitor**: Next.js utilise le Server-Side Rendering par défaut, mais Capacitor nécessite un export statique. Assurez-vous que votre app fonctionne en mode statique.

2. **API Routes**: Les API routes Next.js ne fonctionneront pas dans l'app native. Vous devrez soit:
   - Utiliser un backend séparé
   - Utiliser Firebase directement depuis le client
   - Créer des endpoints API séparés

3. **Images**: Les images optimisées de Next.js ne fonctionneront pas. Utilisez `unoptimized: true` dans `next.config.mjs` (déjà configuré).

4. **Service Workers**: Les service workers peuvent nécessiter une configuration spéciale pour fonctionner dans Capacitor.

