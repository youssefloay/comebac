# Système de Coach Intérimaire

## Concept

Le système de coach intérimaire permet au **capitaine d'une équipe** d'avoir accès aux fonctions de coach lorsque l'équipe n'a pas de coach assigné.

## Fonctionnement

### 1. Attribution automatique

- **Si une équipe n'a pas de coach** → Le capitaine devient automatiquement "Coach Intérimaire"
- **Le capitaine obtient accès à** :
  - Interface de gestion des compositions (`/coach/lineups`)
  - Gestion des statuts des joueurs (Titulaire, Remplaçant, Blessé, Suspendu)
  - Validation des compositions officielles

### 2. Interface joueur enrichie

Quand un joueur est coach intérimaire, son interface affiche :
- ✅ Badge "Coach Intérimaire" dans le menu
- ✅ Lien vers les compositions (en orange pour le différencier)
- ✅ Message explicatif du statut temporaire

### 3. Transition automatique

**Quand un coach est ajouté à l'équipe** :
- ❌ Le capitaine perd automatiquement son statut de coach intérimaire
- ✅ Le vrai coach obtient l'accès complet à l'interface coach
- ✅ Le capitaine redevient un joueur normal

## Implémentation technique

### Hook personnalisé

```typescript
import { useActingCoach } from '@/lib/use-acting-coach'

const actingCoachStatus = useActingCoach(user?.email, teamId)
// Retourne: { isActingCoach, isCaptain, hasTeamCoach, loading }
```

### Champs dans playerAccounts

```typescript
{
  isActingCoach: boolean,        // true si coach intérimaire
  actingCoachSince: Date,        // Date de début
  actingCoachUntil?: Date        // Date de fin (quand un coach est ajouté)
}
```

### Scripts disponibles

#### Mettre à jour les statuts
```bash
npm run update-acting-coach-status
```
Parcourt toutes les équipes et active le statut de coach intérimaire pour les capitaines sans coach.

## Gestion manuelle

### Activer le statut pour un joueur
```typescript
import { setActingCoachStatus } from '@/lib/manage-acting-coach-transition'

await setActingCoachStatus(teamId, playerEmail)
```

### Retirer le statut (quand un coach est ajouté)
```typescript
import { removeActingCoachStatus } from '@/lib/manage-acting-coach-transition'

await removeActingCoachStatus(teamId)
```

## Cas d'usage

### Équipe ICONS (Exemple)
- **Capitaine** : Omar Sa3id
- **Statut** : Coach intérimaire (pas de coach assigné)
- **Accès** : Interface joueur + compositions coach
- **Quand un coach sera ajouté** : Omar redevient joueur simple

### Équipe Road To Glory
- **Capitaine** : Youssef Loay
- **Coach** : Youssef Loay (compte coach séparé)
- **Statut** : Joueur normal (l'équipe a un coach)
- **Accès** : Interface joueur uniquement

## Avantages

1. ✅ **Flexibilité** : Les équipes peuvent fonctionner sans coach dédié
2. ✅ **Responsabilisation** : Le capitaine a les outils pour gérer son équipe
3. ✅ **Transition fluide** : Passage automatique quand un coach arrive
4. ✅ **Pas de duplication** : Un seul compte par personne

## Notes importantes

- Le statut de coach intérimaire est **temporaire** et **automatique**
- Seul le **capitaine** peut devenir coach intérimaire
- Le système vérifie en temps réel la présence d'un coach
- L'interface s'adapte automatiquement selon le statut
