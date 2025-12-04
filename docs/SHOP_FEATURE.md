# 🛍️ Boutique de Merch - Documentation

**Date de création** : Janvier 2025  
**Statut** : ✅ Implémenté (structure de base)

---

## 📋 Vue d'Ensemble

La boutique ComeBac permet aux joueurs, coaches et supporters de commander du merch officiel de leur équipe via un système de pré-commandes par périodes.

### Modèle de Business
- **Pré-commandes uniquement** : Pas de stock permanent
- **Périodes limitées** : Ouverture de 2-3 semaines
- **Paiement en ligne** : Stripe (obligatoire)
- **Prix en EGP** : Livre égyptienne
- **Pas de retours** : Commandes finales

---

## 🎯 Fonctionnalités

### Pour les Clients

#### 1. Sélection d'Équipe
- Page `/public/shop` - Vue d'ensemble
- Page `/public/shop/teams` - Choix de l'équipe
- Recherche d'équipes
- Affichage du statut (ouvert/fermé)

#### 2. Produits Disponibles
- **Maillot** : 950 EGP (personnalisable)
  - Nom (max 15 caractères)
  - Numéro (0-99)
  - Logo ComeBac + logo équipe (fixes)
- **T-Shirt** : 750 EGP
  - Logo ComeBac + logo équipe (fixes)
- **Sweatshirt** : 1100 EGP
  - Logo ComeBac + logo équipe (fixes)

#### 3. Personnalisation
- Mockup 3D pour visualiser le produit
- Choix de la taille (XS, S, M, L, XL, XXL)
- Personnalisation nom/numéro pour maillots (incluse)

#### 4. Panier et Checkout
- Panier multi-produits
- Modification des quantités
- Choix du mode de livraison :
  - **Retrait sur place** : Gratuit
  - **Livraison à domicile** : +100 EGP
- Formulaire de commande
- Paiement Stripe

### Pour les Admins

#### 1. Vue d'Ensemble
- Statut de la boutique (ouverte/fermée)
- Statistiques en temps réel :
  - Nombre de commandes
  - Revenus totaux
  - Commandes en attente
  - Répartition des produits

#### 2. Gestion des Commandes
- Liste de toutes les commandes
- Filtres par statut :
  - En attente
  - Payées
  - En production
  - Prêtes
  - Livrées
- Détails de chaque commande
- Export Excel
- Mise à jour du statut

#### 3. Gestion des Périodes
- Créer une nouvelle période
- Ouvrir/fermer les pré-commandes
- Historique des périodes
- Statistiques par période

#### 4. Paramètres
- Modifier les prix des produits
- Modifier les frais de livraison
- Activer/désactiver des produits
- Gérer les options de livraison

---

## 🗂️ Structure Technique

### Collections Firestore

#### `shopSettings` (document unique : `main`)
```javascript
{
  currentPeriod: {
    id: string | null,
    isOpen: boolean,
    startDate: Timestamp,
    endDate: Timestamp,
    status: 'upcoming' | 'open' | 'closed' | 'production' | 'ready' | 'completed'
  },
  deliveryOptions: {
    pickup: boolean,
    shipping: boolean,
    shippingCost: number // EGP
  },
  products: {
    jersey: { price: 950, active: true },
    tshirt: { price: 750, active: true },
    sweatshirt: { price: 1100, active: true }
  },
  notificationEmails: string[]
}
```

#### `shopProducts`
```javascript
{
  id: string,
  type: 'jersey' | 'tshirt' | 'sweatshirt',
  name: string,
  nameAr: string,
  description: string,
  descriptionAr: string,
  price: number, // EGP
  customizable: boolean,
  sizes: string[],
  images: string[],
  active: boolean,
  mockupTemplate: string
}
```

#### `shopOrders`
```javascript
{
  id: string,
  periodId: string,
  userId: string (optionnel),
  userEmail: string,
  userName: string,
  userPhone: string,
  teamId: string,
  teamName: string,
  items: [
    {
      productId: string,
      productType: 'jersey' | 'tshirt' | 'sweatshirt',
      productName: string,
      size: string,
      customization: { name: string, number: number },
      price: number,
      quantity: number
    }
  ],
  subtotal: number,
  shippingCost: number,
  total: number,
  deliveryMethod: 'pickup' | 'shipping',
  shippingAddress: {
    fullName: string,
    phone: string,
    address: string,
    city: string,
    governorate: string
  },
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  paymentMethod: 'stripe',
  stripePaymentId: string,
  orderStatus: 'pending' | 'paid' | 'production' | 'ready' | 'delivered' | 'cancelled',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  deliveredAt: Timestamp,
  notes: string
}
```

#### `shopPeriods`
```javascript
{
  id: string,
  name: string,
  startDate: Timestamp,
  endDate: Timestamp,
  status: 'upcoming' | 'open' | 'closed' | 'production' | 'ready' | 'completed',
  totalOrders: number,
  totalRevenue: number,
  summary: {
    jerseys: number,
    tshirts: number,
    sweatshirts: number
  },
  createdAt: Timestamp
}
```

### API Routes

- `GET /api/shop/settings` - Récupérer les paramètres
- `PUT /api/shop/settings` - Mettre à jour les paramètres
- `GET /api/shop/products` - Liste des produits actifs
- `GET /api/shop/orders` - Liste des commandes (avec filtres)
- `POST /api/shop/orders` - Créer une commande
- `GET /api/shop/orders/[orderId]` - Détails d'une commande
- `PATCH /api/shop/orders/[orderId]` - Mettre à jour une commande
- `GET /api/shop/periods` - Liste des périodes
- `POST /api/shop/periods` - Créer une période
- `PATCH /api/shop/periods/[periodId]` - Mettre à jour une période

