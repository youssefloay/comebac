# Requirements Document - Mode Fantasy ComeBac League

## Introduction

Le Mode Fantasy est une fonctionnalité permettant aux utilisateurs de créer et gérer une équipe virtuelle composée de joueurs réels du championnat ComeBac League. Les utilisateurs peuvent sélectionner des joueurs avec un budget limité, gagner des points basés sur les performances réelles, et concourir dans un classement global.

## Glossary

- **Fantasy System**: Le système de gestion des équipes virtuelles
- **Fantasy Team**: L'équipe virtuelle créée par un utilisateur
- **Real Player**: Un joueur réel appartenant à une équipe officielle du championnat
- **Fantasy User**: Un utilisateur (fan, visiteur) qui crée une équipe Fantasy
- **Budget**: Montant virtuel alloué pour acheter des joueurs (100M€)
- **Captain**: Joueur dont les points sont doublés
- **Fantasy Points**: Points gagnés basés sur les performances réelles des joueurs
- **Gameweek**: Journée de championnat
- **Transfer**: Changement de joueur dans l'équipe Fantasy
- **Wildcard**: Bonus permettant de refaire toute son équipe gratuitement
- **Formation**: Disposition tactique (ex: 4-3-3, 4-4-2)
- **Player Value**: Prix Fantasy d'un joueur basé sur ses performances
- **Popularity**: Pourcentage d'équipes Fantasy ayant sélectionné un joueur

## Requirements

### Requirement 1: Création d'équipe Fantasy

**User Story:** En tant qu'utilisateur, je veux créer mon équipe Fantasy pour participer au championnat virtuel

#### Acceptance Criteria

1. WHEN un utilisateur accède au Mode Fantasy pour la première fois, THE Fantasy System SHALL afficher un formulaire de création d'équipe
2. WHEN l'utilisateur saisit un nom d'équipe, THE Fantasy System SHALL valider que le nom contient entre 3 et 30 caractères
3. WHEN l'équipe est créée, THE Fantasy System SHALL attribuer un budget de 100M€
4. WHEN l'équipe est créée, THE Fantasy System SHALL rediriger vers la page de sélection des joueurs
5. THE Fantasy System SHALL enregistrer l'équipe dans Firebase avec userId, teamName, budget, createdAt

### Requirement 2: Sélection des joueurs

**User Story:** En tant qu'utilisateur, je veux sélectionner 7 joueurs réels pour composer mon équipe Fantasy

#### Acceptance Criteria

1. THE Fantasy System SHALL afficher tous les Real Players disponibles classés par poste
2. WHEN l'utilisateur consulte un joueur, THE Fantasy System SHALL afficher photo, nom, école, équipe réelle, poste, prix Fantasy, statistiques et forme
3. WHEN l'utilisateur sélectionne un joueur, THE Fantasy System SHALL vérifier que le budget restant est suffisant
4. WHEN l'utilisateur sélectionne un joueur, THE Fantasy System SHALL vérifier qu'il n'a pas déjà 3 joueurs de la même équipe
5. THE Fantasy System SHALL permettre de sélectionner exactement 7 joueurs (1 Gardien, 2-3 Défenseurs, 2-3 Milieux, 1-2 Attaquants)
6. WHEN l'utilisateur a sélectionné 7 joueurs, THE Fantasy System SHALL demander de désigner un Captain
7. WHEN l'équipe est complète, THE Fantasy System SHALL permettre de valider et enregistrer la composition

### Requirement 3: Formation et composition

**User Story:** En tant qu'utilisateur, je veux choisir une formation tactique pour mon équipe Fantasy

#### Acceptance Criteria

