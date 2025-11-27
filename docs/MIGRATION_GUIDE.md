# Guide de Migration vers la Nouvelle Architecture

## 📋 Prérequis

1. ✅ Avoir fait une **sauvegarde complète** de la base de données
2. ✅ Avoir testé en environnement de développement
3. ✅ Avoir lu et compris la nouvelle architecture (`docs/NEW_ARCHITECTURE.md`)
4. ✅ Avoir un accès admin à Firebase

## 🚀 Étapes de Migration

### Étape 1: Sauvegarde Complète

**CRITIQUE**: Ne pas sauter cette étape!

```bash
# Option 1: Utiliser le script de backup existant
npx tsx scripts/backup-firestore.ts

# Option 2: Utiliser l'API de backup
curl -X POST http://localhost:3000/api/admin/backup
```

Vérifiez que le backup a été créé dans le dossier `backups/`.

### Étape 2: Vérifier l'État Actuel

```bash
# Analyser les duplications
npx tsx scripts/analyze-db-duplications.ts

# Analyser les optimisations possibles
npx tsx scripts/analyze-db-optimizations.ts
```

Notez les résultats pour comparer après la migration.

### Étape 3: Exécuter la Migration

```bash
# Lancer le script de migration
npx tsx scripts/migrate-to-new-architecture.ts
```

Le script va:
1. ⏱️ Attendre 10 secondes (vous pouvez annuler avec Ctrl+C)
2. 📋 Créer la collection `accounts` (fusion users + userProfiles)
3. 🔄 Enrichir avec les données de `playerAccounts`
4. 🔄 Enrichir avec les données de `coachAccounts`
5. 📊 Créer la collection `playerStats` (statistiques uniquement)

**Durée estimée**: 5-15 minutes selon la taille de la base de données

### Étape 4: Vérifier la Migration

```bash
# Vérifier l'intégrité des données
npx tsx scripts/verify-migration.ts
```

Vérifiez que:
- ✅ Tous les `playerAccounts` ont un `account` correspondant
- ✅ Tous les `coachAccounts` ont un `account` correspondant
- ✅ Tous les `playerStats` référencent un `account` valide
- ✅ Aucune erreur critique

### Étape 5: Tester l'Application

1. **Tester l'authentification**
   - Se connecter avec différents types de comptes (joueur, coach, admin)
   - Vérifier que les profils se chargent correctement

2. **Tester les fonctionnalités principales**
   - Dashboard joueur/coach
   - Affichage des équipes
   - Affichage des statistiques
   - Gestion des matchs

3. **Vérifier les données**
   - Comparer les données avant/après migration
   - Vérifier qu'aucune donnée n'a été perdue

### Étape 6: Mettre à Jour le Code (Optionnel)

Si vous voulez utiliser directement la nouvelle collection `accounts`:

1. Mettre à jour les requêtes pour utiliser `accounts` au lieu de `users`/`userProfiles`
2. Mettre à jour les requêtes pour utiliser `playerStats` au lieu de `players` (pour les stats)
3. Tester toutes les fonctionnalités

**Note**: L'ancien code continuera de fonctionner car les collections originales sont conservées.

### Étape 7: Nettoyage (Après Validation)

**⚠️ ATTENTION**: Ne faire cette étape qu'après validation complète (plusieurs jours/semaines)

```bash
# Marquer les collections obsolètes (ne pas supprimer immédiatement)
# Créer un script pour archiver users et userProfiles
```

## 🔄 Rollback (En Cas de Problème)

Si quelque chose ne va pas, vous pouvez restaurer depuis le backup:

```bash
# Restaurer depuis le backup
npx tsx scripts/restore-firestore.ts backups/<timestamp>
```

## 📊 Collections Créées

### Nouvelle Collection: `accounts`
- Fusion de `users` + `userProfiles`
- Enrichie avec `playerAccounts` et `coachAccounts`
- Source de vérité pour les comptes utilisateurs

### Nouvelle Collection: `playerStats`
- Statistiques de match uniquement
- Référence `accounts` via `accountId`
- Pas de duplication de données de profil

## 📋 Collections Conservées (Non Modifiées)

- ✅ `playerAccounts` - Conservée (source principale pour joueurs)
- ✅ `coachAccounts` - Conservée (source principale pour coaches)
- ✅ `teams` - Conservée
- ✅ `teamRegistrations` - Conservée
- ✅ `matches` - Conservée
- ✅ `matchResults` - Conservée
- ✅ `lineups` - Conservée
- ✅ `notifications` - Conservée
- ✅ Toutes les autres collections

## ⚠️ Collections Obsolètes (À Supprimer Plus Tard)

- ⏳ `users` - Fusionné dans `accounts`
- ⏳ `userProfiles` - Fusionné dans `accounts`
- ⏳ `players` - Remplacé par `playerStats` (mais conservé pour compatibilité)

**Ne pas supprimer immédiatement** - Attendre la validation complète.

## 🐛 Dépannage

### Problème: "Account non trouvé pour un joueur"
**Solution**: Vérifier que le `playerAccount` a un `uid` valide et qu'un `account` correspondant existe.

### Problème: "Données manquantes après migration"
**Solution**: Vérifier les logs de migration pour les erreurs. Restaurer depuis le backup si nécessaire.

### Problème: "L'application ne fonctionne plus"
**Solution**: 
1. Vérifier que les collections originales sont toujours présentes
2. L'ancien code devrait continuer de fonctionner
3. Vérifier les logs d'erreur dans la console

## 📞 Support

En cas de problème:
1. Vérifier les logs de migration
2. Exécuter `verify-migration.ts`
3. Restaurer depuis le backup si nécessaire
4. Contacter le support si le problème persiste

## ✅ Checklist Post-Migration

- [ ] Backup créé et vérifié
- [ ] Migration exécutée sans erreur
- [ ] Vérification de migration passée
- [ ] Application testée (authentification)
- [ ] Application testée (fonctionnalités principales)
- [ ] Données vérifiées (aucune perte)
- [ ] Code mis à jour (optionnel)
- [ ] Documentation mise à jour
- [ ] Équipe informée de la nouvelle architecture

