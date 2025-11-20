# Configuration AdSense pour ComeBac

## 📋 Prérequis

1. Avoir un compte Google AdSense approuvé
2. Obtenir votre ID client AdSense (format: `ca-pub-XXXXXXXXXX`)
3. Créer des emplacements publicitaires (ad slots) dans votre compte AdSense

## 🔧 Configuration

### 1. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet et ajoutez votre ID client AdSense :

```env
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-6906465408852552
```

**Important** : 
- Le préfixe `NEXT_PUBLIC_` est nécessaire pour que la variable soit accessible côté client
- Le fichier `.env.local` est ignoré par git (ne sera pas commité)
- Redémarrez le serveur de développement après avoir créé/modifié le fichier `.env.local`

### 2. Créer des emplacements publicitaires (Ad Slots)

Dans votre compte Google AdSense :

1. Allez dans **Annonces** > **Par unité** > **Créer une unité**
2. Choisissez le type d'annonce (Display, In-article, etc.)
3. Nommez votre unité (ex: "Homepage Banner", "Matches Page", etc.)
4. Copiez l'**ID de l'unité** (format: `1234567890`)

### 3. Remplacer les slots dans le code

Les annonces sont actuellement configurées avec des slots de test (`1234567890`, `1234567891`, etc.).

Remplacez-les par vos vrais IDs d'unités AdSense dans les fichiers suivants :

- `app/public/page.tsx` - 3 annonces (slots: 1234567890, 1234567891, 1234567892)
- `app/public/matches/page.tsx` - 3 annonces (slots: 1234567893, 1234567894, 1234567895)
- `app/public/ranking/page.tsx` - 2 annonces (slots: 1234567896, 1234567897)
- `app/public/teams/page.tsx` - 2 annonces (slots: 1234567898, 1234567899)

**Exemple** :
```tsx
<AdBanner slot="1234567890" format="auto" style="horizontal" />
```

Remplacez `1234567890` par votre vrai ID d'unité AdSense.

## 📍 Emplacements des annonces

### Page d'accueil (`/public`)
- Après le hero section
- Après le podium (top 3 équipes)
- Après les résultats récents

### Page des matchs (`/public/matches`)
- En haut de page (après le header)
- Après les filtres
- Après les matchs en direct (si présents)

### Page du classement (`/public/ranking`)
- En haut de page (après le header)
- Après le podium

### Page des équipes (`/public/teams`)
- En haut de page (après le header)
- Après la grille des équipes

## 🎨 Formats d'annonces

Les annonces sont configurées avec :
- **Format** : `auto` (s'adapte automatiquement)
- **Style** : `horizontal` (bannière horizontale, 728x90 ou responsive)
- **Responsive** : Activé par défaut

Pour changer le format, modifiez les props du composant `AdBanner` :
- `format`: `'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'`
- `style`: `'horizontal' | 'vertical' | 'square'`

## ✅ Vérification

1. Assurez-vous que `NEXT_PUBLIC_ADSENSE_CLIENT_ID` est défini
2. Remplacez tous les slots de test par vos vrais IDs
3. Redémarrez le serveur de développement
4. Vérifiez dans la console du navigateur qu'il n'y a pas d'erreurs AdSense
5. Les annonces devraient apparaître après quelques minutes (délai d'approbation AdSense)

## 🚨 Notes importantes

- Les annonces ne s'affichent que si `NEXT_PUBLIC_ADSENSE_CLIENT_ID` est défini
- Google AdSense peut prendre 24-48h pour commencer à afficher des annonces après l'approbation
- Respectez les politiques AdSense (pas de clics frauduleux, contenu approprié, etc.)
- Les annonces sont automatiquement masquées si l'ID client n'est pas configuré

## 📊 Optimisation

Pour maximiser les revenus :
- Placez les annonces près du contenu principal
- Évitez trop d'annonces sur une même page (max 3-4 recommandé)
- Testez différents formats et emplacements
- Surveillez les performances dans votre tableau de bord AdSense

