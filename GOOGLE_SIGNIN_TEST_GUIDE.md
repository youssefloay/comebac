# 🧪 Guide de Test - Connexion Google avec Profil

## 🎯 Objectif
Vérifier que la connexion Google force bien la complétion du profil (username + nom complet).

## 📋 Scénarios de Test

### **Test 1: Nouveau Utilisateur Google**
1. **Aller sur** `/login`
2. **Cliquer** "Continuer avec Google"
3. **Se connecter** avec un compte Google jamais utilisé
4. **Vérifier** : Redirection vers page de complétion profil
5. **Compléter** username + nom complet
6. **Vérifier** : Redirection vers `/public`

### **Test 2: Utilisateur Google Existant**
1. **Aller sur** `/login`
2. **Se connecter** avec un compte Google déjà utilisé
3. **Vérifier** : Redirection directe vers `/public` (pas de complétion)
4. **Vérifier** : Nom complet + username affichés dans navigation

### **Test 3: Inscription Email puis Google**
1. **Créer compte** avec email/mot de passe
2. **Compléter** le profil
3. **Se déconnecter**
4. **Se reconnecter** avec Google (même email)
5. **Vérifier** : Comportement selon si même email ou différent

## 🔍 Points de Vérification

### **Console Logs**
Ouvrir la console (F12) pour voir :
```
Loading profile for user: [uid]
Profile found: true/false
Current path: /login Profile exists: true/false
User needs to complete profile, staying on login page
```

### **Interface Utilisateur**
- **Page de complétion** : Design SofaScore avec validation temps réel
- **Navigation** : Affichage "Nom Complet" + "@username"
- **Menu utilisateur** : Profil complet avec rôle

### **Base de Données**
Vérifier dans Firestore :
- **Collection** : `userProfiles`
- **Document** : Un par utilisateur avec uid, email, username, fullName

## 🐛 Problèmes Potentiels

### **Redirection Immédiate**
**Symptôme** : Google Sign-In redirige directement vers `/public`
**Cause** : Profil chargé trop lentement
**Solution** : Vérifier les logs console

### **Profil Non Sauvegardé**
**Symptôme** : Complétion profil mais pas de sauvegarde
**Cause** : Erreur Firestore ou validation
**Solution** : Vérifier console pour erreurs

### **Username Déjà Pris**
**Symptôme** : Erreur lors de la création
**Cause** : Collision de username
**Solution** : Choisir un username différent

## 🔧 Debug

### **Logs à Surveiller**
```javascript
// Dans la console navigateur
Loading profile for user: abc123
Profile found: false
Current path: /login Profile exists: false
User needs to complete profile, staying on login page
```

### **Firestore Rules**
Vérifier que les règles permettent :
- **Lecture** : `userProfiles` par uid
- **Écriture** : `userProfiles` par uid authentifié
- **Validation** : username unique

### **Étapes de Debug**
1. **Console** : Vérifier les logs d'authentification
2. **Network** : Vérifier les requêtes Firestore
3. **Firestore** : Vérifier la création des documents
4. **Interface** : Vérifier l'affichage conditionnel

## ✅ Résultat Attendu

### **Nouveau Utilisateur Google**
1. **Connexion Google** → Page complétion profil
2. **Saisie données** → Validation temps réel
3. **Soumission** → Création profil Firestore
4. **Redirection** → `/public` avec profil affiché

### **Utilisateur Existant**
1. **Connexion Google** → Chargement profil
2. **Profil trouvé** → Redirection directe `/public`
3. **Interface** → Nom complet + username affichés

---

**Note** : Si le test échoue, vérifier les logs console et la configuration Firebase ! 🔍