1. THE Fantasy System SHALL proposer les formations 4-2-0, 3-3-0, 3-2-1, 2-3-1, 2-2-2 (1 GK + 6 joueurs de champ)
2. WHEN l'utilisateur sélectionne une formation, THE Fantasy System SHALL afficher les emplacements correspondants
3. THE Fantasy System SHALL valider que la composition respecte la formation choisie
4. THE Fantasy System SHALL afficher visuellement la composition sur un terrain
5. WHEN l'utilisateur désigne un Captain, THE Fantasy System SHALL afficher une indication visuelle (brassard)

### Requirement 4: Profil Fantasy des joueurs

**User Story:** En tant qu'utilisateur, je veux consulter le profil Fantasy d'un joueur pour évaluer son intérêt

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur un joueur, THE Fantasy System SHALL afficher une page de profil détaillée
2. THE Fantasy System SHALL afficher école, poste, équipe réelle, photo, statistiques de la saison
3. THE Fantasy System SHALL afficher le prix Fantasy actuel du joueur
4. THE Fantasy System SHALL afficher les points Fantasy cumulés dans la saison
5. THE Fantasy System SHALL afficher la popularité (pourcentage d'équipes Fantasy qui l'ont sélectionné)
6. THE Fantasy System SHALL afficher l'historique des points par Gameweek
7. THE Fantasy System SHALL afficher la forme récente (5 derniers matchs)

### Requirement 5: Mon Équipe Fantasy

**User Story:** En tant qu'utilisateur, je veux voir ma composition actuelle et mes points en temps réel

#### Acceptance Criteria

1. THE Fantasy System SHALL afficher la composition visuelle sur un terrain
2. THE Fantasy System SHALL afficher le nom de l'équipe Fantasy et le budget restant
3. THE Fantasy System SHALL afficher les points totaux de l'équipe
4. THE Fantasy System SHALL afficher les points de chaque joueur après chaque match réel
5. THE Fantasy System SHALL afficher les points du Captain avec indication x2
6. THE Fantasy System SHALL proposer un onglet "Historique" listant les points par Gameweek
7. THE Fantasy System SHALL permettre d'accéder aux transferts

### Requirement 6: Système de points

**User Story:** En tant qu'utilisateur, je veux que mes joueurs gagnent des points basés sur leurs performances réelles

#### Acceptance Criteria

1. WHEN un Real Player marque un but, THE Fantasy System SHALL attribuer des points selon son poste (Gardien: +10, Défenseur: +6, Milieu: +5, Attaquant: +4)
2. WHEN un Real Player fait une passe décisive, THE Fantasy System SHALL attribuer +3 points
3. WHEN un Gardien ou Défenseur garde un clean sheet, THE Fantasy System SHALL attribuer +4 points
4. WHEN un Real Player joue au moins 60 minutes, THE Fantasy System SHALL attribuer +2 points
5. WHEN un Real Player joue moins de 60 minutes, THE Fantasy System SHALL attribuer +1 point
6. WHEN l'équipe réelle gagne, THE Fantasy System SHALL attribuer +2 points à tous les joueurs ayant joué
7. WHEN l'équipe réelle fait match nul, THE Fantasy System SHALL attribuer +1 point à tous les joueurs ayant joué
8. WHEN un Real Player reçoit un carton jaune, THE Fantasy System SHALL déduire -1 point
9. WHEN un Real Player reçoit un carton rouge, THE Fantasy System SHALL déduire -3 points
10. WHEN un Gardien encaisse 2 buts ou plus, THE Fantasy System SHALL déduire -1 point
11. WHEN le Captain marque des points, THE Fantasy System SHALL doubler ses points

### Requirement 7: Transferts

**User Story:** En tant qu'utilisateur, je veux pouvoir modifier ma composition entre les Gameweeks

#### Acceptance Criteria

1. THE Fantasy System SHALL permettre 2 transferts gratuits par Gameweek
2. WHEN l'utilisateur effectue plus de 2 transferts, THE Fantasy System SHALL déduire -4 points par transfert supplémentaire
3. THE Fantasy System SHALL permettre de remplacer un joueur par un autre du même poste
4. THE Fantasy System SHALL vérifier que le budget permet le transfert
5. THE Fantasy System SHALL bloquer les transferts une fois la Gameweek commencée
6. THE Fantasy System SHALL réinitialiser les transferts gratuits à chaque nouvelle Gameweek

