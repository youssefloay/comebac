# 📦 Installation de CocoaPods et Configuration iOS

## Le problème

L'erreur indique que les fichiers de configuration CocoaPods sont manquants. Il faut installer CocoaPods et exécuter `pod install`.

## Solution en 3 étapes

### Étape 1 : Installer CocoaPods

**Exécutez cette commande dans votre terminal :**

```bash
sudo gem install cocoapods
```

Vous devrez entrer votre mot de passe macOS.

**Note :** Si vous avez des erreurs de permissions, essayez :

```bash
sudo gem install -n /usr/local/bin cocoapods
```

### Étape 2 : Vérifier l'installation

```bash
pod --version
```

Vous devriez voir un numéro de version (ex: `1.15.2`).

### Étape 3 : Installer les dépendances iOS

```bash
cd "/Users/youssefloay/VSCODE Projects/comebac/ios/App"
pod install
```

Cette commande va :
- Télécharger et installer toutes les dépendances iOS
- Créer le dossier `Pods/`
- Générer les fichiers de configuration nécessaires

**Cela peut prendre quelques minutes la première fois.**

## Après l'installation

### Ouvrir Xcode

```bash
cd "/Users/youssefloay/VSCODE Projects/comebac"
open ios/App/App.xcworkspace
```

**⚠️ IMPORTANT :** Ouvrez toujours `App.xcworkspace` (pas `App.xcodeproj`) !

### Dans Xcode

1. Attendez que Xcode indexe le projet
2. Sélectionnez le projet **App** dans le navigateur de gauche
3. Onglet **Signing & Capabilities**
4. Cochez **"Automatically manage signing"**
5. Sélectionnez votre **équipe Apple Developer**
6. Choisissez un simulateur ou un appareil
7. Cliquez sur **Run** (▶️) ou `Cmd+R`

## Commandes complètes (copier-coller)

```bash
# 1. Installer CocoaPods
sudo gem install cocoapods

# 2. Aller dans le répertoire iOS
cd "/Users/youssefloay/VSCODE Projects/comebac/ios/App"

# 3. Installer les dépendances
pod install

# 4. Revenir à la racine et ouvrir Xcode
cd "/Users/youssefloay/VSCODE Projects/comebac"
open ios/App/App.xcworkspace
```

## 🐛 Dépannage

### Erreur : "You don't have write permissions"

```bash
sudo gem install -n /usr/local/bin cocoapods
```

### Erreur : "Unable to find a specification"

```bash
pod repo update
pod install
```

### Erreur : "CocoaPods was not able to update the master repo"

```bash
pod repo remove master
pod setup
pod install
```

### Si pod install échoue

```bash
# Nettoyer et réessayer
cd "/Users/youssefloay/VSCODE Projects/comebac/ios/App"
rm -rf Pods Podfile.lock
pod install
```

## ✅ Vérification

Après `pod install`, vous devriez voir :

```
✅ Pods/ (dossier créé)
✅ Podfile.lock (fichier créé)
✅ App.xcworkspace (mis à jour)
```

## 📝 Notes

- **Toujours utiliser `App.xcworkspace`** (pas `.xcodeproj`)
- Après avoir ajouté de nouveaux plugins Capacitor, exécutez `pod install` à nouveau
- Si vous modifiez le Podfile, exécutez `pod install` pour appliquer les changements

