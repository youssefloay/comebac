# Composants Admin

## SearchBar

Barre de recherche avec autocomplétion pour rechercher des joueurs et entraîneurs.

### Fonctionnalités

- ✅ Recherche en temps réel avec suggestions
- ✅ Navigation au clavier (flèches haut/bas, Enter, Escape)
- ✅ Affichage des avatars avec initiales
- ✅ Badges pour différencier joueurs/entraîneurs
- ✅ Fermeture automatique au clic extérieur
- ✅ Limite configurable de suggestions
- ✅ Recherche sur nom, email, équipe et position

### Utilisation

```tsx
import { SearchBar, SearchResult } from '@/components/admin/search-bar'

// Préparer les données
const searchData: SearchResult[] = [
  ...coaches.map(c => ({ ...c, type: 'coach' as const })),
  ...players.map(p => ({ ...p, type: 'player' as const }))
]

// Utiliser le composant
<SearchBar
  data={searchData}
  onSelect={(result) => {
    console.log('Sélectionné:', result)
  }}
  placeholder="Rechercher..."
  maxSuggestions={8}
/>
```

### Props

- `data`: Array de SearchResult (joueurs et entraîneurs)
- `onSelect`: Callback appelé quand un résultat est sélectionné
- `placeholder`: Texte du placeholder (optionnel)
- `maxSuggestions`: Nombre max de suggestions (défaut: 8)

### Navigation clavier

- **↓** : Descendre dans les suggestions
- **↑** : Remonter dans les suggestions
- **Enter** : Sélectionner le résultat surligné
- **Escape** : Fermer les suggestions

### Pages utilisant ce composant

- `/admin/impersonate` - Recherche pour se faire passer pour un utilisateur
- `/admin/search` - Page de recherche globale