### Requirement 8: Wildcard

**User Story:** En tant qu'utilisateur, je veux pouvoir refaire entièrement mon équipe une fois par saison

#### Acceptance Criteria

1. THE Fantasy System SHALL attribuer 1 Wildcard par saison à chaque Fantasy User
2. WHEN l'utilisateur active le Wildcard, THE Fantasy System SHALL permettre de modifier tous les joueurs sans pénalité
3. WHEN le Wildcard est activé, THE Fantasy System SHALL permettre de changer la formation
4. WHEN le Wildcard est utilisé, THE Fantasy System SHALL le marquer comme consommé
5. THE Fantasy System SHALL afficher clairement si le Wildcard est disponible ou utilisé

### Requirement 9: Classement Fantasy

**User Story:** En tant qu'utilisateur, je veux voir mon classement par rapport aux autres utilisateurs

#### Acceptance Criteria

1. THE Fantasy System SHALL afficher un classement global par points cumulés
2. THE Fantasy System SHALL afficher un classement de la Gameweek en cours
3. THE Fantasy System SHALL afficher le rang, nom d'équipe, points totaux et points de la semaine
4. THE Fantasy System SHALL mettre en évidence l'équipe de l'utilisateur connecté
5. THE Fantasy System SHALL permettre de rechercher une équipe par nom
6. THE Fantasy System SHALL afficher le top 100 avec pagination

### Requirement 10: Règles Fantasy

**User Story:** En tant qu'utilisateur, je veux comprendre comment les points sont calculés

#### Acceptance Criteria

1. THE Fantasy System SHALL afficher une page dédiée aux règles
2. THE Fantasy System SHALL afficher la grille de points sous forme de tableau clair
3. THE Fantasy System SHALL expliquer le système de budget et de formation
4. THE Fantasy System SHALL expliquer le rôle du Captain
5. THE Fantasy System SHALL expliquer le système de transferts et le Wildcard
6. THE Fantasy System SHALL afficher des exemples concrets de calcul de points

### Requirement 11: Navigation et intégration

**User Story:** En tant qu'utilisateur, je veux accéder facilement au Mode Fantasy depuis l'application

#### Acceptance Criteria

1. THE Fantasy System SHALL ajouter un onglet "Fantasy" dans la navigation principale
2. THE Fantasy System SHALL utiliser le même header et sidebar que le reste de l'application
3. THE Fantasy System SHALL respecter le style et la direction artistique de ComeBac League
4. THE Fantasy System SHALL être accessible depuis /public/fantasy
5. THE Fantasy System SHALL proposer une navigation claire entre toutes les pages Fantasy

### Requirement 12: Synchronisation avec les données réelles

**User Story:** En tant qu'utilisateur, je veux que mes points soient mis à jour automatiquement après chaque match

#### Acceptance Criteria

1. WHEN un match réel se termine, THE Fantasy System SHALL calculer les points de tous les joueurs ayant participé
2. THE Fantasy System SHALL mettre à jour les points de toutes les Fantasy Teams concernées
3. THE Fantasy System SHALL mettre à jour le classement global
4. THE Fantasy System SHALL synchroniser les statistiques des Real Players depuis Firebase
5. THE Fantasy System SHALL notifier les utilisateurs de leurs points gagnés

### Requirement 13: Gestion des prix des joueurs

**User Story:** En tant que système, je veux ajuster les prix des joueurs selon leurs performances

#### Acceptance Criteria

