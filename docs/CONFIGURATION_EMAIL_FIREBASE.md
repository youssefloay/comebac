# Configuration Email Firebase - Problème noreply@comebac.com

## 🔴 Problème

Firebase utilise automatiquement `noreply@comebac.com` comme expéditeur pour les emails de réinitialisation de mot de passe, mais vous n'avez que `contact@comebac.com` configuré sur Ionos.

## ✅ Solutions

### Solution 1: Créer un alias email sur Ionos (Recommandé)

**C'est la solution la plus simple et rapide !**

1. Connectez-vous à votre compte Ionos
2. Allez dans la gestion des emails
3. Créez un **alias email** `noreply@comebac.com` qui redirige vers `contact@comebac.com`
4. Ou créez une boîte email `noreply@comebac.com` (gratuite si vous avez des quotas disponibles)

**Avantages:**
- ✅ Aucun changement de code nécessaire
- ✅ Firebase continuera de fonctionner normalement
- ✅ Vous recevrez les emails de réinitialisation sur contact@comebac.com

### Solution 2: Configurer Firebase pour utiliser un domaine personnalisé

Si vous voulez que Firebase utilise `contact@comebac.com` directement:

1. **Dans Firebase Console:**
   - Allez dans Authentication → Settings → Templates
   - Configurez un template d'email personnalisé
   - Mais Firebase utilisera toujours noreply@votre-domaine.com pour l'expéditeur

2. **Utiliser uniquement Resend (Solution actuelle)**

Votre code utilise déjà Resend pour la plupart des emails. Pour les emails de réinitialisation Firebase, vous pouvez:

- Désactiver les emails automatiques de Firebase
- Utiliser uniquement vos emails personnalisés via Resend

### Solution 3: Utiliser uniquement Resend pour tous les emails

Modifier le code pour que tous les emails passent par Resend au lieu de Firebase:

1. Désactiver les emails Firebase dans la console
2. Utiliser uniquement `sendEmail()` de Resend avec `contact@comebac.com`

## 📧 Configuration Actuelle

Votre configuration actuelle dans `.env.local`:

```env
EMAIL_FROM=ComeBac League <contact@comebac.com>
RESEND_API_KEY=votre_cle
```

## 🔧 Solution Rapide (Recommandée)

**Créer l'alias sur Ionos:**

1. Ionos → Email → Gestion des emails
2. Créer alias: `noreply@comebac.com` → redirige vers `contact@comebac.com`
3. C'est tout ! Firebase pourra envoyer les emails et vous les recevrez sur contact@comebac.com

## ⚠️ Note Importante

Les emails de réinitialisation Firebase sont envoyés directement par Firebase, pas par votre code Resend. C'est pourquoi ils utilisent `noreply@comebac.com`.

Si vous créez l'alias, les emails arriveront bien dans votre boîte contact@comebac.com.

---

**Dernière mise à jour**: 2025-01-XX

