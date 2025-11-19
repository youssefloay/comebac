#!/bin/bash

# Script d'installation rapide pour Capacitor iOS
# Usage: ./scripts/setup-capacitor-ios.sh

set -e

echo "🚀 Configuration de Capacitor pour iOS..."

# Vérifier que nous sommes sur macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Erreur: Ce script nécessite macOS pour développer pour iOS"
    exit 1
fi

# Vérifier que Xcode est installé
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Erreur: Xcode n'est pas installé. Veuillez installer Xcode depuis l'App Store."
    exit 1
fi

# Installer Capacitor
echo "📦 Installation de Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/splash-screen @capacitor/keyboard

# Vérifier si Capacitor est déjà initialisé
if [ ! -f "capacitor.config.json" ]; then
    echo "⚙️  Initialisation de Capacitor..."
    npx cap init "ComeBac League" "com.comebac.league" --web-dir=out
else
    echo "✅ Capacitor est déjà configuré"
fi

# Modifier next.config.mjs pour activer l'export statique
echo "📝 Configuration de Next.js pour l'export statique..."
# Note: Vous devrez décommenter manuellement 'output: export' dans next.config.mjs

# Build de l'application
echo "🔨 Build de l'application Next.js..."
npm run build

# Ajouter la plateforme iOS
if [ ! -d "ios" ]; then
    echo "📱 Ajout de la plateforme iOS..."
    npx cap add ios
else
    echo "✅ La plateforme iOS est déjà ajoutée"
fi

# Synchroniser les fichiers
echo "🔄 Synchronisation des fichiers..."
npx cap sync ios

# Installer les dépendances CocoaPods
if [ -d "ios/App" ]; then
    echo "🍫 Installation des dépendances CocoaPods..."
    cd ios/App
    pod install
    cd ../..
fi

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Ouvrez Xcode: npx cap open ios"
echo "2. Configurez le Bundle Identifier dans Xcode"
echo "3. Configurez le Signing & Capabilities avec votre compte développeur"
echo "4. Testez l'app: Product > Run dans Xcode"
echo ""
echo "📚 Consultez docs/CAPACITOR_IOS_SETUP.md pour plus de détails"

