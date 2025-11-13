# 🏆 Création Automatique des Comptes Entraîneurs

## ✅ Fonctionnalité Implémentée

Quand un admin valide une inscription d'équipe, le système crée automatiquement :
1. ✅ L'équipe dans Firestore
2. ✅ Les comptes joueurs avec emails
3. ✅ **Le compte entraîneur avec email** (NOUVEAU)

## 📋 Processus de Création

### 1. Inscription d'Équipe
- Le capitaine remplit le formulaire sur `/register-team`
- Il peut ajouter un entraîneur (optionnel)
- L'inscription est enregistrée avec statut "pending"

### 2. Validation par l'Admin
Quand l'admin approuve l'inscription :

**Pour les joueurs :**
- Création dans `players` collection
- Création dans `playerAccounts` collection
- Création du compte Firebase Auth
- Envoi d'email avec lien de création de mot de passe

**Pour l'entraîneur (si présent) :**
- ✅ Création dans `coachAccounts` collection
- ✅ Création du compte Firebase Auth
- ✅ Envoi d'email avec lien de création de mot de passe
- ✅ Email personnalisé pour entraîneur

### 3. Réception de l'Email

L'entraîneur reçoit un email avec :
- 🏆 Message de bienvenue personnalisé
- 📧 Son adresse email
- 🔐 Bouton "Créer mon mot de passe"
- ✅ Liste des fonctionnalités disponibles
- ⚠️ Lien valable 1 heure

## 🔐 Connexion de l'Entraîneur

### Première Connexion
1. L'entraîneur clique sur le lien dans l'email
2. Il crée son mot de passe
3. Il se connecte sur `/login`
4. Il est redirigé vers `/coach` (son espace entraîneur)

### Connexions Suivantes
1. Va sur `/login`
2. Entre son email et mot de passe
3. Accède directement à `/coach`

## 🎯 Fonctionnalités de l'Entraîneur

### Espace Entraîneur (`/coach`)
- ✅ Tableau de bord avec statistiques
- ✅ Gestion de l'équipe (statuts des joueurs)
- ✅ Création de compositions
- ✅ Validation des compositions
- ✅ Consultation des matchs
- ✅ Statistiques détaillées

### Basculer en Mode Utilisateur
- ✅ Bouton "Basculer sur Utilisateur" dans le menu
- ✅ Accès à l'interface publique (`/public`)
- ✅ Voir les classements, matchs, statistiques publiques

## 📊 Structure des Données

### Collection `coachAccounts`
```typescript
{
  email: string                 // Email de l'entraîneur
  firstName: string             // Prénom
  lastName: string              // Nom
  phone: string                 // Téléphone
  birthDate: string             // Date de naissance
  teamId: string                // ID de l'équipe
  teamName: string              // Nom de l'équipe
  photo: string                 // URL de la photo (vide par défaut)
  createdAt: Timestamp          // Date de création
  updatedAt: Timestamp          // Date de mise à jour
}
```

### Collection `teams`
```typescript
{
  name: string
  schoolName: string
  teamGrade: string
  coach: {                      // Infos de l'entraîneur
    firstName: string
    lastName: string
    birthDate: string
    email: string
    phone: string
  }
  captain: {                    // Infos du capitaine
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  createdAt: Timestamp
}
```

## 🔧 API Créée

### `/api/admin/create-coach-account`

**Méthode:** POST

**Body:**
```json
{
  "email": "coach@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "teamName": "Les Aigles"
}
```

**Fonctionnement:**
1. Vérifie si l'utilisateur existe dans Firebase Auth
2. Crée l'utilisateur si nécessaire
3. Génère un lien de réinitialisation de mot de passe
4. Envoie l'email de bienvenue avec le lien
5. Retourne le résultat

**Réponse:**
```json
{
  "success": true,
  "message": "Compte entraîneur créé avec succès",
  "email": "coach@example.com"
}
```

## 📧 Email de Bienvenue

