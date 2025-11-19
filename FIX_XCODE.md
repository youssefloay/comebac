# 🔧 Correction du problème Xcode

## Le problème

Votre système pointe vers CommandLineTools au lieu de Xcode.app, ce qui empêche Capacitor d'ouvrir Xcode correctement.

## Solution rapide

**Exécutez cette commande dans votre terminal :**

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

Vous devrez entrer votre mot de passe macOS.

## Vérification

Après avoir exécuté la commande, vérifiez :

```bash
xcode-select -p
```

Vous devriez voir :
```
/Applications/Xcode.app/Contents/Developer
```

## Ensuite, ouvrez Xcode

```bash
cd "/Users/youssefloay/VSCODE Projects/comebac"
npx cap open ios
```

Ou directement :

```bash
open "/Users/youssefloay/VSCODE Projects/comebac/ios/App/App.xcworkspace"
```

## Alternative : Ouvrir manuellement

1. Ouvrez le **Finder**
2. Allez dans : `/Users/youssefloay/VSCODE Projects/comebac/ios/App/`
3. **Double-cliquez** sur `App.xcworkspace`
4. Xcode s'ouvrira

## Si vous n'avez pas Xcode installé

1. Ouvrez l'**App Store**
2. Recherchez "Xcode"
3. Installez Xcode (gratuit, ~12 GB)
4. Ouvrez Xcode une première fois pour accepter la licence
5. Puis exécutez la commande `sudo xcode-select` ci-dessus

