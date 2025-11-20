## ComeBac League – Functional Specification Document (FSD)

### 1. Introduction
ComeBac League est une plateforme web pour gérer une ligue scolaire (joueurs, entraîneurs, admins) avec inscription d’équipes, gestion sportive, statistiques et expériences interactives (fantasy, notifications, PWA).

---

### 2. Rôles et Accès

| Rôle        | Auth requis | Accès principaux |
|-------------|-------------|------------------|
| **Visiteur**| Non         | Pages publiques, inscription équipe, visionnage résultats |
| **Joueur**  | Oui         | Dashboard joueur, profil, matches, notifications, fantasy |
| **Coach**   | Oui         | Dashboard coach, team management, stats, uploads |
| **Admin**   | Oui         | Console admin complète (teams, players, maintenance, stats) |

---

### 3. Flux d’Inscription

#### 3.1 Inscription d’Équipe (sans compte)
1. Page `register-team` (2 modes : complète / collaborative).
2. Saisie team info, capitaine, joueurs, coach (optionnel).
3. Sauvegarde auto brouillon (localStorage).
4. Soumission -> création doc Firestore `teamRegistrations` (`pending`).
5. Notification admin `POST /api/notify-admin`.
6. Admin valide/rejette → update doc + workflows (création comptes, emails, etc.).

#### 3.2 Compte joueur/coach
- **Signup email** : `signUpWithEmail`, vérification e-mail obligatoire.
- **Google sign-in** : popup puis fallback redirect, mise à jour profile et redirection selon rôle.
- **Pré-provisionné coach** : admin peut créer doc `coachAccounts`; lors signup, l’UID est associé si email match.
- **Password reset** : via `resetPassword`.

---

### 4. Console Admin

#### 4.1 Dashboard principal
- Widgets stats (pending/approved teams, joueurs actifs, notifications).
- Navigation vers onglets: `teams`, `players`, `matches`, `statistics`, `maintenance`, `accounts`, `search`, etc.

#### 4.2 Team Registrations
- Liste cartes (pending/approved/rejected) avec filtres.
- Actions: approbation, rejet, édition, suppression, invites collaboratives.
- Workflow validation: création comptes joueurs (Firestore), envoi emails, synchronisation `teamRegistrations`.

#### 4.3 Maintenance Tab
- Outils de « réparation » : capitaliser noms, fix emails, nettoyer doublons, remplacement massif email, sync noms, etc.
- Actions via boutons → `fetch` API admin.

#### 4.4 Team Accounts / Player Accounts
- Listing complet (stats, filtres, recherche).
- Actions: resend activation emails, edit profile, impersonate, assign coach.

#### 4.5 Notifications
- Envoi custom notifications (modal), tracking open/click.

#### 4.6 Stats & Matches
- Visualisations (matchs, résultats, tables).
- Gestion match results, lineups, scoreboard.
- Intégration `maintenance-tab` pour calculs/updates.

---

### 5. Expérience Joueur

#### 5.1 Dashboard
- Accès rapide matches, stats équipe, notifications, badges.

#### 5.2 Matches & Résultats
- Pages `player/matches`, détails match, formulaires (selon rôle).
- Participation à fantasy mode, vote, stats.

#### 5.3 Profil
- Édition infos perso, photo (upload base64 via client API), stats persos.

#### 5.4 Notifications
- Dropdown & page dédiée.
- Notification permission (PWA) + `notification-prompt`.

---

### 6. Expérience Coach

- Similar à joueur mais orienté team management :
  - Page `coach/team`: roster, stats, upload photo, updates.
  - `coach/lineups`, `coach/stats`, `coach/matches`.
  - Outils admin-light (ex : assignation joueurs, stats match).

---

### 7. Pages Publiques

- `public/` (home, matches, ranking, stats, players showcase, teams).
- Landing marketing (cards animées, CTA inscription).
- Section fantasy pub (effets `Math.random`, animations).
- PWA prompts, SEO components.

---

### 8. Notifications & Emails

