# Security Review – ComeBac League

**Dernière mise à jour** : Janvier 2025  
**Statut global** : ⚠️ **Vulnérabilités critiques non corrigées**

---

## 🔴 Critical Missing Authentication

### Statut : ❌ **NON CORRIGÉ**

**Routes affectées :**
- `app/api/admin/create-coach-account/route.ts:21`
- `app/api/admin/update-player-email/route.ts:6`
- `app/api/admin/delete-account/route.ts:6`
- `app/api/admin/reset-database/route.ts:1`
- `app/api/admin/manage-account/route.ts:20`
- Et potentiellement d'autres routes admin

**Problème :**
Aucune de ces routes admin ne vérifie que l'appelant est authentifié ou autorisé. N'importe quel utilisateur non authentifié peut :
- Créer des comptes coach
- Réécrire les emails des joueurs
- Supprimer des comptes
- Vider des collections Firestore

**Solution requise :**
Créer un middleware d'authentification pour toutes les routes admin qui :
1. Vérifie le token Firebase ID via `adminAuth.verifyIdToken()`
2. Vérifie que le rôle de l'utilisateur est `admin` dans `userProfiles` ou `coachAccounts`
3. Rejette les requêtes non authentifiées ou non autorisées

**Exemple de correction :**
```typescript
// Créer lib/auth-middleware.ts
export async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.split('Bearer ')[1]
  
  if (!token) {
    throw new Error('Non authentifié')
  }
  
  const decodedToken = await adminAuth.verifyIdToken(token)
  const userProfile = await getUserProfile(decodedToken.uid)
  
  if (userProfile?.role !== 'admin') {
    throw new Error('Accès refusé - Admin requis')
  }
  
  return decodedToken
}
```

**Note :** La route `/api/coach/send-notification/route.ts` implémente correctement la vérification du token, mais uniquement pour vérifier le rôle coach, pas admin.

---

## 🔴 Profile Photo Upload Tampering

### Statut : ❌ **NON CORRIGÉ**

**Routes affectées :**
- `app/api/profile/upload-photo/route.ts:1`
- `app/api/profile/upload-photo-client/route.ts:1`

**Problème :**
Les deux endpoints acceptent `userId`/`userType` et mettent à jour aveuglément les documents correspondants, permettant à n'importe qui de :
- Remplacer la photo de profil d'un autre joueur ou coach
- Accéder à Storage/Firestore sans vérifier l'identité du requérant

