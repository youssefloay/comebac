# 🧪 Guide de Test - Boutique ComeBac

## 🚀 Démarrage

### 1. Redémarrer le serveur
```bash
npm run dev
```

Le serveur doit être redémarré pour que le nouvel onglet "Boutique" apparaisse dans l'admin.

---

## 🎨 Mockup 3D Implémenté

J'ai créé un système de mockup 3D en Canvas qui affiche :

### Maillot (Jersey)
- Couleur : Bleu dégradé
- Logo "COMEBAC" en haut à gauche
- Nom de l'équipe en haut à droite
- **Personnalisation en temps réel** :
  - Nom du joueur au centre
  - Numéro en grand en bas
- Manches et col
- Rayures décoratives

### T-Shirt
- Couleur : Vert dégradé
- Logo "COMEBAC" au centre
- Nom de l'équipe en dessous
- Texte "LEAGUE"
- Manches courtes

### Sweatshirt
- Couleur : Violet dégradé
- Capuche
- Logo "COMEBAC" au centre
- Nom de l'équipe
- Poche kangourou
- Manches longues
- Cordons

---

## 📋 Étapes de Test

### Étape 1 : Accéder à l'Admin

1. Aller sur `http://localhost:3000/admin`
2. Se connecter avec un compte admin
3. **Vérifier que l'onglet "Boutique 🛍️" apparaît** dans la liste des onglets
4. Cliquer sur "Boutique"

### Étape 2 : Créer une Période de Pré-commandes

1. Dans l'admin, aller dans l'onglet "Boutique"
2. Cliquer sur "Périodes"
3. Cliquer sur "Créer une période"
4. Remplir :
   - Nom : "Janvier 2025"
   - Date de début : Aujourd'hui
   - Date de fin : Dans 2 semaines
5. Ouvrir la période (changer le statut à "open")

### Étape 3 : Tester la Boutique Publique

1. Aller sur `http://localhost:3000/public/shop`
2. **Vérifier** :
   - ✅ Message "Pré-commandes ouvertes !"
   - ✅ Compte à rebours visible
   - ✅ 3 cartes de produits avec mockups 3D
   - ✅ Prix affichés en EGP

### Étape 4 : Sélectionner une Équipe

1. Cliquer sur "Choisir mon équipe et commander"
2. **Vérifier** :
   - ✅ Liste de toutes les équipes
   - ✅ Logos des équipes
   - ✅ Barre de recherche fonctionne
3. Cliquer sur une équipe

### Étape 5 : Personnaliser un Produit

1. Sur la page de l'équipe, **vérifier** :
   - ✅ Mockups 3D des 3 produits avec le nom de l'équipe
   - ✅ Prix en EGP
   - ✅ Bouton panier en haut à droite
2. Cliquer sur "Personnaliser et commander" sur le Maillot
3. Dans le modal :
   - ✅ **Mockup 3D en temps réel** qui se met à jour
   - Sélectionner une taille (ex: M)
   - Entrer un nom (ex: DUPONT)
   - Entrer un numéro (ex: 10)
   - **Vérifier que le mockup se met à jour en temps réel**
4. Cliquer sur "Ajouter au panier"

### Étape 6 : Tester le Panier

1. Cliquer sur l'icône panier (badge avec le nombre d'articles)
2. **Vérifier** :
   - ✅ Article ajouté visible
   - ✅ Nom et numéro personnalisés affichés
   - ✅ Prix correct
   - ✅ Boutons +/- pour quantité
   - ✅ Bouton supprimer
   - ✅ Sous-total calculé
3. Ajouter d'autres produits si souhaité

### Étape 7 : Checkout

1. Cliquer sur "Passer la commande"
2. **Vérifier** :
   - ✅ Formulaire d'informations client
   - ✅ Choix de livraison :
     - Retrait sur place (Gratuit)
     - Livraison à domicile (+100 EGP)
   - ✅ Formulaire d'adresse si livraison sélectionnée
   - ✅ Récapitulatif avec calcul correct
3. Remplir le formulaire
4. Cliquer sur "Procéder au paiement"
5. **Note** : Le paiement Stripe n'est pas encore implémenté, mais la commande est créée

### Étape 8 : Vérifier dans l'Admin