#### 8.1 Système email
- Utilise Resend (`sendEmail`).
- Templates : welcome player, coach, admin notifications.

#### 8.2 API notification admin
- `/api/notify-admin` (inscription) -> email `contact@comebac.com`.
- Autres API: `notify-admin-team-ready`, `notify-admin-collaborative-created`.

#### 8.3 Push / UI Notifications
- Firestore `notifications` collection.
- Admin/coach peuvent créer notifications (batch).

---

### 9. Gestion des Matchs et Stats

- Collections `matches`, `matchResults`, `teams`, `players`.
- Scripts maintenance (update stats, generate results, fix statuses).
- Coach/Joueur consultent via dashboards.

---

### 10. Fantasy Mode

- Pages fantasie (public et joueur) avec animations, stats.
- Interactions UI (cartes, background dynamique).

---

### 11. UI/UX

- Next 16 + Tailwind + Framer Motion.
- Thèmes multi (public, sofa, premier-league).
- Responsive cards, modals, toasts.
- PWA readiness: prompts, offline notifications.
- Uploads images (admin -> Storage; client -> base64 Firestore).

---

### 12. Interactions clés

#### Admin
1. Valider équipe: `team-registrations` → `approve`.
2. Réparer données: Maintenance actions (calls API).
3. Gérer comptes: edit, impersonate, resend emails.

#### Coach
1. Consulter match: Dashboard → match details, update lineups.
2. Upload photo: `/api/profile/upload-photo`.

#### Joueur
1. Consulter profil, stats.
2. Recevoir notifications (admin announces).
3. Participer fantasy / matches.

#### Visiteur
1. Lire info publique.
2. S’inscrire comme équipe via wizard collaboratif/complet.

---

### 13. Sécurité & Auth

- Firebase Auth (email/password, Google).
- Rôles via Firestore docs (`userProfiles`).
- Admin endpoints (id token required; certaines routes pas encore protégées).
- Client runtime (Next “use client”).

---

### 14. Scripts Utilitaires

- `scripts/register-se7en-team.ts`, `register-icons-team.ts`.
- `scripts/test-team-registration-email.ts` (test notifs admin).
- Divers scripts maintenance (fix emails, update stats, etc.).

---

### 15. Données & Collections

- `teamRegistrations`: soumissions équipes.
- `playerAccounts`, `coachAccounts`: profils.
- `teams`, `players`, `matches`, `matchResults`.
- `notifications`, `userProfiles`.
- `users` (legacy auth data).

---

### 16. Workflows Résumés

1. **Inscription équipe** → `teamRegistrations` [pending] → admin email → validation → création comptes.
2. **Coach pré-provisionné** → doc `coachAccounts` → invitation email → signup → UID lié.
3. **Match update** → admin/coach met scores → scripts calcul stats.
4. **Maintenance fix** → bouton maintenance → API admin effectue modification.

---

### 17. Annexes – API principales (extrait)

| Endpoint                              | Méthode | Description |
|--------------------------------------|---------|-------------|
| `/api/notify-admin`                  | POST    | Email admin nouvelle équipe |
| `/api/admin/validate-team-registration` | POST | Valide inscription (admin) |
| `/api/profile/upload-photo(-client)` | POST    | Upload photo joueur/coach |
| `/api/admin/fix-emails`              | POST    | Maintenance emails |
| `/api/admin/create-coach-account`    | POST    | Création compte coach (admin) |
| `/api/admin/update-player-email`     | POST    | Remplacement email joueur |

---

### 18. Notes et Limitations

- Certaines routes admin manquent encore d’auth server-side (risque).
- Upload photo client stocke base64 (risque taille doc).
- Lint ESLint incomplet (nombreux warning).
- Turbopack instable → prefer Webpack (set `NEXT_DISABLE_TURBOPACK=1`).

---

Ce document sert de référence fonctionnelle : il couvre les rôles, workflows, modules et interactions de ComeBac League pour guider développement, QA et gestion produit.

