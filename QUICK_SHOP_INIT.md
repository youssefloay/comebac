# 🚀 Initialisation Rapide de la Boutique

Puisque le bouton ne fonctionne pas, voici comment initialiser la boutique directement via la console du navigateur :

## Méthode 1 : Via la Console du Navigateur

1. Va sur `http://localhost:3000/admin`
2. Ouvre la console (F12)
3. Copie et colle ce code :

```javascript
// Créer une période de test
async function createTestPeriod() {
  const now = new Date();
  const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  
  const response = await fetch('/api/shop/periods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Janvier 2025',
      startDate: now.toISOString(),
      endDate: endDate.toISOString()
    })
  });
  
  const data = await response.json();
  console.log('Période créée:', data);
  
  // Ouvrir la période
  if (data.periodId) {
    const openResponse = await fetch(`/api/shop/periods/${data.periodId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'open',
        startDate: now.toISOString(),
        endDate: endDate.toISOString()
      })
    });
    
    const openData = await openResponse.json();
    console.log('Période ouverte:', openData);
    alert('✅ Boutique initialisée et ouverte !');
    window.location.reload();
  }
}

createTestPeriod();
```

4. Appuie sur Entrée
5. La boutique sera initialisée !

## Méthode 2 : Utiliser Postman ou cURL

### Créer une période
```bash
curl -X POST http://localhost:3000/api/shop/periods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Janvier 2025",
    "startDate": "2025-01-30T00:00:00.000Z",
    "endDate": "2025-02-14T00:00:00.000Z"
  }'
```

### Ouvrir la période (remplace PERIOD_ID par l'ID retourné)
```bash
curl -X PATCH http://localhost:3000/api/shop/periods/PERIOD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "open",
    "startDate": "2025-01-30T00:00:00.000Z",
    "endDate": "2025-02-14T00:00:00.000Z"
  }'
```

## Méthode 3 : Directement dans Firestore

1. Va sur Firebase Console
2. Ouvre Firestore Database
3. Crée une collection `shopPeriods`
4. Ajoute un document avec :
```json
{
  "id": "test-period-1",
  "name": "Test Janvier 2025",
  "startDate": [Timestamp maintenant],
  "endDate": [Timestamp +14 jours],
  "status": "open",
  "totalOrders": 0,
  "totalRevenue": 0,
  "summary": {
    "jerseys": 0,
    "tshirts": 0,
    "sweatshirts": 0
  },
  "createdAt": [Timestamp maintenant]
}
```

5. Mets à jour `shopSettings/main` :
```json
{
  "currentPeriod": {
    "id": "test-period-1",
    "isOpen": true,
    "status": "open",
    "startDate": [Timestamp maintenant],
    "endDate": [Timestamp +14 jours]
  }
}
```

## Vérification

Après l'initialisation, va sur :
- `http://localhost:3000/public/shop`

Tu devrais voir :
- ✅ "Pré-commandes ouvertes !"
- ✅ Compte à rebours
- ✅ 3 mockups 3D (Maillot bleu, T-Shirt vert, Sweatshirt violet)

## Debug du bouton

Si tu veux quand même débugger le bouton, ouvre la console et vérifie :

1. Y a-t-il des erreurs JavaScript ?
2. Le message "Bouton cliqué !" apparaît-il quand tu cliques ?
3. Y a-t-il un élément qui recouvre le bouton ?

Pour vérifier le z-index :
```javascript
// Dans la console
document.querySelector('button').style.zIndex = '9999';
```

---

**Recommandation** : Utilise la Méthode 1 (console du navigateur), c'est le plus rapide ! 🚀
