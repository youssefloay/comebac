# 🧹 Nettoyage des fichiers Capacitor/iOS

Si vous voulez supprimer tous les fichiers liés à Capacitor et iOS, voici comment faire :

## Supprimer les fichiers iOS

```bash
cd "/Users/youssefloay/VSCODE Projects/comebac"
rm -rf ios
```

## Supprimer la configuration Capacitor

```bash
rm capacitor.config.json
```

## Désinstaller les dépendances Capacitor (optionnel)

```bash
npm uninstall @capacitor/core @capacitor/cli @capacitor/ios @capacitor/splash-screen @capacitor/keyboard
```

## Supprimer les scripts npm (optionnel)

Les scripts `cap:*` dans `package.json` peuvent être supprimés si vous ne les utilisez plus.

## Supprimer les fichiers de documentation

```bash
rm CAPACITOR_SETUP_COMPLETE.md
rm FIX_XCODE.md
rm FIX_COCOAPODS_RUBY.md
rm INSTALLER_COCOAPODS.md
rm OUVRIR_XCODE.md
rm docs/CAPACITOR_IOS_SETUP.md
rm scripts/setup-capacitor-ios.sh
rm install-cocoapods.sh
```

## Note

Le dossier `out/` peut être conservé ou supprimé selon vos besoins. Il est utilisé pour l'export statique de Next.js.