1. Retourner dans Admin > Boutique
2. Aller dans "Commandes"
3. **Vérifier** :
   - ✅ Nouvelle commande visible
   - ✅ Détails corrects (client, équipe, produits, total)
   - ✅ Statut "En attente"
   - ✅ Filtres fonctionnent
4. Aller dans "Vue d'ensemble"
5. **Vérifier** :
   - ✅ Statistiques mises à jour
   - ✅ Nombre de commandes
   - ✅ Revenus totaux
   - ✅ Répartition des produits

### Étape 9 : Modifier les Prix

1. Dans Admin > Boutique > Paramètres
2. Modifier les prix (ex: Maillot à 1000 EGP)
3. Cliquer sur "Sauvegarder"
4. Retourner sur `/public/shop`
5. **Vérifier** que les nouveaux prix sont affichés

---

## 🎯 Points à Vérifier Spécifiquement

### Mockup 3D
- [ ] Les mockups s'affichent correctement sur la page principale
- [ ] Les mockups s'affichent sur la page de l'équipe
- [ ] Le mockup dans le modal de personnalisation se met à jour en temps réel
- [ ] Le nom de l'équipe apparaît sur chaque mockup
- [ ] Pour les maillots, le nom et numéro personnalisés s'affichent
- [ ] Les couleurs sont différentes pour chaque type de produit
- [ ] La taille sélectionnée est affichée

### Noms d'Équipes
- [ ] Les vrais noms d'équipes de la base de données sont utilisés
- [ ] Les logos d'équipes s'affichent dans la sélection
- [ ] Le nom de l'équipe apparaît sur les mockups

### Responsive
- [ ] Tester sur mobile (les mockups doivent s'adapter)
- [ ] Le panier est accessible sur mobile
- [ ] Le modal de personnalisation est scrollable sur mobile

### Mode Sombre
- [ ] Tester en mode sombre
- [ ] Les mockups restent visibles
- [ ] Les textes sont lisibles

---

## 🐛 Problèmes Connus

### Si l'onglet Boutique n'apparaît pas
1. Vérifier que le serveur a été redémarré
2. Vider le cache du navigateur (Cmd+Shift+R ou Ctrl+Shift+R)
3. Vérifier la console pour des erreurs

### Si les mockups ne s'affichent pas
1. Ouvrir la console du navigateur (F12)
2. Vérifier s'il y a des erreurs Canvas
3. Vérifier que le composant ProductMockup3D est bien importé

### Si les équipes ne s'affichent pas
1. Vérifier que des équipes existent dans Firestore
2. Vérifier l'API `/api/teams` dans la console Network

---

## 📸 Captures d'Écran Attendues

### Page Principale
- 3 cartes de produits avec mockups 3D colorés
- Compte à rebours visible
- Bouton "Choisir mon équipe"

### Sélection d'Équipe
- Grille d'équipes avec logos
- Barre de recherche en haut

### Page Équipe
- 3 mockups 3D avec le nom de l'équipe
- Bouton panier avec badge

### Modal de Personnalisation
- Grand mockup 3D qui se met à jour en temps réel
- Champs nom et numéro
- Sélection de taille

### Admin - Vue d'Ensemble
- 4 cartes de statistiques
- Statut de la boutique (ouvert/fermé)
- Répartition des produits

---

## ✅ Checklist Complète

- [ ] Serveur redémarré
- [ ] Onglet Boutique visible dans l'admin
- [ ] Période créée et ouverte
- [ ] Page principale affiche les mockups
- [ ] Sélection d'équipe fonctionne
- [ ] Mockups affichent le nom de l'équipe
- [ ] Personnalisation en temps réel fonctionne
- [ ] Panier fonctionne
- [ ] Checkout fonctionne
- [ ] Commande créée visible dans l'admin
- [ ] Statistiques mises à jour
- [ ] Modification des prix fonctionne
- [ ] Responsive OK
- [ ] Mode sombre OK

---

## 🎨 Personnalisation Future

Pour améliorer les mockups 3D :
1. Ajouter les vrais logos d'équipes sur les mockups
2. Utiliser Three.js pour un vrai rendu 3D rotatif
3. Ajouter des textures réalistes
4. Permettre de changer les couleurs
5. Ajouter des animations

---

**Bon test ! 🚀**

Si tu rencontres un problème, vérifie d'abord la console du navigateur (F12) pour voir les erreurs.
