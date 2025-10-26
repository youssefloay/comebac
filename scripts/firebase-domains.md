# 🔥 Configuration des Domaines Firebase

## Domaines à ajouter dans Firebase Console

### 1. Aller dans Firebase Console
- [Firebase Console](https://console.firebase.google.com/)
- Sélectionner votre projet
- **Authentication** → **Settings** → **Authorized domains**

### 2. Ajouter ces domaines :

#### Développement local
```
localhost
127.0.0.1
```

#### Vercel (Production)
```
*.vercel.app
comebac.vercel.app
comebac-git-main-youssefloay.vercel.app
```

#### Domaines personnalisés (si applicable)
```
votre-domaine.com
www.votre-domaine.com
```

## 3. Variables d'environnement Vercel

Assure-toi que ces variables sont configurées dans Vercel :

### Dans Vercel Dashboard → Settings → Environment Variables :

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 4. Vérification

Une fois les domaines ajoutés :
1. Redéployer sur Vercel
2. Tester la connexion sur le domaine de production
3. Vérifier que l'authentification fonctionne

## 5. Domaines Vercel typiques

Vercel génère automatiquement ces URLs :
- `https://ton-projet.vercel.app` (production)
- `https://ton-projet-git-main-username.vercel.app` (branch main)
- `https://ton-projet-hash.vercel.app` (preview deployments)

**Ajoute `*.vercel.app` pour couvrir tous les cas !**