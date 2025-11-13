# 🔍 Fonctionnalité de Recherche Admin

## Vue d'ensemble

La barre de recherche avec autocomplétion permet aux administrateurs de trouver rapidement des joueurs et entraîneurs sans avoir à parcourir manuellement les listes.

## Fonctionnalités principales

### ✨ Recherche intelligente
- Recherche en temps réel pendant que vous tapez
- Suggestions instantanées (max 8 par défaut)
- Recherche sur plusieurs champs :
  - Nom complet (prénom + nom)
  - Email
  - Nom d'équipe
  - Position (pour les joueurs)

### ⌨️ Navigation au clavier
- **↓** : Descendre dans les suggestions
- **↑** : Remonter dans les suggestions  
- **Enter** : Sélectionner le résultat surligné
- **Escape** : Fermer les suggestions
- **X** : Effacer la recherche

### 🎨 Interface visuelle
- Avatars avec initiales colorées
- Badge orange pour les entraîneurs 🟠
- Badge bleu pour les joueurs 🔵
- Numéro de maillot affiché pour les joueurs
- Badges pour équipe et position

## Pages disponibles

### 1. `/admin/search` - Recherche globale
Page dédiée à la recherche avec :
- Barre de recherche en haut
- Affichage détaillé du résultat sélectionné
- Statistiques (nombre d'entraîneurs/joueurs)
- Bouton pour se faire passer pour l'utilisateur

**Accès rapide** : Bouton "🔍 Recherche rapide" dans la sidebar admin

### 2. `/admin/impersonate` - Se faire passer pour...
Page améliorée avec :
- Barre de recherche avec autocomplétion
- Onglets Entraîneurs/Joueurs
- Grille de cartes pour tous les utilisateurs
- Sélection directe depuis les suggestions

## Utilisation du composant

### Import
```tsx
import { SearchBar, SearchResult } from '@/components/admin/search-bar'
```

### Exemple basique
```tsx
const [searchData, setSearchData] = useState<SearchResult[]>([])

// Charger les données
const coaches = await getDocs(collection(db, 'coachAccounts'))
const players = await getDocs(collection(db, 'playerAccounts'))

const allData: SearchResult[] = [
  ...coaches.docs.map(doc => ({ 
    id: doc.id, 
    type: 'coach' as const,
    ...doc.data() 
  })),
  ...players.docs.map(doc => ({ 
    id: doc.id, 
    type: 'player' as const,
    ...doc.data() 
  }))
]

setSearchData(allData)

// Utiliser le composant
<SearchBar
  data={searchData}
  onSelect={(result) => {
    console.log('Utilisateur sélectionné:', result)
    // Faire quelque chose avec le résultat
  }}
  placeholder="Rechercher un joueur ou entraîneur..."
  maxSuggestions={10}
/>
```

### Props du composant

| Prop | Type | Requis | Défaut | Description |
|------|------|--------|--------|-------------|
| `data` | `SearchResult[]` | ✅ | - | Liste des joueurs et entraîneurs |
| `onSelect` | `(result: SearchResult) => void` | ✅ | - | Callback de sélection |
| `placeholder` | `string` | ❌ | "Rechercher..." | Texte du placeholder |
| `maxSuggestions` | `number` | ❌ | 8 | Nombre max de suggestions |

### Type SearchResult

```typescript
interface SearchResult {
  id: string
  type: 'coach' | 'player'
  firstName: string
  lastName: string
  email: string
  teamName: string
  position?: string        // Seulement pour les joueurs
  jerseyNumber?: number    // Seulement pour les joueurs
}
```

## Exemples d'utilisation

### Recherche simple
```
Tapez: "john"
→ Affiche tous les John (joueurs et entraîneurs)
```

### Recherche par équipe
```
Tapez: "barcelona"
→ Affiche tous les membres de l'équipe Barcelona
```

### Recherche par position
```
Tapez: "attaquant"
→ Affiche tous les joueurs en position attaquant
```

### Recherche par email
```
Tapez: "@gmail"
→ Affiche tous les utilisateurs avec email Gmail
```

## Personnalisation

### Changer le nombre de suggestions
```tsx
<SearchBar
  data={searchData}
  onSelect={handleSelect}
  maxSuggestions={15}  // Afficher jusqu'à 15 suggestions
/>
```

### Personnaliser le placeholder
```tsx
<SearchBar
  data={searchData}
  onSelect={handleSelect}
  placeholder="Trouvez un joueur par nom, équipe ou position..."
/>
```

## Performance

- ✅ Recherche optimisée avec filtrage côté client
- ✅ Limite de suggestions pour éviter les listes trop longues
- ✅ Fermeture automatique au clic extérieur
- ✅ Pas de requêtes serveur pendant la frappe

## Améliorations futures possibles

- [ ] Recherche floue (fuzzy search) pour les fautes de frappe
- [ ] Historique des recherches récentes
- [ ] Filtres avancés (par équipe, position, etc.)
- [ ] Export des résultats de recherche
- [ ] Recherche vocale
- [ ] Raccourcis clavier globaux (ex: Ctrl+K)