1. THE Fantasy System SHALL calculer le prix initial basé sur le poste et les statistiques
2. WHEN un joueur performe bien, THE Fantasy System SHALL augmenter son prix progressivement
3. WHEN un joueur performe mal, THE Fantasy System SHALL diminuer son prix progressivement
4. THE Fantasy System SHALL limiter les variations de prix à ±0.5M€ par Gameweek
5. THE Fantasy System SHALL afficher l'évolution du prix sur le profil du joueur

### Requirement 14: Statistiques et historique

**User Story:** En tant qu'utilisateur, je veux consulter l'historique de mes performances

#### Acceptance Criteria

1. THE Fantasy System SHALL enregistrer les points de chaque Gameweek
2. THE Fantasy System SHALL afficher un graphique d'évolution des points
3. THE Fantasy System SHALL afficher le meilleur score de la saison
4. THE Fantasy System SHALL afficher le rang moyen
5. THE Fantasy System SHALL afficher les transferts effectués par Gameweek
6. THE Fantasy System SHALL afficher les joueurs les plus performants de l'équipe

### Requirement 15: Récompenses et badges Fantasy

**User Story:** En tant qu'utilisateur, je veux gagner des badges et récompenses pour mes performances

#### Acceptance Criteria

1. WHEN l'utilisateur termine dans le top 10 d'une Gameweek, THE Fantasy System SHALL attribuer un badge "Top 10 de la semaine"
2. WHEN l'utilisateur termine dans le top 3 du classement général, THE Fantasy System SHALL attribuer un badge "Podium"
3. WHEN l'utilisateur atteint 100 points en une Gameweek, THE Fantasy System SHALL attribuer un badge "Century"
4. WHEN l'utilisateur utilise son Wildcard efficacement (+50 points), THE Fantasy System SHALL attribuer un badge "Wildcard Master"
5. WHEN l'utilisateur a le meilleur Captain de la Gameweek, THE Fantasy System SHALL attribuer un badge "Captain Parfait"
6. WHEN l'utilisateur termine 1er du classement général, THE Fantasy System SHALL attribuer un trophée "Champion Fantasy"
7. WHEN l'utilisateur gagne 5 Gameweeks consécutives, THE Fantasy System SHALL attribuer un badge "Série Gagnante"
8. THE Fantasy System SHALL afficher tous les badges sur le profil de l'utilisateur
9. THE Fantasy System SHALL afficher une page dédiée aux récompenses disponibles

### Requirement 16: Notifications Fantasy

**User Story:** En tant qu'utilisateur, je veux être notifié des événements importants de mon équipe Fantasy

#### Acceptance Criteria

1. WHEN un match se termine, THE Fantasy System SHALL notifier l'utilisateur des points gagnés par son équipe
2. WHEN le Captain marque des points, THE Fantasy System SHALL envoyer une notification spéciale
3. WHEN l'utilisateur gagne un badge, THE Fantasy System SHALL notifier immédiatement
4. WHEN l'utilisateur monte dans le classement (top 100, top 50, top 10), THE Fantasy System SHALL notifier
5. WHEN un joueur de l'équipe a une excellente performance (+15 points), THE Fantasy System SHALL notifier
6. WHEN la deadline de transferts approche (24h avant), THE Fantasy System SHALL envoyer un rappel
7. WHEN un joueur de l'équipe est blessé ou suspendu, THE Fantasy System SHALL alerter l'utilisateur
8. THE Fantasy System SHALL permettre de configurer les préférences de notifications
9. THE Fantasy System SHALL afficher les notifications dans la cloche de notifications existante

### Requirement 17: Responsive et performance

**User Story:** En tant qu'utilisateur mobile, je veux une expérience fluide sur tous les appareils

#### Acceptance Criteria

1. THE Fantasy System SHALL être entièrement responsive (mobile, tablette, desktop)
2. THE Fantasy System SHALL charger les données de manière optimisée
3. THE Fantasy System SHALL utiliser le cache pour les données statiques
4. THE Fantasy System SHALL afficher des loaders pendant les chargements
5. THE Fantasy System SHALL gérer les erreurs réseau gracieusement
