# 🔧 Résoudre le problème Ruby/CocoaPods

## Le problème

Votre Ruby (2.6.10) est trop ancien pour la dernière version de CocoaPods qui nécessite Ruby >= 3.1.0.

## Solution 1 : Installer CocoaPods via Homebrew (Recommandé - Plus simple)

Cette méthode évite les problèmes de version Ruby :

```bash
# Installer Homebrew si ce n'est pas déjà fait
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer CocoaPods via Homebrew
brew install cocoapods
```

## Solution 2 : Mettre à jour Ruby avec Homebrew

```bash
# Installer Homebrew si nécessaire
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer Ruby via Homebrew
brew install ruby

# Ajouter Ruby de Homebrew au PATH (ajoutez à ~/.zshrc)
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Vérifier la nouvelle version
ruby --version

# Maintenant installer CocoaPods
gem install cocoapods
```

## Solution 3 : Installer une version plus ancienne de CocoaPods

Installer une version compatible avec Ruby 2.6 :

```bash
# Installer securerandom compatible
gem install securerandom -v 0.3.2

# Installer CocoaPods 1.11.3 (compatible avec Ruby 2.6)
gem install cocoapods -v 1.11.3
```

## Solution 4 : Utiliser rbenv pour gérer Ruby

```bash
# Installer rbenv via Homebrew
brew install rbenv ruby-build

# Installer Ruby 3.1.0
rbenv install 3.1.0
rbenv global 3.1.0

# Ajouter rbenv au PATH (ajoutez à ~/.zshrc)
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Vérifier
ruby --version

# Installer CocoaPods
gem install cocoapods
```

## 🎯 Solution rapide recommandée

**Utilisez Homebrew pour installer CocoaPods** (Solution 1) - c'est la plus simple :

```bash
# Vérifier si Homebrew est installé
which brew

# Si Homebrew n'est pas installé, installez-le :
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer CocoaPods
brew install cocoapods

# Vérifier l'installation
pod --version
```

## Après l'installation

Une fois CocoaPods installé :

```bash
cd "/Users/youssefloay/VSCODE Projects/comebac/ios/App"
pod install
```

## ✅ Vérification

```bash
# Vérifier la version de CocoaPods
pod --version

# Devrait afficher quelque chose comme : 1.15.2
```

