# ✅ Configuration Capacitor iOS - Terminée

## Ce qui a été fait

✅ **Dépendances installées**
- @capacitor/core
- @capacitor/cli
- @capacitor/ios
- @capacitor/splash-screen
- @capacitor/keyboard

✅ **Configuration créée**
- `capacitor.config.json` - Configuration principale
- Plateforme iOS ajoutée dans `ios/`
- Structure Xcode créée

✅ **Mode serveur distant configuré**
- L'app chargera depuis `https://www.comebac.com`
- Toutes les API routes fonctionneront normalement
- Pas besoin d'export statique

## 📱 Prochaines étapes (sur macOS avec Xcode)

### 1. Installer CocoaPods (si pas déjà installé)
```bash
sudo gem install cocoapods
```

### 2. Installer les dépendances iOS
```bash
cd ios/App
pod install
cd ../..
```

### 3. Configurer Xcode
```bash
# Ouvrir le projet dans Xcode
npx cap open ios
```

### 4. Dans Xcode, configurer :

**a) Bundle Identifier**
- Ouvrez `App.xcworkspace` dans Xcode
- Sélectionnez le projet "App" dans le navigateur
- Onglet "Signing & Capabilities"
- Changez le Bundle Identifier si nécessaire (actuellement: `com.comebac.league`)

**b) Signing & Capabilities**
- Sélectionnez votre équipe de développement Apple
- Xcode générera automatiquement les certificats nécessaires

**c) Info.plist**
- Vérifiez les permissions nécessaires (Notifications, Caméra, etc.)
- Configurez les URL Schemes si nécessaire

### 5. Tester l'application
- Dans Xcode: **Product > Run** (ou `Cmd+R`)
- Sélectionnez un simulateur iOS ou un appareil physique connecté

### 6. Build pour TestFlight/App Store

**Via Xcode (Recommandé):**
1. Sélectionnez **Any iOS Device** comme destination
2. **Product > Archive**
3. Une fois l'archive créée, cliquez sur **Distribute App**
4. Choisissez **App Store Connect**
5. Suivez l'assistant de distribution
6. L'IPA sera généré automatiquement

**Via ligne de commande:**
```bash
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist
```

## 🔧 Commandes utiles

```bash
# Synchroniser les fichiers web avec iOS
npx cap sync ios

# Ouvrir dans Xcode
npx cap open ios

# Build et synchroniser en une commande
npm run cap:ios
```

## ⚙️ Configuration actuelle

**App ID:** `com.comebac.league`  
**App Name:** `ComeBac League`  
**Mode:** Serveur distant (charge depuis https://www.comebac.com)  
**Web Directory:** `out`

## 📝 Notes importantes

1. **Mode serveur distant**: L'app charge le contenu depuis votre site web en production. Cela signifie que :
   - ✅ Toutes les API routes fonctionnent
   - ✅ Pas besoin de rebuild pour mettre à jour le contenu
   - ⚠️ Nécessite une connexion internet
   - ⚠️ Le site doit être accessible depuis l'app

2. **Pour un mode offline complet**: Vous devriez utiliser `output: 'export'` dans `next.config.mjs`, mais cela nécessitera de refactoriser toutes les API routes pour utiliser Firebase directement depuis le client.

3. **Certificats Apple**: Pour publier sur l'App Store, vous avez besoin de:
   - Un compte développeur Apple ($99/an)
   - Certificats de distribution
   - Provisioning profiles

## 🐛 Dépannage

**Erreur: "No such module 'Capacitor'"**
```bash
cd ios/App
pod install
```

**Erreur: "Code signing is required"**
- Configurez le Signing & Capabilities dans Xcode avec votre compte développeur

**L'app ne charge pas le site**
- Vérifiez que `https://www.comebac.com` est accessible
- Vérifiez la configuration dans `capacitor.config.json`

## 📚 Documentation

Consultez `docs/CAPACITOR_IOS_SETUP.md` pour plus de détails.

## ✨ C'est prêt !

Votre application est maintenant configurée pour iOS. Ouvrez simplement Xcode et commencez à tester !

```bash
npx cap open ios
```