### Pages Frontend

#### Public
- `/public/shop` - Page principale
- `/public/shop/teams` - Sélection d'équipe
- `/public/shop/[teamId]` - Boutique d'une équipe
- `/public/shop/cart` - Panier
- `/public/shop/checkout` - Finalisation de commande
- `/public/shop/order/[orderId]` - Confirmation de commande

#### Admin
- `/admin` (onglet "Boutique") - Gestion complète

---

## 🚀 Workflow Complet

### Phase 1 : Préparation (Admin)
1. Admin crée une nouvelle période de pré-commandes
2. Admin définit les dates de début et fin
3. Admin vérifie les prix des produits
4. Admin ouvre la période

### Phase 2 : Commandes (2-3 semaines)
1. Clients visitent `/public/shop`
2. Clients choisissent leur équipe
3. Clients personnalisent leurs produits
4. Clients ajoutent au panier
5. Clients passent commande et paient
6. Email de confirmation envoyé
7. Admin voit les commandes en temps réel

### Phase 3 : Fermeture
1. Période se ferme automatiquement (ou manuellement)
2. Admin exporte la liste des commandes
3. Admin commande auprès du fournisseur
4. Admin marque la période en "production"

### Phase 4 : Production
1. Fournisseur produit les articles
2. Admin suit l'avancement
3. Admin marque la période en "ready" quand reçu

### Phase 5 : Distribution
1. Admin organise la distribution
2. Clients récupèrent sur place ou reçoivent par livraison
3. Admin marque les commandes comme "delivered"
4. Admin clôture la période

---

## ✅ Implémenté

- ✅ Structure de données Firestore
- ✅ Types TypeScript
- ✅ API routes (settings, products, orders, periods)
- ✅ Page principale boutique
- ✅ Sélection d'équipe
- ✅ Page boutique par équipe
- ✅ Panier
- ✅ Checkout
- ✅ Interface admin (vue d'ensemble, commandes, périodes, paramètres)
- ✅ Gestion des prix
- ✅ Système de statuts

---

## ⚠️ À Implémenter

### Priorité Haute

1. **Intégration Stripe**
   - Configuration Stripe
   - Création de Payment Intent
   - Webhook pour confirmation de paiement
   - Gestion des remboursements

2. **Mockup 3D**
   - Intégration d'une librairie 3D (Three.js, React Three Fiber)
   - Templates de produits
   - Affichage du logo d'équipe
   - Affichage du nom/numéro personnalisé

3. **Emails Automatiques**
   - Email de confirmation de commande
   - Email quand commande prête
   - Email de rappel pour retrait
   - Templates HTML

4. **Export Excel**
   - Export des commandes par période
   - Export par équipe
   - Export par produit (pour commander au fournisseur)
   - Colonnes personnalisables

### Priorité Moyenne

5. **Notifications**
   - Notification admin pour nouvelle commande
   - Notification client quand commande prête
   - Notification rappel de retrait

6. **Gestion Avancée des Commandes**
   - Modal de détails de commande
   - Modification de commande (avant production)
   - Annulation de commande
   - Remboursement

7. **Gestion des Périodes Avancée**
   - Planification automatique
   - Notifications avant ouverture/fermeture
   - Duplication de période
   - Statistiques détaillées

8. **Images des Produits**
   - Upload d'images réelles
   - Galerie de photos
   - Zoom sur images

### Priorité Basse

9. **Historique Client**
   - Page "Mes commandes" pour joueurs/coaches
   - Suivi de commande
   - Téléchargement de facture

10. **Analytics**
    - Produits les plus vendus
    - Équipes les plus actives
    - Revenus par période
    - Graphiques de tendances

11. **Codes Promo**
    - Création de codes promo
    - Réductions en pourcentage ou montant fixe
    - Limites d'utilisation
    - Codes par équipe

12. **Wishlist**
    - Ajouter aux favoris
    - Notification quand boutique ouvre

---

## 🔧 Configuration Requise

### Variables d'Environnement
```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase (déjà configuré)
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_ADMIN_PROJECT_ID=...
```

### Dépendances à Ajouter
```json
{
  "@stripe/stripe-js": "^2.0.0",
  "stripe": "^14.0.0"
}
```

---

## 📝 Notes Importantes

1. **Pas de stock** : Système de pré-commandes uniquement
2. **Pas de retours** : Politique stricte, bien communiquer
3. **Prix en EGP** : Toujours afficher avec "EGP"
4. **Personnalisation incluse** : Pas de frais supplémentaires
5. **Logos fixes** : Logo ComeBac + logo équipe non modifiables
6. **Validation** : Nom max 15 caractères, numéro 0-99

---

## 🎨 Design

- Utilise le même design system que le reste de l'app
- Mode sombre supporté
- Responsive (mobile-first)
- Animations Framer Motion
- Icônes Lucide React

---

## 🔐 Sécurité

### À Implémenter
- [ ] Authentification pour routes admin
- [ ] Validation des données côté serveur
- [ ] Rate limiting sur les commandes
- [ ] Vérification des paiements Stripe
- [ ] Protection CSRF

---

## 📊 Métriques de Succès

- Taux de conversion (visiteurs → commandes)
- Panier moyen
- Produit le plus vendu
- Équipe la plus active
- Revenus par période
- Taux d'abandon de panier

---

**Prochaines étapes** :
1. Intégrer Stripe pour les paiements
2. Implémenter le mockup 3D
3. Créer les emails automatiques
4. Tester le workflow complet
5. Ajouter l'export Excel

