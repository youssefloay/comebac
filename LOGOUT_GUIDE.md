# 🚪 Guide de Déconnexion - Ligue Scolaire

## 📍 Où trouver le bouton de déconnexion ?

### 🌐 **Interface Publique** (`/public/*`)

#### **1. Navigation Principale (Desktop)**
- **Localisation :** En haut à droite de la page
- **Apparence :** Avatar utilisateur avec menu déroulant
- **Actions :**
  1. Cliquer sur l'avatar utilisateur (cercle vert avec icône)
  2. Le menu s'ouvre avec les options :
     - Email de l'utilisateur
     - "Tableau de bord Admin" (si admin)
     - **"Se déconnecter"** (bouton rouge)

#### **2. Bouton Flottant (Mobile & Desktop)**
- **Localisation :** Coin inférieur droit de l'écran
- **Apparence :** Bouton rond vert flottant avec icône utilisateur
- **Actions :**
  1. Cliquer sur le bouton flottant
  2. Menu contextuel s'ouvre avec :
     - "Accueil"
     - "Admin" (si admin)
     - **"Se déconnecter"** (bouton rouge)

### 🔧 **Interface Admin** (`/admin`)

#### **Sidebar de l'Admin**
- **Localisation :** Panneau latéral gauche
- **Apparence :** Bouton rouge avec icône de déconnexion
- **Actions :**
  1. Directement visible dans la sidebar
  2. Cliquer sur **"Déconnexion"** (icône + texte rouge)

## 🎨 **Design & Fonctionnalités**

### **Styles SofaScore**
- **Thème sombre** avec accents verts
- **Animations fluides** au survol et clic
- **Menus contextuels** avec backdrop blur
- **Responsive design** pour mobile et desktop

### **Fonctionnalités**
- **Fermeture automatique** des menus en cliquant à l'extérieur
- **Animations** d'ouverture/fermeture
- **Indicateurs visuels** pour admin vs utilisateur
- **Accès rapide** aux fonctions principales

## 🔐 **Comptes de Test**

### **Admin**
- **Email :** `admin@admin.com`
- **Mot de passe :** `Youssef`
- **Accès :** Interface admin + interface publique

### **Utilisateur Standard**
- Créer un compte via `/login` → "Créer un compte"
- **Accès :** Interface publique uniquement

## 🚀 **Navigation Rapide**

1. **Se connecter :** `/login`
2. **Interface publique :** `/public`
3. **Interface admin :** `/admin` (admin uniquement)
4. **Équipes :** `/public/teams`
5. **Classement :** `/public/ranking`
6. **Statistiques :** `/public/statistics`

---

✅ **Le bouton de déconnexion est maintenant disponible partout dans l'interface !**