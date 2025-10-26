# 🔥 Configuration Firebase - Guide Rapide

## ❌ Erreur: `auth/unauthorized-domain`

Cette erreur survient quand le domaine actuel n'est pas autorisé dans Firebase Auth.

## ✅ Solution Rapide

### 1. **Aller dans Firebase Console**
```
https://console.firebase.google.com/
```

### 2. **Navigation**
1. Sélectionner votre projet
2. **Authentication** (dans le menu gauche)
3. **Settings** (onglet en haut)
4. **Authorized domains** (section)

### 3. **Ajouter ces domaines**

#### Pour Vercel (recommandé) :
```
*.vercel.app
```

#### Ou spécifiquement :
```
localhost
127.0.0.1
votre-app.vercel.app
votre-app-git-main-username.vercel.app
```

### 4. **Domaines Vercel typiques**
Vercel génère automatiquement :
- `https://comebac.vercel.app` (production)
- `https://comebac-git-main-youssefloay.vercel.app` (branch)
- `https://comebac-abc123.vercel.app` (preview)

## 🚀 **Configuration Automatique**

### Variables d'environnement Vercel
Dans **Vercel Dashboard → Settings → Environment Variables** :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🔍 **Vérification**

1. **Ajouter les domaines** dans Firebase Console
2. **Redéployer** sur Vercel (si nécessaire)
3. **Tester** l'authentification sur le domaine de production

## 📱 **Interface d'Erreur**

L'application affiche maintenant automatiquement :
- Le domaine actuel qui pose problème
- Instructions pour résoudre l'erreur
- Lien direct vers Firebase Console
- Bouton pour copier le domaine

---

**Note :** Ajouter `*.vercel.app` couvre tous les domaines Vercel automatiquement ! 🎯