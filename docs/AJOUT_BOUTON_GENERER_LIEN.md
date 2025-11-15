# Ajout du bouton "Générer lien" dans team-registrations

## Fonctionnalité créée

✅ API `/api/admin/generate-update-link` - Génère un token unique
✅ API `/api/get-registration-by-token` - Récupère l'inscription par token
✅ API `/api/update-registration` - Met à jour l'inscription
✅ Page `/update-registration/[token]` - Formulaire complet de modification

## Comment ajouter le bouton

### Dans `app/admin/team-registrations/page.tsx`

1. **Ajouter la fonction de génération de lien** (après la fonction `rejectRegistration`):

```typescript
const generateUpdateLink = async (registration: Registration) => {
  try {
    const res = await fetch('/api/admin/generate-update-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId: registration.id })
    })

    if (res.ok) {
      const data = await res.json()
      // Copier le lien dans le presse-papier
      navigator.clipboard.writeText(data.updateLink)
      alert(`Lien copié!\n\n${data.updateLink}\n\nEnvoyez ce lien au capitaine pour qu'il puisse mettre à jour les informations.`)
    } else {
      alert('Erreur lors de la génération du lien')
    }
  } catch (error) {
    console.error('Erreur:', error)
    alert('Erreur de connexion')
  }
}
```

2. **Ajouter le bouton dans la liste des inscriptions** (dans la section des boutons d'action):

```typescript
{registration.status === 'pending' && (
  <>
    <button
      onClick={() => generateUpdateLink(registration)}
      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
      title="Générer un lien pour que le capitaine mette à jour les infos"
    >
      <Link className="w-4 h-4" />
    </button>
    <button
      onClick={() => approveRegistration(registration)}
      disabled={processing}
      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
    >
      <Check className="w-4 h-4" />
    </button>
    <button
      onClick={() => rejectRegistration(registration)}
      disabled={processing}
      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
    >
      <X className="w-4 h-4" />
    </button>
  </>
)}
```

3. **Ajouter l'import de l'icône Link** (en haut du fichier):

```typescript
import { Link } from 'lucide-react'
```

## Utilisation

1. **Admin**: Va sur `/admin/team-registrations`
2. **Trouve l'inscription Se7en** (status: pending)
3. **Clique sur l'icône lien** (🔗) - Le lien est copié automatiquement
4. **Envoie le lien au capitaine** (Wael Genena - waymaneg@gmail.com)
5. **Le capitaine** ouvre le lien et modifie toutes les infos (noms, emails, téléphones, etc.)
6. **Le capitaine** soumet les modifications
7. **Admin**: Valide les modifications et approuve l'inscription

## Avantages

✅ Le capitaine peut tout modifier (pas seulement les emails)
✅ Lien sécurisé avec token unique
✅ Expire après 7 jours
✅ Ne peut être utilisé qu'une seule fois
✅ Interface complète avec tous les champs
✅ Validation admin des modifications

## Test

Pour tester avec Se7en:
1. Lance le script: `npm run register-se7en-team`
2. Va sur `/admin/team-registrations`
3. Génère le lien pour Se7en
4. Ouvre le lien dans un nouvel onglet
5. Modifie les infos
6. Soumets
7. Valide et approuve dans l'admin
