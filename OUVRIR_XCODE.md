# 🚀 Comment ouvrir le projet iOS dans Xcode

## Méthode 1 : Via le Finder (Recommandé)

1. Ouvrez le **Finder**
2. Naviguez vers : `/Users/youssefloay/VSCODE Projects/comebac/ios/App/`
3. **Double-cliquez** sur le fichier `App.xcworkspace`
4. Xcode devrait s'ouvrir automatiquement

## Méthode 2 : Via le Terminal

```bash
# Depuis n'importe où
cd "/Users/youssefloay/VSCODE Projects/comebac"
open ios/App/App.xcworkspace
```

## Méthode 3 : Via Capacitor

```bash
cd "/Users/youssefloay/VSCODE Projects/comebac"
npx cap open ios
```

## ⚠️ Si Xcode ne s'ouvre pas

### Vérifier que Xcode est installé

```bash
# Vérifier l'installation
test -d "/Applications/Xcode.app" && echo "✅ Xcode installé" || echo "❌ Xcode non installé"
```

### Si Xcode n'est pas installé

1. Ouvrez l'**App Store**
2. Recherchez "Xcode"
3. Installez Xcode (gratuit, mais nécessite un compte Apple)
4. Une fois installé, ouvrez Xcode une première fois pour accepter la licence

### Configurer Xcode Command Line Tools

```bash
# Configurer les outils en ligne de commande
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Installer CocoaPods (nécessaire pour les dépendances)

```bash
sudo gem install cocoapods
```

Puis dans le projet :

```bash
cd "/Users/youssefloay/VSCODE Projects/comebac/ios/App"
pod install
```

## 📍 Chemin complet du workspace

```
/Users/youssefloay/VSCODE Projects/comebac/ios/App/App.xcworkspace
```

## ✅ Une fois Xcode ouvert

1. **Attendez** que Xcode indexe le projet (barre de progression en haut)
2. Dans le navigateur de gauche, vous devriez voir :
   - `App` (le projet)
   - `Pods` (les dépendances)
3. Sélectionnez le projet **App** dans le navigateur
4. Dans l'onglet **Signing & Capabilities** :
   - Cochez "Automatically manage signing"
   - Sélectionnez votre équipe Apple Developer
5. Choisissez un **simulateur iOS** ou un **appareil physique**
6. Cliquez sur **Run** (▶️) ou appuyez sur `Cmd+R`

## 🆘 Besoin d'aide ?

Si Xcode ne s'ouvre toujours pas, essayez :

```bash
# Vérifier les permissions
ls -la "/Users/youssefloay/VSCODE Projects/comebac/ios/App/App.xcworkspace"

# Ouvrir avec le chemin absolu
open "/Users/youssefloay/VSCODE Projects/comebac/ios/App/App.xcworkspace"
```

