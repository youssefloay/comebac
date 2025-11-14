# Implementation Plan - Mode Fantasy ComeBac League

## Phase 1: Infrastructure et données de base

- [x] 1. Créer les types TypeScript Fantasy
  - Créer `lib/types/fantasy.ts` avec tous les types (FantasyTeam, FantasyPlayer, PlayerFantasyStats, etc.)
  - Exporter les types dans `lib/types/index.ts`
  - _Requirements: 1, 2, 3_

- [x] 2. Créer les utilitaires de validation
  - Créer `lib/fantasy/validation.ts`
  - Implémenter `validateSquad()` pour vérifier composition
  - Implémenter `validateBudget()` pour vérifier le budget
  - Implémenter `validateFormation()` pour vérifier la formation
  - _Requirements: 2, 3_

- [x] 3. Créer le système de calcul de points
  - Créer `lib/fantasy/points-system.ts`
  - Implémenter `calculatePlayerPoints()` avec toute la grille de points
  - Implémenter `updateFantasyTeamsAfterMatch()` pour mise à jour automatique
  - _Requirements: 6_

- [x] 4. Créer le système de prix des joueurs
  - Créer `lib/fantasy/player-pricing.ts`
  - Implémenter `calculateInitialPrice()` basé sur position et stats
  - Implémenter `updatePlayerPrices()` pour ajustements hebdomadaires
  - _Requirements: 13_

- [x] 5. Créer le système de badges
  - Créer `lib/fantasy/badges.ts`
  - Définir tous les badges (top_10_week, podium, century, etc.)
  - Implémenter `checkAndAwardBadges()` pour attribution automatique
  - _Requirements: 15_

- [x] 6. Créer le système de notifications Fantasy
  - Créer `lib/fantasy/notifications.ts`
  - Implémenter `sendFantasyNotification()` pour tous les types
  - Intégrer avec le système de notifications existant
  - _Requirements: 16_

## Phase 2: APIs et routes

- [x] 7. Créer l'API de création d'équipe
  - Créer `app/api/fantasy/create-team/route.ts`
  - Valider les données côté serveur
  - Créer l'équipe dans Firestore
  - Initialiser les stats
  - _Requirements: 1_

- [x] 8. Créer l'API de récupération d'équipe
  - Créer `app/api/fantasy/get-team/route.ts`
  - Récupérer l'équipe avec tous les détails
  - Calculer les points en temps réel
  - _Requirements: 5_

- [x] 9. Créer l'API de transferts
  - Créer `app/api/fantasy/transfers/route.ts`
  - Valider les transferts (budget, deadline, etc.)
  - Appliquer les pénalités si nécessaire
  - Mettre à jour l'équipe
  - _Requirements: 7_

- [x] 10. Créer l'API Wildcard
  - Créer `app/api/fantasy/wildcard/route.ts`
  - Vérifier disponibilité
  - Permettre refonte complète de l'équipe
  - Marquer comme utilisé
  - _Requirements: 8_

- [x] 11. Créer l'API de classement
  - Créer `app/api/fantasy/leaderboard/route.ts`
  - Récupérer classement global avec pagination
  - Récupérer classement hebdomadaire
  - Calculer les rangs
  - _Requirements: 9_

- [x] 12. Créer l'API des stats joueurs Fantasy
  - Créer `app/api/fantasy/player-stats/[id]/route.ts`
  - Récupérer stats Fantasy d'un joueur
  - Calculer popularité et forme
  - _Requirements: 4, 13_

## Phase 3: Composants réutilisables

- [x] 13. Créer le composant PlayerCard
  - Créer `components/fantasy/player-card.tsx`
  - Afficher photo, nom, équipe, poste, prix, points
  - Gérer sélection/désélection
  - Style cohérent avec l'app
  - _Requirements: 2, 4_

- [x] 14. Créer le composant FormationSelector
  - Créer `components/fantasy/formation-selector.tsx`
  - Afficher les formations disponibles (4-2-0, 3-3-0, 3-2-1, 2-3-1, 2-2-2)
  - Permettre sélection
  - Afficher visuellement la formation
  - _Requirements: 3_

- [x] 15. Créer le composant PitchView
  - Créer `components/fantasy/pitch-view.tsx`
  - Afficher terrain de foot
  - Positionner les joueurs selon formation
  - Afficher capitaine avec brassard
  - Responsive (mobile/desktop)
  - _Requirements: 3, 5_

