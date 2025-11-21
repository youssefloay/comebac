# ComeBac League - Documentation Complète des Fonctionnalités

## 📋 Table des matières

1. [Rôles et Accès](#rôles-et-accès)
2. [Pages Publiques](#pages-publiques)
3. [Interface Joueur](#interface-joueur)
4. [Interface Coach](#interface-coach)
5. [Interface Admin](#interface-admin)
6. [Système d'Inscription](#système-dinscription)
7. [Gestion des Matchs](#gestion-des-matchs)
8. [Statistiques et Classements](#statistiques-et-classements)
9. [Notifications](#notifications)
10. [Fantasy Mode](#fantasy-mode)
11. [Export/Import de Données](#exportimport-de-données)
12. [APIs Disponibles](#apis-disponibles)

---

## 🔐 Rôles et Accès

### Visiteur (Non authentifié)
- ✅ Accès aux pages publiques
- ✅ Consultation des matchs, classements, statistiques
- ✅ Inscription d'équipe (sans compte)
- ✅ Consultation des équipes et joueurs
- ❌ Pas d'accès aux dashboards personnels

### Joueur (Authentifié)
- ✅ Dashboard personnel
- ✅ Profil et statistiques personnelles
- ✅ Consultation des matchs de son équipe
- ✅ Notifications personnalisées
- ✅ Badges et récompenses
- ✅ Mode Fantasy
- ✅ Consultation du classement
- ✅ Accès à l'interface coach si coach intérimaire

### Coach (Authentifié)
- ✅ Dashboard coach
- ✅ Gestion de l'équipe
- ✅ Gestion des compositions (lineups)
- ✅ Saisie des résultats de matchs
- ✅ Statistiques de l'équipe
- ✅ Notifications aux joueurs
- ✅ Upload de photos d'équipe
- ✅ Consultation des matchs à venir
- ✅ Accès à l'interface joueur si coach intérimaire

### Coach Intérimaire
- ✅ Toutes les fonctionnalités d'un joueur
- ✅ Toutes les fonctionnalités d'un coach
- ✅ Badge "Coach Intérimaire" visible
- ✅ Basculement entre interface joueur et coach

### Admin (Authentifié)
- ✅ Accès complet à toutes les fonctionnalités
- ✅ Gestion des équipes, joueurs, coaches
- ✅ Validation des inscriptions
- ✅ Génération de matchs
- ✅ Gestion des résultats
- ✅ Outils de maintenance
- ✅ Export/Import de données
- ✅ Impersonation d'utilisateurs
- ✅ Recherche globale
- ✅ Statistiques avancées

---

## 🌐 Pages Publiques

### Route: `/public` (Page d'accueil)
**Fonctionnalités:**
- Vue d'ensemble de la ligue
- Statistiques clés (nombre d'équipes, matchs, joueurs)
- Derniers résultats
- Prochains matchs
- Navigation vers les différentes sections

### Route: `/public/matches`
**Fonctionnalités:**
- Liste de tous les matchs
- Filtres par date, équipe, statut
- Détails des matchs (scores, compositions)
- Calendrier des matchs

### Route: `/public/ranking`
**Fonctionnalités:**
- Classement des équipes
- Points, victoires, défaites, nuls
- Buts marqués/encaissés
- Différence de buts
- Tri par colonnes

### Route: `/public/teams`
**Fonctionnalités:**
- Liste de toutes les équipes
- Informations sur chaque équipe
- Logo et couleurs
- Statistiques d'équipe
- Liste des joueurs

### Route: `/public/players`
**Fonctionnalités:**
- Liste de tous les joueurs
- Profils des joueurs
- Statistiques individuelles
- Filtres par équipe, position

### Route: `/public/statistics`
**Fonctionnalités:**
- Statistiques globales de la ligue
- Graphiques et visualisations
- Statistiques par équipe
- Statistiques par joueur
- Historique des saisons

### Route: `/public/fantasy`
**Fonctionnalités:**
- Mode Fantasy public
- Animations et effets visuels
- Statistiques Fantasy
- Classement Fantasy

### Route: `/public/favorites`
**Fonctionnalités:**
- Gestion des favoris (équipes, joueurs)
- Liste personnalisée

### Route: `/public/privacy`
**Fonctionnalités:**
- Politique de confidentialité
- Conditions d'utilisation

---

## 👤 Interface Joueur

### Route: `/player` (Dashboard)
**Fonctionnalités:**
- Vue d'ensemble personnelle
- Prochains matchs de l'équipe
- Derniers résultats
- Statistiques personnelles
- Notifications récentes
- Badges obtenus
- Accès rapide aux sections

### Route: `/player/team`
**Fonctionnalités:**
- Informations sur l'équipe
- Liste des coéquipiers
- Statistiques de l'équipe
- Prochains matchs
- Historique des matchs

### Route: `/player/matches`
**Fonctionnalités:**
- Liste des matchs de l'équipe
- Détails des matchs
- Résultats
- Calendrier personnel

### Route: `/player/profile`
**Fonctionnalités:**
- Profil personnel
- Édition des informations
- Upload de photo de profil
- Statistiques personnelles
- Badges et récompenses
- Historique des matchs joués

### Route: `/player/ranking`
**Fonctionnalités:**
- Classement des équipes
- Position de son équipe
- Comparaison avec autres équipes

### Route: `/player/notifications`
**Fonctionnalités:**
- Liste des notifications
- Marquer comme lu/non lu
- Filtres par type
- Notifications push (PWA)

### Route: `/player/fantasy`
**Fonctionnalités:**
- Mode Fantasy personnel
- Sélection d'équipe Fantasy
- Statistiques Fantasy
- Classement Fantasy

### Route: `/player/badges`
**Fonctionnalités:**
- Collection de badges
- Badges obtenus
- Badges à débloquer
- Progression

### Navigation Joueur
- **Sidebar**: Navigation entre les sections
- **Bouton "Basculer sur Interface Coach"**: Visible si coach intérimaire
- **Notifications**: Cloche avec compteur
- **Profil**: Menu utilisateur

---

## 🎯 Interface Coach

### Route: `/coach` (Dashboard)
**Fonctionnalités:**
- Vue d'ensemble de l'équipe
- Prochains matchs
- Derniers résultats
- Statistiques de l'équipe
- Actions rapides (compositions, résultats)

### Route: `/coach/team`
**Fonctionnalités:**
- Gestion de l'équipe
- Liste des joueurs
- Informations sur les joueurs
- Upload de logo d'équipe
- Modification des informations d'équipe

### Route: `/coach/lineups`
**Fonctionnalités:**
- Création de compositions
- Sélection des joueurs pour chaque match
- Positions des joueurs
- Sauvegarde des compositions
- Historique des compositions

### Route: `/coach/matches`
**Fonctionnalités:**
- Liste des matchs de l'équipe
- Détails des matchs
- Saisie des résultats
- Validation des résultats
- Consultation des compositions

### Route: `/coach/stats`
**Fonctionnalités:**
- Statistiques détaillées de l'équipe
- Statistiques par joueur
- Graphiques et visualisations
- Comparaisons

### Route: `/coach/ranking`
**Fonctionnalités:**
- Classement des équipes
- Position de l'équipe
- Analyse de la compétition

### Route: `/coach/notifications`
**Fonctionnalités:**
- Envoi de notifications aux joueurs
- Liste des notifications envoyées
- Notifications reçues
- Gestion des notifications push

### Route: `/coach/profile`
**Fonctionnalités:**
- Profil personnel
- Édition des informations
- Upload de photo
- Informations de contact

### Navigation Coach
- **Sidebar**: Navigation entre les sections
- **Bouton "Basculer sur Interface Joueur"**: Visible si coach intérimaire
- **Badge "Coach Intérimaire"**: Si applicable
- **Notifications**: Cloche avec compteur

---

## 🛠️ Interface Admin

### Route: `/admin` (Dashboard Principal)
**Fonctionnalités:**
- Vue d'ensemble de la ligue
- Statistiques clés
- Navigation vers tous les onglets
- Actions rapides (générer matchs, fin de saison)
- Recherche rapide
- Impersonation

### Onglets du Dashboard Admin

#### 1. Onglet "Équipes" (`/admin` - Tab: Teams)
**Fonctionnalités:**
- Liste de toutes les équipes
- **Affichage du statut coach directement sur les cartes:**
  - ✅ Équipe avec coach (nom du coach visible)
  - ⚠️ Équipe avec coach intérimaire (nom du joueur visible)
  - ❌ Équipe sans coach (badge "Besoin d'un coach")
- Création d'équipe
- Modification d'équipe
- Suppression d'équipe
- Upload de logo
- Détails de l'équipe (joueurs, statistiques, matchs)
- **Nommer Coach Intérimaire** (si équipe sans coach)
- Statistiques par équipe

#### 2. Onglet "Joueurs" (`/admin` - Tab: Players)
**Fonctionnalités:**
- Sélection d'une équipe
- **Affichage des informations de l'équipe:**
  - Nom de l'école
  - Classe
  - Coach (nom et contact)
  - Capitaine (nom et contact)
  - Liste des joueurs
- **Popup détaillé au clic sur coach/capitaine/joueur:**
  - Informations de contact complètes
  - Modification des informations
  - Email, téléphone, date de naissance
  - Position, numéro de maillot
- **Bouton "Gérer joueurs/coaches"** (en haut à droite):
  - Ajouter un joueur à l'équipe
  - Ajouter un coach à l'équipe
  - Modification des informations
- **Bouton "Gestion des Capitaines et Coachs":**
  - Définir/Changer le capitaine
  - Définir/Changer le coach
  - Gestion des rôles

#### 3. Onglet "Compositions" (`/admin` - Tab: Lineups)
**Fonctionnalités:**
- Liste des compositions
- Validation des compositions
- Consultation des compositions par match
- Modification des compositions

#### 4. Onglet "Matchs" (`/admin` - Tab: Matches)
**Fonctionnalités:**
- Liste de tous les matchs
- Création de matchs
- Modification de matchs
- Suppression de matchs
- Génération automatique de matchs (tous les jeudis)
- Filtres par date, équipe, statut
- Détails des matchs

#### 5. Onglet "Résultats" (`/admin` - Tab: Results)
**Fonctionnalités:**
- Liste des résultats
- Saisie de résultats
- Modification de résultats
- Validation de résultats
- Génération automatique de résultats
- Statistiques des résultats

#### 6. Onglet "Statistiques" (`/admin` - Tab: Statistics)
**Fonctionnalités:**
- Statistiques globales
- Statistiques par équipe
- Statistiques par joueur
- Graphiques et visualisations
- Export de statistiques
- Comparaisons

#### 7. Onglet "Activité" (`/admin` - Tab: Activity)
**Fonctionnalités:**
- Journal d'activité
- Actions récentes
- Historique des modifications
- Suivi des événements

#### 8. Onglet "Comptes" (`/admin` - Tab: Accounts)
**Fonctionnalités:**
- Liste de tous les comptes
- Comptes joueurs
- Comptes coaches
- État des comptes (actifs, inactifs)
- Réenvoi d'emails d'activation
- Modification de comptes
- Suppression de comptes
- Impersonation

#### 9. Onglet "Inscriptions" (`/admin` - Tab: Registrations)
**Fonctionnalités:**
- Redirection vers `/admin/team-registrations`
- Gestion des inscriptions d'équipes

#### 10. Onglet "Archives" (`/admin` - Tab: Archives)
**Fonctionnalités:**
- Redirection vers `/admin/archives`
- Consultation des saisons archivées

#### 11. Onglet "Réparations" (`/admin` - Tab: Maintenance)
**Fonctionnalités:**
- **Export / Import de données:**
  - Export CSV des équipes
  - Export CSV des joueurs
  - Export CSV des matchs
  - Export CSV des résultats
  - Export JSON complet (backup)
  - Import CSV des joueurs
- **Outils de réparation:**
  - Capitaliser les noms
  - Corriger les emails
  - Nettoyer les doublons
  - Synchroniser les noms d'équipes
  - Synchroniser les coaches
  - Remplacement massif d'emails
  - Réinitialisation de la base de données
  - Nettoyage des données
  - Détection de doublons
  - Vérification des comptes
  - Vérification des noms d'équipes

### Pages Admin Supplémentaires

#### Route: `/admin/team-registrations`
**Fonctionnalités:**
- Liste des inscriptions d'équipes
- Filtres (pending, approved, rejected)
- Validation d'inscription
- Rejet d'inscription
- Édition d'inscription
- Suppression d'inscription
- Envoi d'invitations collaboratives
- Workflow de validation complet

#### Route: `/admin/accounts`
**Fonctionnalités:**
- Gestion avancée des comptes
- Recherche de comptes
- Filtres multiples
- Actions en masse

#### Route: `/admin/user-accounts`
**Fonctionnalités:**
- Liste des comptes utilisateurs
- Gestion des profils
- Modification des rôles

#### Route: `/admin/team-accounts`
**Fonctionnalités:**
- Comptes par équipe
- Association joueurs/coaches/équipes
- Gestion des relations

#### Route: `/admin/search`
**Fonctionnalités:**
- Recherche globale
- Recherche par nom, email, équipe
- Résultats multiples
- Navigation rapide

#### Route: `/admin/impersonate`
**Fonctionnalités:**
- Impersonation d'utilisateurs
- Se faire passer pour un joueur
- Se faire passer pour un coach
- Retour à l'interface admin

#### Route: `/admin/stats`
**Fonctionnalités:**
- Statistiques avancées
- Analytics
- Rapports détaillés
- Export de rapports

#### Route: `/admin/archives`
**Fonctionnalités:**
- Archives des saisons
- Consultation des données archivées
- Statistiques historiques
- Export des archives

#### Route: `/admin/duplicates`
**Fonctionnalités:**
- Détection de doublons
- Fusion de comptes
- Nettoyage des doublons

#### Route: `/admin/media`
**Fonctionnalités:**
- Gestion des médias
- Upload de fichiers
- Gestion des logos d'équipes
- Gestion des photos de profil

#### Route: `/admin/email-preview`
**Fonctionnalités:**
- Aperçu des emails
- Test d'envoi d'emails
- Templates d'emails

#### Route: `/admin/notification-tracking`
**Fonctionnalités:**
- Suivi des notifications
- Statistiques d'envoi
- Taux d'ouverture
- Taux de clics

---

## 📝 Système d'Inscription

### Route: `/register-team`
**Fonctionnalités:**
- Inscription d'équipe (mode complet)
- Saisie des informations de l'équipe
- Informations du capitaine
- Liste des joueurs
- Informations du coach (optionnel)
- Sauvegarde automatique (localStorage)
- Soumission de l'inscription

### Route: `/register-team/collaborative`
**Fonctionnalités:**
- Inscription d'équipe (mode collaboratif)
- Invitation du capitaine
- Invitation des joueurs
- Invitation du coach
- Complétion progressive

### Route: `/register-team/complete`
**Fonctionnalités:**
- Finalisation de l'inscription
- Confirmation
- Redirection

### Route: `/join-team/[token]`
**Fonctionnalités:**
- Rejoindre une équipe via token
- Acceptation de l'invitation
- Création de compte si nécessaire

### Route: `/join-team-coach/[token]`
**Fonctionnalités:**
- Rejoindre comme coach via token
- Acceptation de l'invitation coach
- Création de compte coach

### Route: `/team-registration/[token]`
**Fonctionnalités:**
- Consultation de l'inscription
- Modification de l'inscription
- Statut de l'inscription

### Route: `/update-registration/[token]`
**Fonctionnalités:**
- Mise à jour de l'inscription
- Modification des informations
- Ajout de joueurs

---

## ⚽ Gestion des Matchs

### Création de Matchs
- **Manuelle**: Création individuelle par l'admin
- **Automatique**: Génération automatique (tous les jeudis)
  - Date du premier match
  - Heure des matchs
  - Nombre de matchs par jeudi
  - Génération de tous les matchs de la saison

### Types de Matchs
- Matchs de championnat
- Matchs amicaux
- Matchs de coupe

### Statuts de Matchs
- `scheduled`: Programmé
- `in_progress`: En cours
- `completed`: Terminé
- `cancelled`: Annulé
- `postponed`: Reporté

### Fonctionnalités Matchs
- Consultation des matchs
- Modification des matchs
- Annulation de matchs
- Report de matchs
- Saisie de résultats
- Validation de résultats
- Compositions d'équipe
- Statistiques par match

---

## 📊 Statistiques et Classements

### Statistiques Globales
- Nombre total d'équipes
- Nombre total de joueurs
- Nombre total de matchs
- Buts marqués
- Buts encaissés
- Moyennes

### Statistiques par Équipe
- Matchs joués
- Victoires, défaites, nuls
- Buts marqués/encaissés
- Différence de buts
- Points
- Classement

### Statistiques par Joueur
- Matchs joués
- Buts marqués
- Passes décisives
- Cartons (jaunes, rouges)
- Temps de jeu
- Moyennes

### Classement
- Classement des équipes
- Points
- Différence de buts
- Buts marqués
- Buts encaissés
- Historique des positions

---

## 🔔 Notifications

### Types de Notifications
- **Admin**: Notifications de l'admin
- **Coach**: Notifications du coach
- **Système**: Notifications système
- **Match**: Notifications de matchs
- **Résultat**: Notifications de résultats
- **Équipe**: Notifications d'équipe

### Fonctionnalités Notifications
- Envoi de notifications
- Réception de notifications
- Marquer comme lu/non lu
- Suppression de notifications
- Notifications push (PWA)
- Historique des notifications
- Filtres par type

### Notifications Push (PWA)
- Demande de permission
- Notifications en temps réel
- Notifications hors ligne
- Gestion des permissions

---

## ✨ Fantasy Mode

### Fonctionnalités Fantasy
- Sélection d'équipe Fantasy
- Points Fantasy
- Classement Fantasy
- Statistiques Fantasy
- Animations et effets visuels
- Mode public et mode personnel

### Calcul des Points Fantasy
- Points par but
- Points par passe décisive
- Points par victoire
- Points par match joué
- Bonus et malus

---

## 💾 Export/Import de Données

### Export de Données

#### Export CSV des Équipes
- **Route**: `/api/admin/export/teams`
- **Format**: CSV
- **Contenu**: Toutes les informations des équipes
- **Utilisation**: Analyse, sauvegarde, reporting

#### Export CSV des Joueurs
- **Route**: `/api/admin/export/players`
- **Format**: CSV
- **Contenu**: Toutes les informations des joueurs
- **Utilisation**: Analyse, sauvegarde, reporting

#### Export CSV des Matchs
- **Route**: `/api/admin/export/matches`
- **Format**: CSV
- **Contenu**: Tous les matchs avec détails
- **Utilisation**: Analyse, calendrier, reporting

#### Export CSV des Résultats
- **Route**: `/api/admin/export/results`
- **Format**: CSV
- **Contenu**: Tous les résultats de matchs
- **Utilisation**: Analyse, statistiques, reporting

#### Export JSON Complet (Backup)
- **Route**: `/api/admin/export/all`
- **Format**: JSON
- **Contenu**: Toutes les données (équipes, joueurs, matchs, résultats)
- **Utilisation**: Sauvegarde complète, restauration, migration

### Import de Données

#### Import CSV des Joueurs
- **Route**: `/api/admin/import/players`
- **Format**: CSV
- **Fonctionnalités**:
  - Création de nouveaux joueurs
  - Mise à jour des joueurs existants (par email)
  - Validation des données
  - Rapport détaillé de l'import
  - Gestion des erreurs

---

## 🔌 APIs Disponibles

### APIs Admin

#### Gestion des Équipes
- `GET /api/admin/teams` - Liste des équipes
- `POST /api/admin/teams` - Créer une équipe
- `PUT /api/admin/teams` - Modifier une équipe
- `DELETE /api/admin/teams` - Supprimer une équipe
- `GET /api/admin/team-accounts` - Comptes par équipe

#### Gestion des Joueurs
- `GET /api/admin/players` - Liste des joueurs
- `POST /api/admin/add-player-to-team` - Ajouter un joueur à une équipe
- `POST /api/admin/add-player-complete` - Ajouter un joueur complet
- `POST /api/admin/delete-player-complete` - Supprimer un joueur
- `POST /api/admin/update-player-email` - Mettre à jour l'email d'un joueur

#### Gestion des Coaches
- `POST /api/admin/create-coach-account` - Créer un compte coach
- `POST /api/admin/sync-team-coaches` - Synchroniser les coaches

#### Gestion des Comptes
- `GET /api/admin/all-users` - Tous les utilisateurs
- `GET /api/admin/user-accounts` - Comptes utilisateurs
- `GET /api/admin/get-account-details` - Détails d'un compte
- `POST /api/admin/update-account` - Mettre à jour un compte
- `POST /api/admin/delete-account` - Supprimer un compte
- `POST /api/admin/create-account-by-email` - Créer un compte par email
- `POST /api/admin/create-account-from-player` - Créer un compte depuis un joueur
- `POST /api/admin/create-missing-accounts` - Créer les comptes manquants
- `POST /api/admin/create-player-accounts` - Créer des comptes joueurs

#### Inscriptions
- `POST /api/admin/validate-team-registration` - Valider une inscription
- `POST /api/admin/delete-registration` - Supprimer une inscription
- `POST /api/admin/update-team-name-in-registration` - Mettre à jour le nom d'équipe

#### Matchs
- `POST /api/admin/generate-matches` - Générer des matchs automatiquement
- `POST /api/admin/generate-results` - Générer des résultats

#### Statistiques
- `GET /api/admin/general-stats` - Statistiques générales
- `GET /api/admin/fantasy-stats` - Statistiques Fantasy
- `GET /api/admin/notification-stats` - Statistiques de notifications
- `GET /api/admin/page-analytics` - Analytics des pages

#### Maintenance
- `POST /api/admin/capitalize-data` - Capitaliser les données
- `POST /api/admin/fix-emails` - Corriger les emails
- `POST /api/admin/fix-gmaill` - Corriger les emails Gmail
- `POST /api/admin/clean-duplicate-users` - Nettoyer les doublons
- `POST /api/admin/detect-duplicates` - Détecter les doublons
- `POST /api/admin/replace-email` - Remplacer un email
- `POST /api/admin/sync-team-names` - Synchroniser les noms d'équipes
- `POST /api/admin/reset-database` - Réinitialiser la base de données
- `POST /api/admin/clear-data` - Nettoyer les données
- `POST /api/admin/check-accounts-status` - Vérifier le statut des comptes
- `POST /api/admin/check-team-names` - Vérifier les noms d'équipes
- `POST /api/admin/reset-team-status` - Réinitialiser le statut d'équipe

#### Export/Import
- `GET /api/admin/export/teams` - Export CSV des équipes
- `GET /api/admin/export/players` - Export CSV des joueurs
- `GET /api/admin/export/matches` - Export CSV des matchs
- `GET /api/admin/export/results` - Export CSV des résultats
- `GET /api/admin/export/all` - Export JSON complet
- `POST /api/admin/import/players` - Import CSV des joueurs

#### Emails
- `POST /api/admin/resend-activation` - Renvoyer l'email d'activation
- `POST /api/admin/resend-player-email` - Renvoyer l'email joueur
- `POST /api/admin/resend-player-emails` - Renvoyer les emails joueurs
- `POST /api/admin/resend-coach-email` - Renvoyer l'email coach
- `POST /api/admin/send-password-reset` - Envoyer la réinitialisation de mot de passe
- `POST /api/admin/send-never-logged-in-emails` - Envoyer aux jamais connectés
- `POST /api/admin/send-custom-notification` - Envoyer une notification personnalisée

#### Notifications
- `POST /api/admin/send-test-notification-youssef` - Test de notification
- `GET /api/admin/notification-stats` - Statistiques de notifications

#### Saisons
- `POST /api/admin/end-season` - Fin de saison
- `GET /api/admin/season-archives` - Archives des saisons

#### Capitaines et Coaches
- `GET /api/admin/captains-coaches` - Liste des capitaines et coaches
- `POST /api/admin/set-captains` - Définir les capitaines
- `POST /api/admin/set-captains-from-registration` - Définir depuis l'inscription

#### Autres
- `POST /api/admin/change-role` - Changer le rôle
- `POST /api/admin/manage-account` - Gérer un compte
- `POST /api/admin/update-auth-email` - Mettre à jour l'email d'authentification
- `POST /api/admin/update-phone` - Mettre à jour le téléphone
- `POST /api/admin/update-device-info` - Mettre à jour les infos de l'appareil
- `POST /api/admin/remove-contact-account` - Supprimer un compte de contact
- `POST /api/admin/generate-update-link` - Générer un lien de mise à jour
- `POST /api/admin/delete-team-complete` - Supprimer une équipe complète

### APIs Coach

- `POST /api/coach/send-notification` - Envoyer une notification
- `POST /api/coach/notify-followers` - Notifier les followers

### APIs Joueur

- `GET /api/players` - Liste des joueurs
- `GET /api/favorites` - Favoris

### APIs Équipe

- `GET /api/teams` - Liste des équipes
- `POST /api/team/set-acting-coach` - Définir un coach intérimaire
- `POST /api/upload-team-logo` - Upload de logo d'équipe

### APIs Profil

- `GET /api/profile` - Profil utilisateur
- `POST /api/profile/update` - Mettre à jour le profil
- `POST /api/profile/upload-photo` - Upload de photo (serveur)
- `POST /api/profile/upload-photo-client` - Upload de photo (client)

### APIs Notifications

- `GET /api/notifications` - Liste des notifications
- `POST /api/notifications/mark-read` - Marquer comme lu

### APIs Matchs

- `POST /api/match-results` - Résultats de matchs
- `POST /api/generate-results` - Générer des résultats
- `POST /api/fix-match-status` - Corriger le statut d'un match

### APIs Inscription

- `GET /api/get-registration-by-token` - Inscription par token
- `POST /api/update-registration` - Mettre à jour l'inscription
- `POST /api/send-captain-invite-email` - Envoyer l'invitation capitaine
- `POST /api/send-coach-invite-email` - Envoyer l'invitation coach

### APIs Notifications Admin

- `POST /api/notify-admin` - Notifier l'admin
- `POST /api/notify-admin-team-ready` - Notifier équipe prête
- `POST /api/notify-admin-collaborative-created` - Notifier création collaborative

### APIs Analytics

- `POST /api/track-page-view` - Suivre les vues de pages
- `POST /api/track-time-spent` - Suivre le temps passé
- `POST /api/track-notification-permission` - Suivre les permissions de notifications
- `POST /api/track-fantasy-click` - Suivre les clics Fantasy
- `POST /api/update-statistics` - Mettre à jour les statistiques

### APIs Utilitaires

- `POST /api/create-admin` - Créer un admin
- `POST /api/cleanup-duplicates` - Nettoyer les doublons
- `POST /api/force-cleanup` - Nettoyage forcé
- `POST /api/seed` - Seed de données
- `POST /api/seed-players` - Seed de joueurs
- `POST /api/test-email` - Test d'email
- `POST /api/test-player-email` - Test d'email joueur
- `POST /api/test-notify-collaborative` - Test notification collaborative
- `POST /api/test-notify-team-ready` - Test notification équipe prête

---

## 🎨 Thèmes et Interfaces

### Thèmes Disponibles
- **Public**: Interface publique standard
- **Sofa**: Interface style SofaScore
- **Premier League**: Interface style Premier League

### Composants UI
- Cards animées
- Modals
- Dropdowns
- Badges
- Buttons
- Inputs
- Loading spinners
- Navigation bars
- Bottom navigation (mobile)

### Responsive Design
- Desktop
- Tablet
- Mobile
- PWA ready

---

## 🔒 Sécurité

### Authentification
- Firebase Authentication
- Email/Password
- Google Sign-In
- Vérification d'email
- Réinitialisation de mot de passe

### Autorisation
- Rôles basés sur Firestore
- Vérification des permissions
- Protection des routes
- Validation côté serveur

### Données
- Firestore Security Rules
- Validation des données
- Sanitization
- Protection CSRF

---

## 📱 PWA (Progressive Web App)

### Fonctionnalités PWA
- Installation sur appareil
- Mode hors ligne
- Notifications push
- Service Worker
- Manifest
- Cache stratégique

---

## 🌍 Internationalisation

### Langues Supportées
- Français (par défaut)
- Anglais (en développement)
- Arabe (en développement)

### Composants i18n
- Sélecteur de langue
- Traductions dynamiques
- Formatage des dates
- Formatage des nombres

---

## 📈 Analytics

### Suivi des Événements
- Vues de pages
- Temps passé
- Clics
- Conversions
- Notifications

### Statistiques
- Utilisateurs actifs
- Pages populaires
- Taux d'engagement
- Notifications ouvertes

---

## 🎯 Fonctionnalités Spéciales

### Coach Intérimaire
- Un joueur peut devenir coach intérimaire si l'équipe n'a pas de coach
- L'admin choisit le coach intérimaire
- Le joueur garde son statut de joueur
- Accès aux fonctionnalités coach
- Badge "Coach Intérimaire" visible
- Basculement entre interface joueur et coach

### Impersonation
- L'admin peut se faire passer pour un utilisateur
- Test des fonctionnalités utilisateur
- Debugging
- Support utilisateur

### Recherche Globale
- Recherche par nom
- Recherche par email
- Recherche par équipe
- Résultats multiples
- Navigation rapide

### Badges et Récompenses
- Collection de badges
- Badges par accomplissement
- Progression
- Affichage dans le profil

### Favoris
- Équipes favorites
- Joueurs favoris
- Matchs favoris
- Liste personnalisée

---

## 📚 Collections Firestore

### Collections Principales
- `teams` - Équipes
- `players` - Joueurs
- `coachAccounts` - Comptes coaches
- `playerAccounts` - Comptes joueurs
- `teamRegistrations` - Inscriptions d'équipes
- `matches` - Matchs
- `matchResults` - Résultats de matchs
- `lineups` - Compositions
- `notifications` - Notifications
- `userProfiles` - Profils utilisateurs
- `users` - Utilisateurs (legacy)

### Collections Secondaires
- `seasonArchives` - Archives des saisons
- `fantasyTeams` - Équipes Fantasy
- `favorites` - Favoris
- `analytics` - Analytics
- `deviceInfo` - Informations d'appareils

---

## 🚀 Workflows Principaux

### 1. Inscription d'Équipe
1. Visiteur accède à `/register-team`
2. Remplit le formulaire d'inscription
3. Soumet l'inscription
4. Admin reçoit une notification
5. Admin valide/rejette l'inscription
6. Si validée: création des comptes, envoi d'emails
7. Joueurs/Coach reçoivent des invitations
8. Création des comptes et association aux équipes

### 2. Création de Matchs
1. Admin accède à l'onglet "Matchs"
2. Génère automatiquement ou crée manuellement
3. Matchs programmés
4. Coaches créent les compositions
5. Matchs joués
6. Résultats saisis
7. Statistiques mises à jour automatiquement

### 3. Gestion d'Équipe (Coach)
1. Coach accède à son dashboard
2. Consulte les prochains matchs
3. Crée les compositions
4. Saisit les résultats
5. Consulte les statistiques
6. Envoie des notifications aux joueurs

### 4. Expérience Joueur
1. Joueur se connecte
2. Consulte son dashboard
3. Voit les prochains matchs
4. Consulte ses statistiques
5. Reçoit des notifications
6. Participe au mode Fantasy

### 5. Fin de Saison
1. Admin déclare la fin de saison
2. Données archivées
3. Matchs et résultats supprimés
4. Statistiques réinitialisées
5. Équipes et joueurs conservés
6. Archives accessibles

---

## 📝 Notes Techniques

### Technologies Utilisées
- **Framework**: Next.js 16
- **Base de données**: Firebase Firestore
- **Authentification**: Firebase Auth
- **Storage**: Firebase Storage
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Email**: Resend

### Structure du Projet
- `/app` - Pages et routes
- `/components` - Composants React
- `/lib` - Utilitaires et hooks
- `/api` - API routes
- `/docs` - Documentation

### Bonnes Pratiques
- Code modulaire
- Composants réutilisables
- Gestion d'erreurs
- Loading states
- Validation des données
- Sécurité

---

## 🔄 Mises à Jour Récentes

### Dernières Fonctionnalités Ajoutées
- ✅ Système de coach intérimaire
- ✅ Export/Import CSV et JSON
- ✅ Amélioration de la gestion joueurs/coaches
- ✅ Affichage du statut coach dans la liste des équipes
- ✅ Popup détaillé pour modification des informations
- ✅ Affichage de l'école et de la classe
- ✅ Consolidation des fonctionnalités admin

---

**Document généré le**: $(date)
**Version**: 1.0.0
**Dernière mise à jour**: 2025-01-XX