**Solution requise :**
1. Exiger un token ID valide dans le header `Authorization`
2. Vérifier que le `uid` du token correspond au `userId` fourni (sauf si l'appelant est admin)
3. Rejeter les appels non authentifiés

**Exemple de correction :**
```typescript
// Dans upload-photo-client/route.ts
const authHeader = request.headers.get('authorization')
const token = authHeader?.split('Bearer ')[1]

if (!token) {
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
}

const decodedToken = await adminAuth.verifyIdToken(token)

// Vérifier que l'utilisateur modifie son propre profil (sauf admin)
if (decodedToken.uid !== userId) {
  // Vérifier si admin
  const userProfile = await getUserProfile(decodedToken.uid)
  if (userProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
}
```

**Note :** La route `/api/profile/update/route.ts` vérifie l'existence de l'utilisateur mais ne vérifie pas que l'utilisateur modifie son propre profil.

---

## 🟡 Email Normalization Bugs in Sign-up

### Statut : ⚠️ **PARTIELLEMENT CORRIGÉ**

**Fichier affecté :**
- `lib/auth-context.tsx:322-407`

**Problème :**
Les adresses email sont converties en minuscules dans `normalizedEmail`, mais toutes les requêtes Firestore utilisent encore `sanitizedEmail` (qui est juste `trim()`). Comme les filtres Firestore sont sensibles à la casse, `Foo@Bar.com` peut s'inscrire à nouveau comme `foo@bar.com`, contournant les vérifications de doublons et permettant plusieurs comptes par email.

**Code actuel :**
```typescript
const sanitizedEmail = email.trim()
const normalizedEmail = sanitizedEmail.toLowerCase()

// ❌ Utilise sanitizedEmail au lieu de normalizedEmail
const playerAccountsQuery = query(
  collection(db, 'playerAccounts'),
  where('email', '==', sanitizedEmail)  // Devrait être normalizedEmail
)
```

**Solution requise :**
1. Utiliser `normalizedEmail` pour toutes les requêtes Firestore
2. Stocker `normalizedEmail` dans tous les documents Firestore
3. S'assurer que tous les emails sont normalisés lors de la création/lecture

**Note :** Certaines routes admin (comme `create-coach-account/route.ts:32`) utilisent déjà `normalizedEmail`, mais la cohérence n'est pas garantie dans tout le codebase.

---

## 🟢 Coach Pre-Provisioning Flow Breaks Registration

### Statut : ✅ **CORRIGÉ**

**Fichier affecté :**
- `lib/auth-context.tsx:390-402`

**Problème original :**
Le chemin d'inscription lançait toujours une erreur quand l'email existait dans `coachAccounts`, empêchant les coaches invités via l'outil admin (documents sans `uid`) de terminer l'inscription en libre-service.

**Correction :**
Le code gère maintenant le cas où un compte coach existe mais sans `uid` ou avec un `uid` différent :
```typescript
} else if (!coachAccountsSnap.empty) {
  // Si l'email existe dans coachAccounts (même sans uid), mettre à jour avec l'UID
  const coachDoc = coachAccountsSnap.docs[0]
  const coachData = coachDoc.data()
  
  // Mettre à jour le coachAccount avec l'UID si manquant
  if (!coachData.uid || coachData.uid !== uid) {
    await updateDoc(coachDoc.ref, {
      uid: uid,
      updatedAt: serverTimestamp()
    })
  }
}
```

**Statut :** ✅ Fonctionnalité corrigée et opérationnelle.

---

## 🟡 Oversized Base64 Avatars in Firestore

### Statut : ⚠️ **PARTIELLEMENT CORRIGÉ**

**Fichier affecté :**
- `app/api/profile/upload-photo-client/route.ts:35-112`

**Problème :**
Les images sont stockées comme chaînes `data:image/jpeg;base64,...` dans les documents Firestore. Même avec une limite brute de 900 KB, l'inflation base64 pousse de nombreux uploads au-delà de la limite de 1 MB de Firestore, causant des échecs intermittents.

**Correction partielle :**
- Limite de 900 KB ajoutée (ligne 50)
- Vérification de la taille avant encodage base64
- Message d'erreur informatif si l'image est trop grande

**Problème restant :**
- Le stockage base64 dans Firestore reste problématique
- La route `/api/profile/upload-photo/route.ts` utilise Firebase Storage (meilleure solution) mais n'est pas utilisée par défaut côté client

**Solution recommandée :**
1. Migrer complètement vers Firebase Storage (comme dans `upload-photo/route.ts`)
2. Stocker uniquement l'URL de téléchargement dans Firestore
3. Ou réduire la limite brute à ~700 KB avant encodage pour garantir < 1 MB après base64

---

## 📊 Résumé des Vulnérabilités

| Vulnérabilité | Priorité | Statut | Impact |
|--------------|----------|-------|--------|
| Missing Authentication (Admin Routes) | 🔴 Critique | ❌ Non corrigé | Élevé - Accès non autorisé aux fonctions admin |
| Profile Photo Upload Tampering | 🔴 Critique | ❌ Non corrigé | Élevé - Modification non autorisée de profils |
| Email Normalization Bugs | 🟡 Moyen | ⚠️ Partiel | Moyen - Comptes dupliqués possibles |
| Coach Pre-Provisioning Flow | 🟢 Faible | ✅ Corrigé | Résolu |
| Oversized Base64 Avatars | 🟡 Moyen | ⚠️ Partiel | Faible - Échecs intermittents |

---

## 🎯 Recommandations Prioritaires

### 1. **URGENT** - Implémenter l'authentification pour toutes les routes admin
- Créer un middleware `requireAdmin()` réutilisable
- Appliquer à toutes les routes `/api/admin/*`
- Tester avec des tokens valides/invalides

### 2. **URGENT** - Sécuriser les uploads de photos
- Ajouter vérification du token dans `upload-photo-client/route.ts`
- Vérifier que l'utilisateur modifie son propre profil
- Permettre aux admins de modifier n'importe quel profil

### 3. **IMPORTANT** - Corriger la normalisation des emails
- Utiliser `normalizedEmail` partout dans `auth-context.tsx`
- Auditer toutes les autres routes pour s'assurer de la cohérence
- Migrer les emails existants vers format normalisé

### 4. **MOYEN** - Migrer vers Firebase Storage pour les photos
- Utiliser uniquement `/api/profile/upload-photo/route.ts` (qui utilise Storage)
- Déprécier `/api/profile/upload-photo-client/route.ts` (base64)
- Migrer les photos existantes si nécessaire

---

## 🔍 Vérification Continue

Pour vérifier que les corrections sont en place :

1. **Test d'authentification admin :**
   ```bash
   # Devrait échouer sans token
   curl -X POST http://localhost:3000/api/admin/create-coach-account \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","firstName":"Test","lastName":"User"}'
   ```

2. **Test d'upload photo :**
   ```bash
   # Devrait échouer sans token ou avec token d'un autre utilisateur
   curl -X POST http://localhost:3000/api/profile/upload-photo-client \
     -F "file=@photo.jpg" \
     -F "userId=OTHER_USER_ID" \
     -F "userType=player"
   ```

3. **Test de normalisation email :**
   - Essayer de s'inscrire avec `Test@Example.com` puis `test@example.com`
   - Vérifier qu'un seul compte est créé

---

**Note :** Cet audit doit être mis à jour régulièrement au fur et à mesure que les vulnérabilités sont corrigées.
