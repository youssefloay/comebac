# Upload des Maillots d'Équipe dans le Shop

Ce script permet d'uploader les maillots de chaque équipe dans le shop de merchandising.

## 📋 Prérequis

1. Avoir un PDF avec tous les maillots
2. Extraire les images du PDF dans un dossier

## 📁 Préparation des Images

### Option 1: Extraction manuelle
1. Ouvrez le PDF
2. Pour chaque page/maillot, exportez l'image (JPG, PNG, ou WebP)
3. Nommez chaque fichier avec le nom exact de l'équipe
   - Exemples: `Icons.jpg`, `Underdogs.png`, `Road to Glory.jpg`

### Option 2: Extraction automatique (avec outils)
Vous pouvez utiliser des outils comme:
- Adobe Acrobat (Export > Images)
- Online PDF to Image converters
- Python script avec `pdf2image`

## 🚀 Utilisation

1. **Créez un dossier pour les images** (ex: `./jerseys/` à la racine du projet)

2. **Placez toutes les images des maillots** dans ce dossier, nommées avec le nom de l'équipe

3. **Exécutez le script:**
   ```bash
   npx tsx scripts/upload-team-jerseys.ts ./jerseys
   ```

   Ou si le dossier s'appelle `jerseys`:
   ```bash
   npx tsx scripts/upload-team-jerseys.ts
   ```

## 🔍 Fonctionnement

Le script va:
1. ✅ Lire tous les fichiers images du dossier
2. ✅ Pour chaque image, chercher l'équipe correspondante dans Firestore
3. ✅ Uploader l'image vers Firebase Storage
4. ✅ Créer ou mettre à jour un produit de maillot dans le shop pour cette équipe
5. ✅ Lier le produit à l'équipe avec `teamId`

## 📊 Résultat

- Les maillots spécifiques à chaque équipe apparaîtront dans le shop
- Quand un utilisateur visite `/shop/[teamId]`, il verra le maillot de son équipe au lieu du maillot générique
- L'image réelle du maillot sera affichée au lieu du mockup

## ⚠️ Notes

- Les noms de fichiers doivent correspondre au nom de l'équipe dans Firestore (avec tolérance pour les variations)
- Si une équipe n'est pas trouvée, elle sera listée dans le résumé
- Si un produit existe déjà pour une équipe, il sera mis à jour avec la nouvelle image
- Les formats d'image supportés: JPG, JPEG, PNG, WebP

## 🔧 Dépannage

### Équipe non trouvée
Si une équipe n'est pas trouvée, vérifiez:
- Le nom du fichier correspond-il exactement au nom de l'équipe dans Firestore?
- L'équipe est-elle active (`isActive: true`)?

### Erreur d'upload
Vérifiez:
- Les variables d'environnement Firebase sont-elles configurées?
- Les permissions Firebase Storage sont-elles correctes?