- [x] 16. Créer le composant SquadBuilder
  - Créer `components/fantasy/squad-builder.tsx`
  - Intégrer FormationSelector et PitchView
  - Gérer drag & drop des joueurs
  - Afficher budget restant
  - Afficher erreurs de validation
  - _Requirements: 2, 3_

- [x] 17. Créer le composant BudgetTracker
  - Créer `components/fantasy/budget-tracker.tsx`
  - Afficher budget total et restant
  - Barre de progression visuelle
  - Alertes si dépassement
  - _Requirements: 2_

- [x] 18. Créer le composant TransferPanel
  - Créer `components/fantasy/transfer-panel.tsx`
  - Afficher joueur à remplacer
  - Liste joueurs disponibles (même poste)
  - Vérification budget
  - Compteur transferts gratuits
  - Avertissement pénalités
  - _Requirements: 7_

- [x] 19. Créer le composant LeaderboardTable
  - Créer `components/fantasy/leaderboard-table.tsx`
  - Tableau avec rang, équipe, points
  - Highlight équipe utilisateur
  - Pagination
  - Recherche
  - _Requirements: 9_

- [x] 20. Créer le composant BadgeDisplay
  - Créer `components/fantasy/badge-display.tsx`
  - Afficher badges gagnés
  - Afficher badges à débloquer
  - Progression vers badges
  - Animations
  - _Requirements: 15_

- [x] 21. Créer le composant PointsHistory
  - Créer `components/fantasy/points-history.tsx`
  - Graphique évolution des points
  - Liste par gameweek
  - Détails par joueur
  - _Requirements: 5, 14_

## Phase 4: Pages principales

- [x] 22. Créer la page Hub Fantasy
  - Créer `app/public/fantasy/page.tsx`
  - Dashboard avec aperçu équipe
  - Cartes rapides (classement, deadline, meilleur joueur)
  - Liens vers toutes les sections
  - Style cohérent avec l'app
  - _Requirements: 11_

- [x] 23. Créer la page de création d'équipe
  - Créer `app/public/fantasy/create/page.tsx`
  - Formulaire nom d'équipe
  - Affichage budget initial
  - Validation et redirection
  - _Requirements: 1_

- [x] 24. Créer la page de sélection de joueurs
  - Créer `app/public/fantasy/squad/page.tsx`
  - Intégrer SquadBuilder
  - Liste joueurs filtrée par poste
  - Recherche et filtres
  - Validation finale
  - _Requirements: 2, 3_

- [x] 25. Créer la page Mon Équipe
  - Créer `app/public/fantasy/my-team/page.tsx`
  - Afficher composition avec PitchView
  - Points totaux et de la semaine
  - Onglet Historique avec PointsHistory
  - Bouton vers Transferts
  - _Requirements: 5, 14_

- [x] 26. Créer la page Profil Joueur Fantasy
  - Créer `app/public/fantasy/player/[id]/page.tsx`
  - Infos joueur (photo, nom, école, équipe, poste)
  - Prix Fantasy et évolution
  - Points totaux et forme
  - Popularité
  - Stats réelles
  - Bouton Ajouter/Retirer
  - _Requirements: 4_

- [x] 27. Créer la page Transferts
  - Créer `app/public/fantasy/transfers/page.tsx`
  - Afficher équipe actuelle
  - Intégrer TransferPanel
  - Compteur transferts gratuits
  - Bouton Wildcard
  - Confirmation avant validation
  - _Requirements: 7, 8_

- [x] 28. Créer la page Classement
  - Créer `app/public/fantasy/leaderboard/page.tsx`
  - Onglets (Global, Hebdomadaire)
  - Intégrer LeaderboardTable
  - Recherche et filtres
  - Highlight utilisateur
  - _Requirements: 9_

- [x] 29. Créer la page Règles
  - Créer `app/public/fantasy/rules/page.tsx`
  - Introduction au Fantasy
  - Grille de points (tableau)
  - Explication budget et formation
  - Système transferts et Wildcard
  - Badges et récompenses
  - FAQ
  - _Requirements: 10_

- [x] 30. Créer la page Récompenses
  - Créer `app/public/fantasy/rewards/page.tsx`
  - Intégrer BadgeDisplay
  - Mes badges gagnés
  - Badges à débloquer
  - Progression
  - _Requirements: 15_

## Phase 5: Navigation et intégration