### Contenu
- **Sujet:** 🏆 Bienvenue Coach - Votre compte ComeBac League
- **Design:** Dégradé orange/rouge (couleurs entraîneur)
- **Sections:**
  1. Message de bienvenue personnalisé
  2. Email de connexion
  3. Instructions étape par étape
  4. Bouton "Créer mon mot de passe"
  5. Avertissement (lien valable 1h)
  6. Liste des fonctionnalités
  7. Contact support

### Template
- Design moderne avec dégradés
- Responsive (mobile et desktop)
- Bouton CTA bien visible
- Informations importantes en surbrillance
- Footer avec informations légales

## 🔄 Flux Complet

```
1. Inscription d'équipe
   └─> Formulaire avec entraîneur (optionnel)
   └─> Sauvegarde dans teamRegistrations

2. Admin valide l'inscription
   └─> Création de l'équipe
   └─> Création des joueurs
   └─> Création des comptes joueurs
   └─> Envoi emails joueurs
   └─> SI entraîneur présent:
       ├─> Création dans coachAccounts
       ├─> Création compte Firebase Auth
       ├─> Génération lien mot de passe
       └─> Envoi email entraîneur

3. Entraîneur reçoit l'email
   └─> Clique sur "Créer mon mot de passe"
   └─> Définit son mot de passe
   └─> Se connecte

4. Première connexion
   └─> Redirection vers /coach
   └─> Accès à son espace entraîneur
   └─> Peut gérer son équipe
```

## 🎨 Interface Entraîneur

### Navigation
- **Desktop:** Sidebar fixe à gauche
- **Mobile:** Bottom navigation + drawer

### Menu Principal
- 🏠 Tableau de bord
- 👥 Mon Équipe
- 📋 Compositions
- 📅 Matchs
- 📊 Statistiques
- 🔔 Notifications

### Actions Disponibles
- ✅ Changer statut des joueurs
- ✅ Créer compositions
- ✅ Valider compositions
- ✅ Voir statistiques
- ✅ Basculer en mode utilisateur
- ✅ Se déconnecter

## 🔐 Sécurité

### Permissions
- L'entraîneur ne peut gérer que son équipe
- Vérification du `teamId` dans toutes les requêtes
- Pas d'accès aux autres équipes
- Pas d'accès à l'interface admin

### Authentification
- Compte Firebase Auth requis
- Email vérifié (via lien de création de mot de passe)
- Session sécurisée
- Déconnexion automatique après inactivité

## 🚀 Avantages

### Pour l'Entraîneur
- ✅ Compte créé automatiquement
- ✅ Email de bienvenue professionnel
- ✅ Accès immédiat après création du mot de passe
- ✅ Interface dédiée et intuitive
- ✅ Peut basculer en mode utilisateur

### Pour l'Admin
- ✅ Pas de création manuelle de comptes
- ✅ Tout automatisé lors de la validation
- ✅ Moins d'erreurs
- ✅ Gain de temps considérable

### Pour le Système
- ✅ Cohérence des données
- ✅ Traçabilité complète
- ✅ Emails professionnels
- ✅ Processus standardisé

## 📝 Notes Importantes

1. **Email requis:** L'entraîneur doit avoir un email valide
2. **Lien temporaire:** Le lien de création de mot de passe expire après 1h
3. **Mot de passe oublié:** L'entraîneur peut toujours utiliser "Mot de passe oublié"
4. **Basculer en mode user:** Accessible via le bouton dans le menu
5. **Impersonation admin:** L'admin peut se faire passer pour l'entraîneur

## 🔗 URLs

- Inscription équipe : http://localhost:3000/register-team
- Validation admin : http://localhost:3000/admin/team-registrations
- Connexion : http://localhost:3000/login
- Espace entraîneur : http://localhost:3000/coach
- Mode utilisateur : http://localhost:3000/public

## ✅ Résultat Final

**L'entraîneur a maintenant :**
1. ✅ Un compte créé automatiquement lors de la validation
2. ✅ Un email de bienvenue avec lien de création de mot de passe
3. ✅ Accès à son espace entraîneur dédié
4. ✅ Toutes les fonctionnalités de gestion d'équipe
5. ✅ Possibilité de basculer en mode utilisateur
6. ✅ Même expérience que les joueurs pour la création du compte

**Le système est complet et automatisé ! 🎉**
