# 🎨 Mockup 3D - Documentation

## ✅ Implémentation

J'ai créé un système de mockup 3D utilisant **Canvas HTML5** pour afficher les produits de manière visuelle et interactive.

## 📁 Fichier Principal

`components/shop/product-mockup-3d.tsx`

## 🎯 Fonctionnalités

### 1. Rendu en Temps Réel
- Le mockup se met à jour instantanément quand l'utilisateur tape son nom ou numéro
- Pas de délai, pas de rechargement
- Feedback visuel immédiat

### 2. Trois Types de Produits

#### Maillot (Jersey) - Bleu
- **Couleur** : Dégradé bleu (#3b82f6 → #1e40af)
- **Éléments** :
  - Corps principal avec forme de maillot
  - Manches gauche et droite
  - Col arrondi
  - Logo "COMEBAC" en haut à gauche
  - Nom de l'équipe en haut à droite
  - **Personnalisation** :
    - Nom du joueur au centre (blanc, 32px)
    - Numéro en grand en bas (blanc avec contour bleu, 80px)
  - Rayures décoratives horizontales

#### T-Shirt - Vert
- **Couleur** : Dégradé vert (#10b981 → #059669)
- **Éléments** :
  - Corps principal
  - Manches courtes
  - Logo "COMEBAC" au centre (24px)
  - Nom de l'équipe (20px)
  - Texte "LEAGUE" en dessous (14px)

#### Sweatshirt - Violet
- **Couleur** : Dégradé violet (#8b5cf6 → #6d28d9)
- **Éléments** :
  - Corps principal
  - Manches longues
  - Capuche en haut
  - Poche kangourou au centre
  - Logo "COMEBAC" (28px)
  - Nom de l'équipe (18px)
  - Cordons de capuche

### 3. Intégration des Données Réelles

Le mockup utilise :
- ✅ **Nom de l'équipe** récupéré de Firestore
- ✅ **Logo de l'équipe** (prévu pour intégration future)
- ✅ **Personnalisation** (nom et numéro du joueur)
- ✅ **Taille** sélectionnée (affichée en badge)

## 📍 Où le Mockup Apparaît

### 1. Page Principale (`/public/shop`)
- 3 cartes de produits avec mockups génériques
- Affiche "COMEBAC LEAGUE" avec numéro 23 pour le maillot

### 2. Page Équipe (`/public/shop/[teamId]`)
- 3 mockups avec le **nom réel de l'équipe**
- Chaque produit a son mockup personnalisé

### 3. Modal de Personnalisation
- **Grand mockup interactif**
- Se met à jour en temps réel pendant que l'utilisateur tape
- Affiche la taille sélectionnée
- Prévisualisation exacte du produit final

## 🎨 Détails Techniques

### Canvas HTML5
```typescript
<canvas width={400} height={500} />
```

### Fonctions de Dessin
- `drawJersey()` - Dessine un maillot complet
- `drawTShirt()` - Dessine un t-shirt
- `drawSweatshirt()` - Dessine un sweatshirt

### Dégradés
```typescript
const gradient = ctx.createLinearGradient(0, 0, 0, height)
gradient.addColorStop(0, '#3b82f6')
gradient.addColorStop(1, '#1e40af')
```

### Texte avec Contour
```typescript
ctx.strokeStyle = '#1e3a8a'
ctx.lineWidth = 3
ctx.strokeText(number, x, y)
ctx.fillText(number, x, y)
```

## 🔄 Mise à Jour en Temps Réel

Le composant utilise `useEffect` pour redessiner le canvas à chaque changement :

```typescript
useEffect(() => {
  // Redessiner quand productType, teamName, ou customization change
}, [productType, teamName, teamLogo, customization])
```

## 📱 Responsive

Le canvas s'adapte automatiquement :
```typescript
className="w-full h-full object-contain"
```

## 🌙 Mode Sombre

Le mockup reste visible en mode sombre grâce au fond dégradé :
```typescript
className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
```

## 🚀 Améliorations Futures

### Court Terme
1. **Intégrer les logos d'équipes**
   - Charger l'image du logo
   - Afficher sur le mockup
   - Position : poitrine ou épaule

2. **Ajouter plus de détails**
   - Coutures
   - Ombres et lumières
   - Textures de tissu

### Moyen Terme
3. **Rotation 3D**
   - Utiliser Three.js
   - Permettre de faire tourner le produit
   - Vue avant/arrière

4. **Couleurs personnalisables**
   - Choisir la couleur du maillot
   - Couleur du texte
   - Couleur des manches

### Long Terme
5. **Modèles 3D réalistes**
   - Importer des modèles 3D de vêtements
   - Textures haute résolution
   - Éclairage réaliste
   - Export en image HD

6. **Essayage virtuel**
   - Upload photo du joueur
   - Superposer le maillot
   - AR (Réalité Augmentée) sur mobile

## 💡 Exemples d'Utilisation

### Basique
```tsx
<ProductMockup3D
  productType="jersey"
  teamName="FC Barcelona"
/>
```

### Avec Personnalisation
```tsx
<ProductMockup3D
  productType="jersey"
  teamName="Real Madrid"
  customization={{
    name: "BENZEMA",
    number: 9
  }}
  size="L"
/>
```

### T-Shirt Simple
```tsx
<ProductMockup3D
  productType="tshirt"
  teamName="Manchester United"
  size="M"
/>
```

## 🎯 Validation

### Nom
- Max 15 caractères
- Converti en majuscules automatiquement
- Centré sur le maillot

### Numéro
- Entre 0 et 99
- Affiché en grand (80px)
- Avec contour pour meilleure lisibilité

## 📊 Performance

- **Léger** : Pas de librairie 3D lourde
- **Rapide** : Rendu instantané
- **Optimisé** : Redessine uniquement quand nécessaire
- **Compatible** : Fonctionne sur tous les navigateurs modernes

## 🐛 Debugging

Si le mockup ne s'affiche pas :

1. Vérifier la console pour erreurs Canvas
2. Vérifier que le composant est bien importé
3. Vérifier les props passées
4. Tester avec des valeurs hardcodées

## 📝 Notes

- Le mockup est **purement visuel** (pas de vraie 3D)
- Utilise des formes géométriques simples
- Optimisé pour la performance
- Peut être facilement amélioré avec Three.js plus tard

---

**Créé avec** : Canvas HTML5 + React + TypeScript  
**Performance** : ⚡ Excellent  
**Compatibilité** : ✅ Tous navigateurs modernes
