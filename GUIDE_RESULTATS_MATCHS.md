# 📋 Guide : Comment Saisir les Résultats de Match

## 🎯 Étapes pour saisir un résultat de match

### 1. **Créer un match de test**
- Va dans l'admin (`/admin`)
- Clique sur le bouton **"🧪 Match test"** dans la sidebar
- Cela créera automatiquement un match entre tes 2 premières équipes

### 2. **Aller dans l'onglet Matchs**
- Clique sur l'onglet **"Matchs"** dans le dashboard admin
- Tu verras ton match de test avec le statut "Programmé"

### 3. **Ajouter le résultat**
- Clique sur **"Ajouter le résultat"** sur la carte du match
- Une fenêtre s'ouvrira avec le formulaire de résultat

## 📝 Informations à saisir dans le formulaire

### **🏆 Scores des équipes**
- **Score équipe domicile** : Nombre de buts marqués (ex: 2)
- **Score équipe extérieur** : Nombre de buts marqués (ex: 1)

### **⚽ Buteurs pour chaque équipe**
Le nombre de buteurs DOIT correspondre au score :
- Si le score est 2-1, tu dois avoir 2 buteurs pour la première équipe et 1 pour la seconde

**Pour chaque but :**
1. **Sélectionner le buteur** :
   - Choisis dans la liste des joueurs de l'équipe
   - OU clique "✏️ Saisir manuellement" pour taper un nom

2. **Nom du buteur** :
   - Si sélectionné dans la liste : automatiquement rempli
   - Si saisi manuellement : tape le nom (ex: "Lionel Messi")

3. **Passeur décisif (optionnel)** :
   - Choisis le joueur qui a fait la passe décisive
   - Ou laisse vide si pas de passe décisive

## 🔍 Exemple concret

**Match : Real Madrid 2 - 1 FC Barcelone**

### Équipe domicile (Real Madrid) - Score : 2
- **But #1** :
  - Buteur : Karim Benzema
  - Passeur : Luka Modric
- **But #2** :
  - Buteur : Vinicius Jr
  - Passeur : (aucun)

### Équipe extérieur (FC Barcelone) - Score : 1
- **But #1** :
  - Buteur : Lionel Messi
  - Passeur : Pedri

## ✅ Validation automatique

Le système vérifie que :
- Le nombre de buteurs = le score de chaque équipe
- Tous les noms de buteurs sont renseignés
- Indicateurs visuels : ✅ vert si correct, ⚠️ jaune si manquant

## 🚀 Après validation

Une fois le résultat enregistré :
- Le match passe au statut "Terminé"
- Les statistiques des équipes sont mises à jour automatiquement
- Les classements sont recalculés
- Les statistiques des joueurs buteurs sont mises à jour

## 💡 Conseils

1. **Commence par les scores** avant d'ajouter les buteurs
2. **Utilise la liste des joueurs** quand possible (plus précis)
3. **Vérifie les indicateurs** verts avant de valider
4. **Les passes décisives sont optionnelles** mais enrichissent les stats
5. **Tu peux modifier** un résultat déjà saisi en cliquant "Modifier le résultat"