- [x] 31. Ajouter l'onglet Fantasy dans la navigation
  - Modifier `components/sofa/navigation.tsx`
  - Ajouter lien "Fantasy" avec icône Sparkles
  - Modifier `components/sofa/bottom-navigation.tsx` pour mobile
  - _Requirements: 11_

- [x] 32. Créer le hook useFantasyTeam
  - Créer `lib/hooks/use-fantasy-team.ts`
  - Utiliser React Query pour cache
  - Gérer loading et erreurs
  - _Requirements: 5_

- [x] 33. Créer le hook usePlayerFantasyStats
  - Créer `lib/hooks/use-player-fantasy-stats.ts`
  - Cache avec React Query
  - Mise à jour automatique
  - _Requirements: 4_

## Phase 6: Scripts et automatisation

- [x] 34. Créer le script d'initialisation Fantasy
  - Créer `scripts/init-fantasy-data.ts`
  - Calculer prix initial de tous les joueurs
  - Créer PlayerFantasyStats pour chaque joueur
  - Créer première gameweek
  - _Requirements: 13_

- [x] 35. Créer le script de mise à jour après match
  - Créer `scripts/update-fantasy-after-match.ts`
  - Calculer points de tous les joueurs du match
  - Mettre à jour toutes les équipes Fantasy
  - Envoyer notifications
  - Vérifier et attribuer badges
  - _Requirements: 6, 12, 15, 16_

- [x] 36. Créer le script de mise à jour des prix
  - Créer `scripts/update-player-prices.ts`
  - Calculer nouveaux prix basés sur forme
  - Limiter variations à ±0.5M
  - Exécuter hebdomadairement
  - _Requirements: 13_

- [x] 37. Créer le script de nouvelle gameweek
  - Créer `scripts/start-new-gameweek.ts`
  - Réinitialiser transferts gratuits
  - Réinitialiser points hebdomadaires
  - Envoyer notifications deadline
  - _Requirements: 7, 16_

## Phase 7: Admin et monitoring

- [x] 38. Créer la page admin Fantasy
  - Créer `app/admin/fantasy/page.tsx`
  - Statistiques globales (nb équipes, joueurs populaires)
  - Boutons actions (nouvelle gameweek, update prix, etc.)
  - Logs des mises à jour
  - _Requirements: 12_

- [x] 39. Créer l'API admin de mise à jour manuelle
  - Créer `app/api/admin/fantasy/update-points/route.ts`
  - Permettre recalcul manuel des points
  - Correction d'erreurs
  - _Requirements: 6_

- [x] 40. Créer l'API admin de gestion gameweek
  - Créer `app/api/admin/fantasy/gameweek/route.ts`
  - Créer nouvelle gameweek
  - Clôturer gameweek
  - _Requirements: 12_

## Phase 8: Tests et optimisations

- [x] 41. Tests unitaires système de points
  - Créer `lib/fantasy/__tests__/points-system.test.ts`
  - Tester tous les cas de calcul de points
  - Tester doublement capitaine
  - _Requirements: 6_

- [x] 42. Tests unitaires validations
  - Créer `lib/fantasy/__tests__/validation.test.ts`
  - Tester validation budget
  - Tester validation formation
  - Tester limite par équipe
  - _Requirements: 2, 3_

- [x] 43. Tests d'intégration SquadBuilder
  - Créer `components/fantasy/__tests__/squad-builder.test.tsx`
  - Tester sélection joueurs
  - Tester validations
  - Tester sauvegarde
  - _Requirements: 2, 3_

- [x] 44. Optimiser les requêtes Firestore
  - Ajouter indexes composites
  - Implémenter pagination efficace
  - Utiliser cache React Query
  - _Requirements: 17_

- [x] 45. Optimiser le responsive mobile
  - Tester sur différents devices
  - Ajuster PitchView pour mobile
  - Optimiser navigation mobile
  - _Requirements: 17_

## Phase 9: Documentation et déploiement

- [x] 46. Documenter l'API Fantasy
  - Créer `docs/FANTASY_API.md`
  - Documenter tous les endpoints
  - Exemples de requêtes
  - _Requirements: All_

- [ ]* 47. Créer le guide utilisateur
  - Créer `docs/FANTASY_USER_GUIDE.md`
  - Expliquer comment créer une équipe
  - Expliquer les transferts
  - Expliquer le système de points
  - _Requirements: 10_

- [ ] 48. Déployer et tester en production
  - Exécuter script d'initialisation
  - Tester création d'équipe
  - Tester calcul de points
  - Monitorer performances
  - _Requirements: All_
