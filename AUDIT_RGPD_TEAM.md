# Audit RGPD / données personnelles — team.gowrax.me

**Date :** 7 juillet 2026 (révision post-implémentation admin / RGPD / emails)  
**Version initiale :** 5 juillet 2026  
**Périmètre :** repo `web-team-grx` (frontend `web/`, API `api/`, migrations, overlay `stream/`)  
**Responsable du traitement (identifié par le commanditaire) :** Association **Gowrax Esport** — contact : teamgowrax@gmail.com  
**Usage du livrable :** alimenter `docs/LEGAL_KNOWN.md` sur le site vitrine (`PepoRwa.github.io` / gowrax.me). **Aucun texte juridique final ici.**

---

## Résumé exécutif

1. **team.gowrax.me** est un hub **privé** (membres Discord « Membre Gowrax ») : Next.js export statique sur **GitHub Pages**, API **Render**, auth **Supabase Discord OAuth**, données métier **MySQL YorkHost** (base partagée avec le bot).
2. Identifiant pivot : **`discord_id`**. Données compte : pseudo Discord, avatar, **email** (depuis JWT Supabase, persisté depuis migration 015), pseudo d’affichage, IDs jeu, URL tracker, préférences notifs, statut d’accès — table `users`.
3. **Panneau fondateur** (`/hub/admin`, `canAdmin`) : liste complète des comptes (emails, comptes inconnus), kill-switch `is_disabled`, journal `admin_audit_log`, export RGPD par compte.
4. **Export RGPD self-service** : `GET /profiles/me/export` (JSON portabilité + accès). Email de notification à la désactivation (Resend, no-reply) avec mention origine email + lien PC gowrax.me.
5. Contenus collaboratifs : VODs, strats (images Supabase Storage), annonces, scouting adverse (Riot ID/tag **tiers**), commentaires staff — stockés MySQL avec auteur `discord_id`.
6. Notifications : cloche in-app + file `notifications` → bot Discord. **Alerte fondateur** à chaque nouvelle inscription (DM ou salon `DISCORD_SECURITY_CHANNEL_KEY`), dédupliquée (`signup_notified`).
7. **Page de connexion** : mention conformité lois françaises + liens vers `https://gowrax.me/privacy` et `https://gowrax.me/cgu` (`web/src/components/legal-login-notice.tsx`).
8. **Pas** de bannière cookies analytics ; session auth + préférences en `localStorage`. **Effacement compte global** toujours absent (désactivation ≠ suppression).
9. Rectification : `PATCH /profiles/me`. Roster public filtré (≥1 rôle, non désactivé) ; fondateur voit tous les comptes via `/admin`.
10. Tiers : Supabase, Render, GitHub, YorkHost, Discord, **Resend** (emails), Google Gemini (scouting IA optionnel). Pas d’analytics sur le hub team.
11. **Gaps résiduels pour PC/CGU :** durées de conservation, effacement définitif compte, mineurs, DPA sous-traitants, scouting tiers + Gemini, partage MySQL bot.

---

## 1. Périmètre & architecture

### 1.1 URLs et stack

| Composant | URL / hébergeur | Rôle RGPD (traitement) |
|-----------|-----------------|------------------------|
| Frontend hub | `https://team.gowrax.me` — **GitHub Pages** (Actions → branche `gh-pages`) | Interface utilisateur, session auth client, appels API |
| API | `https://api.team.gowrax.me` — **Render** | Contrôleur principal : auth JWT, CRUD MySQL, queue Discord, Storage, Gemini |
| Auth | **Supabase** (cloud) | OAuth Discord, émission JWT, Storage images strats |
| BDD | **MySQL YorkHost** (`DB_HOST` dans `.env.example`) | Persistance comptes, contenus, rôles, files bot |
| Bot Discord | YorkHost (repo séparé) | Sync rôles, envoi Discord — **lecture/écriture MySQL** (cf. `BOT_INTEGRATION.md`) |

Source : `ARCHITECTURE.md`, `api/RENDER.md`, `.github/workflows/deploy-web.yml`.

### 1.2 Structure du repo

| Dossier | Contenu |
|---------|---------|
| `web/` | Frontend Next.js 15 (static export), PWA (`sw.js`, `manifest.json`) |
| `api/` | API Express TypeScript — **dépôt Git séparé** (`api-gowrax-staff`), déployée sur Render |
| `migrations/` | Schéma MySQL 001–**016** (site + admin/privacy + dédup alertes) |
| `stream/` | Overlay tournoi CEFUC (HTML / StreamElements) — **non déployé** sur team.gowrax.me par défaut |
| Racine | Docs (`ARCHITECTURE.md`, `BOT_INTEGRATION.md`, `SITE_SETUP.md`, prompts audit) |

### 1.3 Flow auth — qui traite quoi

```
Utilisateur
  → [Supabase] OAuth Discord (identité, JWT)
  → [Frontend team.gowrax.me] stocke session Supabase (navigateur)
  → [API Render] vérifie JWT (service_role Supabase), extrait discord_id
  → [API Render] upsert table users (MySQL)
  → [API Render] INSERT sync_roles_requests
  → [Bot YorkHost] lit sync_roles_requests, met à jour user_roles depuis Discord
  → [API Render] lit user_roles → permissions (canAccessSite, isStaff, canScout…)
```

| Étape | Responsable technique | Données concernées |
|-------|----------------------|-------------------|
| Login Discord | Supabase + Discord | Identité OAuth Discord (scope **non documenté dans le repo**) |
| Session | Supabase (client) + navigateur | Tokens session Supabase |
| Profil site | API Render → MySQL | discord_id, username, avatar, profil étendu |
| Autorisation | API Render (lecture MySQL) | Rôles Discord synchronisés |
| Messages Discord | Bot (via table `notifications`) | Payloads JSON (titres, mentions discord_id) |

Références : `ARCHITECTURE.md` L20–31, `api/src/lib/supabase.ts` L19–42, `api/src/services/users.service.ts` L32–48, `BOT_INTEGRATION.md` L27–35.

### 1.4 Accès au service

- Hub **non public** : middleware `requireMember` exige le rôle Discord « Membre Gowrax » (`canAccessSite`) — `api/src/lib/permissions.ts` L69.
- Phase **launch** : avant ouverture, `assertLaunchAccess` bloque les non-CEO (`LAUNCH_LOCKED`) — `api/src/services/launch.service.ts` L86–98.
- `GET /launch/status` est **public** (sans auth) — `api/src/routes/launch.ts` L18–24.

---

## 2. Données personnelles — inventaire

Légende : **O** = obligatoire pour usage, **F** = facultatif, **A** = automatique, **—** = non documenté dans le code.

### 2.1 Table `users` (migrations 001, 003, 009, 011, **015**, **016**)

| Donnée | Source | Oblig. | Stockage | Durée | Finalité |
|--------|--------|--------|----------|-------|----------|
| `discord_id` | Discord OAuth via Supabase | O (auth) | MySQL `users` | — | Identifiant unique membre |
| `supabase_user_id` | Supabase JWT | A | MySQL | — | Lien compte Supabase |
| `username` | Discord (`user_metadata` Supabase) | A | MySQL | — | Affichage, sync Discord |
| `display_name` | Formulaire onboarding / profil | F | MySQL | — | Pseudo public hub |
| `avatar_url` | Discord metadata | A | MySQL | — | Avatar profil |
| `twitch_username`, `twitch_linked_at` | — (colonnes existantes) | — | MySQL | — | **Non exposées** par l’API profil site actuelle ; usage probable **bot** |
| `tracker_url` | Profil membre | F | MySQL | — | Lien tracker stats |
| `riot_id`, `steam_id` | Profil membre | F | MySQL | — | IDs jeu |
| `game` | Profil (valorant/cs2/other) | F (défaut valorant) | MySQL | — | Segmentation |
| `notify_vod_dm`, `notify_strat_dm` | Profil / onboarding (défaut true) | F | MySQL | — | Opt-in DM Discord via bot |
| `onboarding_completed_at` | Complétion wizard | A si onboarding | MySQL | — | État première connexion |
| `email` | JWT Supabase (Discord OAuth) | A à la connexion | MySQL | — | Contact, notifs sécurité, admin fondateur |
| `email_updated_at` | Système | A | MySQL | — | Dernière MAJ email |
| `last_login_at` | Connexion | A | MySQL | — | Dernière activité |
| `is_disabled`, `disabled_at`, `disabled_by_discord_id`, `disabled_reason` | Fondateur (admin) | — | MySQL | — | Kill-switch accès hub |
| `signup_notified` | Système | A | MySQL | — | Dédup alerte nouvelle inscription |
| `created_at`, `updated_at` | Système | A | MySQL | — | Audit technique |

Email : lu dans `verifyAccessToken` (`api/src/lib/supabase.ts`) et **persisté** à chaque connexion / sync (`api/src/services/users.service.ts`). Backfill possible via `POST /admin/backfill-emails` (fondateur, depuis Supabase Auth). **Non exposé** aux membres via `formatUser()` ; visible fondateur via `formatUserAdmin()`.

### 2.2 Rôles & sync (`002_sync_roles.sql`)

| Donnée | Source | Oblig. | Stockage | Durée | Finalité |
|--------|--------|--------|----------|-------|----------|
| `user_roles` (discord_id + role_id) | Bot ← Discord | A (membre) | MySQL | — | Contrôle d’accès hub |
| `discord_roles` (catalogue) | Seed migration | — | MySQL | — | Référentiel rôles |
| `sync_roles_requests` | API au login | A à chaque sync | MySQL | — | File sync bot |

Le site **ne écrit pas** `user_roles` (BOT_INTEGRATION.md L71–72).

### 2.3 VODs (`004_site_vods.sql`)

| Donnée | Source | Oblig. | Stockage | Durée | Finalité |
|--------|--------|--------|----------|-------|----------|
| Métadonnées match (titre, map, date, score, adversaire…) | Formulaire membre | O (création VOD) | MySQL `vods` | — | Bibliothèque replays |
| `link` (URL externe) | Formulaire | O | MySQL | — | Accès replay (YouTube, etc.) |
| `author_discord_id` | Session | A | MySQL | — | Propriété contenu |
| `players_present` (JSON discord_ids) | Formulaire | F | MySQL | — | Présence joueurs au match |
| `description_pro` | Formulaire (VOD pro) | F | MySQL | — | Notes staff |
| `reviewed_by_discord_id`, `reviewed_at` | Staff | F | MySQL | — | Revue |
| `notify_discord` | Formulaire | F | MySQL | — | Annonce salon Discord |
| Commentaires (`vod_comments`) | Staff | O si commentaire | MySQL | — | Débrief ; `is_private` masqué aux non-staff |

Schéma validation : `api/src/schemas/vods.ts`.

### 2.4 Strat-Book (`005_site_strats.sql`)

| Donnée | Source | Oblig. | Stockage | Durée | Finalité |
|--------|--------|--------|----------|-------|----------|
| Titre, description, map, side | Formulaire | O | MySQL `strats` | — | Tactiques équipe |
| `valoplant_url`, `vod_url` | Formulaire | F | MySQL | — | Liens externes |
| `image_path` | Upload staff (multer 5 Mo) | F | MySQL + **Supabase Storage** | — | Schéma visuel |
| `author_discord_id`, `status` | Session / rôle | A | MySQL | — | Workflow published/proposed |

### 2.5 Notifications in-app (`006`, `009`)

| Donnée | Source | Oblig. | Stockage | Durée | Finalité |
|--------|--------|--------|----------|-------|----------|
| `site_notifications` (titre, message, link) | API (VOD/strat/objectif) | — | MySQL | — | Cloche hub |
| `recipient_discord_id` / `target_roster_role_id` | API | — | MySQL | — | Ciblage |
| `site_notification_reads` | Action utilisateur | A si lu | MySQL | — | État lecture |

### 2.6 Transmissions & annonces (`007`, `009`, `010`)

| Donnée | Source | Oblig. | Stockage | Durée | Finalité |
|--------|--------|--------|----------|-------|----------|
| `transmission_templates` | CEO/Team Manager | O | MySQL | — | Modèles messages |
| `site_announcements` (+ auteur, avatar, rôle, corps) | Transmission | O | MySQL | — | Fil annonces hub / popup featured |
| `site_announcement_reads` | Membre | A si lu | MySQL | — | Suivi lecture |

Envoi Discord : `notifications.payload` JSON — `api/src/services/discord-queue.service.ts`.

### 2.7 Saison & launch (`008`, `012`)

| Donnée | Source | Oblig. | Stockage | Durée | Finalité |
|--------|--------|--------|----------|-------|----------|
| Bandeau saison | Staff | F | MySQL `season_banner` | — | Objectif saison |
| Config launch, message CEO | Migration / CEO | — | MySQL `site_launch` | — | Ouverture hub |

### 2.8 Scouting adverse (`014_site_scouting.sql`)

| Donnée | Source | Oblig. | Stockage | Durée | Finalité |
|--------|--------|--------|----------|-------|----------|
| Tournois / équipes / notes | Staff/roster | — | MySQL scouting_* | — | Prep compétition |
| **Joueurs adverses** : `riot_id`, `riot_tag`, rangs, stats, agent_pool, notes | Saisie manuelle | O (fiche joueur) | MySQL | — | Analyse adverse |
| `updated_by_discord_id`, `verified_by_discord_id` | Session staff | A | MySQL | — | Traçabilité |
| Analyse IA (texte) | Gemini API | F (bouton) | **Non persisté** (réponse API directe) | — | Synthèse tactique |

**Note RGPD :** données sur **personnes tierces** (adversaires) sans mécanisme de consentement visible dans le code.

### 2.9 File bot `notifications` (001, usage API)

| Donnée | Source | Oblig. | Stockage | Durée | Finalité |
|--------|--------|--------|----------|-------|----------|
| `type`, `channel_key`, `discord_id`, `payload` JSON | API | — | MySQL | — | Envoi différé Discord |
| `sent`, `sent_at`, `error` | Bot | A | MySQL | — | État envoi |

Contenu payload exemple : titre VOD, `<@discord_id>` auteur — `discord-queue.service.ts` L40–51.

### 2.10 Tables MySQL présentes mais **non utilisées par l’API site** (grep code `api/src`)

Présentes dans `001_initial.sql`, traitement probable **bot uniquement** : `absences`, `matches`, `match_assignments`, `tickets`, `reaction_role_panels`, `live_announcements`.  
**Impact privacy :** même base YorkHost — politique globale asso/bot à articuler.

### 2.11 Stockage client (frontend)

| Donnée | Clé / mécanisme | Oblig. | Durée | Finalité |
|--------|-----------------|--------|-------|----------|
| Session Supabase (tokens) | localStorage (supabase-js, `persistSession: true`) | O connexion | Jusqu’à expiration / logout | Auth — `web/src/lib/supabase.ts` L6–11 |
| Thème UI | `localStorage` `gowrax-theme` | F | Indéfinie | UX — `web/src/components/providers.tsx` L9–28 |
| Bandeau PWA dismiss | `localStorage` `gowrax-pwa-install-dismissed` | F | Indéfinie | UX — `web/src/hooks/usePwaInstall.ts` L5–36 |
| Service Worker | Cache navigateur (pass-through fetch) | A PWA | — | `web/public/sw.js` |

**Cookies :** aucun cookie applicatif first-party identifié ; auth Supabase utilise le stockage navigateur par défaut (typiquement localStorage).

### 2.12 Inventaire par endpoint API

| Route | Auth | Données lues/écrites |
|-------|------|----------------------|
| `GET /health` | Public | État MySQL, statut Gemini (config) |
| `GET /launch/status` | Public | Config launch (message CEO possible) |
| `PATCH /launch/` | CEO | `site_launch` |
| `POST /auth/sync` | JWT | users upsert, sync_roles_requests |
| `GET /auth/me`, `/auth/permissions` | JWT | users, permissions |
| `POST /auth/resync-roles` | Membre | sync_roles_requests |
| `GET /profiles`, `GET /profiles/:id` | Membre | Profils **membres actifs** (≥1 rôle, non désactivés) ; désactivés invisibles |
| `GET/PATCH /profiles/me` | Membre | Profil propre |
| `GET /profiles/me/export` | Membre | **Export RGPD JSON** (portabilité) — rate-limit 6/h |
| CRUD `/vods/*` | Membre (+ staff comments) | vods, vod_comments, notifications |
| CRUD `/strats/*` | Membre (+ staff image) | strats, Supabase Storage |
| `/notifications/*` | Membre | site_notifications, reads |
| `/transmissions/*` | CEO/Team Manager | templates, announcements, notifications Discord |
| `/announcements/*` | Membre | site_announcements, reads |
| `GET/PATCH /season` | Membre / staff | season_banner |
| CRUD `/scouting/*` | Scout (staff/roster) | scouting_*, Gemini si analyze |
| `POST /scouting/teams/:id/analyze` | Scout | Envoi JSON stats → **Google Gemini** |
| `GET /admin/users`, `GET /admin/users/:id` | **Fondateur** (`canAdmin`) | Tous comptes + **emails** + statut désactivation |
| `PATCH /admin/users/:id/access` | Fondateur | Kill-switch `is_disabled` + **email Resend** si désactivation |
| `GET /admin/users/:id/export` | Fondateur | Export RGPD d’un compte cible |
| `POST /admin/backfill-emails` | Fondateur | Sync emails depuis Supabase Auth |
| `POST /admin/test-email` | Fondateur | Aperçu mail de blocage (fondateur) |
| `GET /admin/audit` | Fondateur | Journal `admin_audit_log` |

Référence routes : `api/src/routes/index.ts`, `api/README.md`.

### 2.13 Admin, emails & audit (`015_admin_privacy.sql`, `016_signup_dedupe.sql`)

| Donnée / artefact | Source | Stockage | Finalité |
|-------------------|--------|----------|----------|
| `admin_audit_log` (actor, action, target, detail JSON, ip_hash) | Actions fondateur | MySQL | Traçabilité RGPD (accountability) |
| Email désactivation | Resend API | Transit (pas stocké) | Information membre suspendu |
| `signup_notified` | Première alerte inscription | MySQL `users` | Éviter doublons DM Discord |
| Mention PC/CGU connexion | Affichage statique | Frontend | Information pré-contractuelle |

**Email désactivation** (`api/src/lib/email.ts`) : expéditeur **no-reply** (`EMAIL_FROM`), corps expliquant origine email (Discord/Supabase), lien contact `teamgowrax@gmail.com`. Pas de `Reply-To` vers no-reply.

**Kill-switch** : `is_disabled` vérifié dans `authMiddleware` avant toute route authentifiée — bloque même avec JWT valide et rôles Discord. Fondateur (`FOUNDER_DISCORD_ID`) exempt.

**Journal audit** visible dans `/hub/admin` (UI) ; actions : `user.disable`, `user.enable`, `emails.backfill`, `email.test_disabled`.

---

## 3. Auth & tiers

### 3.1 Supabase & Discord OAuth

- Frontend : `signInWithOAuth({ provider: 'discord' })` — `web/src/hooks/useAuth.tsx` L86–93.
- Redirect : `{origin}/auth/callback/`.
- Côté API, extraction : `identities` provider `discord` ou `user_metadata.provider_id` — `api/src/lib/supabase.ts` L24–27.
- Champs utilisés : `email`, `full_name` / `name` / `global_name`, `avatar_url` (metadata).
- **Scopes Discord OAuth** : **non configurés dans ce repo** (réglage dashboard Supabase / Discord Developer Portal).

### 3.2 JWT / session client

- Clés publiques build : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (GitHub Actions secrets — `.github/workflows/deploy-web.yml`).
- Token API : header `Authorization: Bearer <access_token>` sur chaque appel — `web/src/lib/api.ts`.
- Côté API : vérification via `supabaseAdmin.auth.getUser(token)` + **service_role** (serveur uniquement) — `api/src/lib/supabase.ts` L4–8.

### 3.3 CORS

- Origines autorisées : variable `ALLOWED_ORIGINS` (défaut dev + `https://team.gowrax.me`) — `api/src/config/env.ts` L24–27, `api/src/app.ts` L35–52.
- Requêtes sans `Origin` refusées par CORS (`callback(null, false)`).

### 3.4 Scripts & ressources tierces (team.gowrax.me)

| Tiers | Présent sur team ? | Détail |
|-------|-------------------|--------|
| **Supabase** | Oui | Auth + Storage |
| **Render API** | Oui | Toutes données métier |
| **Google Fonts** | Non (runtime) | `DM Sans` via `next/font/google` (auto-hébergé au build) — `web/src/app/layout.tsx` L3–13 |
| **Analytics** | **Non** | Aucun gtag/Plausible/etc. (grep négatif) |
| **Google Gemini** | Oui (optionnel) | Analyse scouting — `api/src/lib/gemini.ts` |
| **Resend** | Oui (optionnel) | Emails notification désactivation — `api/src/lib/email.ts` |
| **URLs VOD / Valoplant** | Liens utilisateur | Hébergeurs externes variables |

### 3.5 Overlay `stream/` (StreamElements)

- Fonts **Google Fonts CDN** dans `stream/streamelements/cefuc-cup.html`.
- Noms roster/staff en dur — **pas** connecté à l’API team ; usage OBS/SE local.

### 3.6 Information légale à la connexion

- Composant `LegalLoginNotice` sur la page d’accueil (`/`) et la page launch (`/launch/`) : renvoi vers **Politique de confidentialité** (`https://gowrax.me/privacy`) et **CGU** (`https://gowrax.me/cgu`) du site vitrine gowrax.me, avec mention conformité aux lois françaises.
- **Pas** de case à cocher explicite avant OAuth ; le clic « Entrer avec Discord » vaut prise de connaissance des documents liés (à confirmer juridiquement par l’asso).

---

## 4. Sécurité (aperçu privacy)

### 4.1 Contrôles techniques

| Mesure | Implémentation |
|--------|----------------|
| Validation entrées | Zod (`api/src/schemas/*`, `validateBody` / `validateQuery`) |
| Auth | JWT Bearer obligatoire (sauf `/health`, `/launch/status`) |
| RBAC | `requireMember`, `requireStaff`, `requireTransmit`, `requireScout`, **`requireFounder`** (`canAdmin`) |
| Kill-switch compte | `is_disabled` dans `authMiddleware` — bloque tout accès JWT |
| Rate limiting | Global, auth, upload, scouting IA (12/h), **export RGPD (6/h)** |
| Audit actions admin | Table `admin_audit_log` ; IP hashée si `AUDIT_IP_SALT` |
| Emails | Resend (no-reply) ; pas de stockage contenu email en MySQL |
| Headers sécurité | Helmet, `Cache-Control: no-store` API, bloc paths suspects |
| Upload images | MIME whitelist, 5 Mo max — `api/src/lib/storage.ts` |
| Secrets | `.env` / Render env ; `.env.example` sans secrets réels (sauf IP host exemple) |

### 4.2 Matrice d’accès (simplifiée)

| Donnée | Membre | Roster | Staff | CEO/TM |
|--------|--------|--------|-------|--------|
| Profils membres | Lecture roster filtré | Idem | Idem | **Tous comptes + emails** via `/admin` |
| VODs | CRUD si auteur ou staff | Idem | Comments privés | Idem |
| Strats published | Lecture | Idem | CRUD + image | Idem |
| Strats proposed | Ses propres | Idem | Modération | Idem |
| Transmissions | Non | Non | Non | Oui |
| Scouting | Non | Oui | Oui | Oui |
| Saison (edit) | Non | Non | Oui | Oui |
| Launch (edit) | Non | Non | Non | CEO |
| Désactivation compte | Non | Non | Non | **Fondateur** (`canAdmin`) |

`permission_level` en base (`discord_roles`) : CEO 40 → Coach 10 — `migrations/002_sync_roles.sql` L35–44. `canAdmin` = CEO **ou** `FOUNDER_DISCORD_ID` (env).

### 4.3 Logs & Discord

- Logs serveur : `console.error` / `console.warn` ponctuels (storage, gemini) — pas de politique de rétention documentée.
- Embeds Discord : pseudos, titres VOD/strats, **mentions discord_id** — visibilité = salons / DMs Discord Gowrax.

### 4.4 XSS

- React échappe le HTML par défaut ; pas de `dangerouslySetInnerHTML` sur contenus utilisateur (sauf script SW inline layout — `layout.tsx` L42).
- Analyse IA affichée en texte (`whitespace-pre-wrap`) — `web/src/components/scouting-ai-panel.tsx`.

---

## 5. Droits utilisateurs & gaps

| Droit | État dans le code |
|-------|-------------------|
| **Accès / information** | Profil `/profiles/me` ; **export JSON** `/profiles/me/export` |
| **Rectification** | `PATCH /profiles/me` (displayName, IDs jeu, prefs notifs) |
| **Effacement compte** | **Absent** — `is_disabled` = suspension, pas suppression ; pas de purge Supabase automatisée |
| **Effacement contenu** | VOD/strat/scouting supprimables (auteur/staff) ; pas de cascade globale user |
| **Portabilité / export** | **Implémenté** — `GET /profiles/me/export` (membre) ; fondateur peut exporter tout compte |
| **Opposition / retrait consentement** | Opt-out partiel : `notify_vod_dm`, `notify_strat_dm` ; désactivation par fondateur |
| **Consentement inscription** | **Partiel** — liens PC/CGU sur page connexion ; pas de checkbox avant OAuth |
| **Mineurs / âge minimum** | **Non traité** dans le code |
| **Décisions automatisées** | Trust factor scouting = calcul règles ; analyse Gemini = aide staff, pas décision contraignante |
| **Notification suspension** | Email automatique (Resend) à la désactivation, avec explication origine email |

---

## 6. Sous-traitants & transferts

| Sous-traitant | Rôle | Données concernées | Localisation / note |
|---------------|------|-------------------|---------------------|
| **Supabase Inc.** | Auth OAuth, Storage | Identité, JWT, images strats | USA — région projet **non lue dans le repo** |
| **Render** | Hébergement API | Trafic API, variables env (secrets) | USA (typique) |
| **GitHub (Microsoft)** | Pages + CI | Code, secrets build, export statique | USA |
| **YorkHost** | MySQL | Toutes tables persistance | **Non documenté** (hébergeur bot + API) |
| **Discord Inc.** | OAuth + messages bot | ID, pseudo, avatar, contenus notifs | USA |
| **Google (Gemini API)** | IA scouting (optionnel) | JSON équipes/joueurs adverses + stats | USA — si `GEMINI_API_KEY` configurée |
| **Resend Inc.** | Emails transactionnels | Adresse email destinataire, contenu notification | USA — si `RESEND_API_KEY` configurée |
| **Hébergeurs VOD** (YouTube, etc.) | Liens replays | Selon URL saisie | Variable |

**DPA / clauses SCC :** non mentionnés dans le repo.

---

## 7. Hors périmètre team.gowrax.me

| Service | Lien | Rapport |
|---------|------|---------|
| Site vitrine | `gowrax.me` — repo `PepoRwa.github.io` | **PC** (`/privacy`) et **CGU** (`/cgu`) — référencées sur la page connexion team |
| Asso | `asso.gowrax.me` (mention utilisateur) | Non audité ici |
| Bot Discord | YorkHost, repo bot séparé | Voir `AGENT_PROMPT_AUDIT_BOT.md`, `BOT_INTEGRATION.md` |
| MySQL partagé | Tables bot (tickets, absences…) | Même responsable de traitement à clarifier |

---

## 8. Questions ouvertes pour l’asso

1. **Base légale** du hub membre : intérêt légitime association vs exécution contrat vs consentement ?
2. **Scopes Discord** exacts configurés dans Supabase (identify seul ou email aussi ?).
3. **Durées de conservation** par catégorie (comptes inactifs, VODs, scouting, logs Render/YorkHost, file `notifications`).
4. **Procédure droit à l’effacement** : qui traite la demande (teamgowrax@gmail.com) ? suppression Supabase + ligne `users` + contenus ? rôle du bot ?
5. **Données scouting** (joueurs adverses Riot ID) : base légale, information des personnes concernées, durée ?
5bis. **Données tryouts** (candidats recrutement non membres : Riot ID, stats tracker, notes staff, évaluations privées) : base légale intérêt légitime recrutement ; durée conservation recommandée 12 mois après statut `rejected` ou `joined` ; pas d'accès candidat au hub en V1 ; transparence lors du premier contact Discord (hors site).
6. **Gemini** : acceptation envoi données adverses à Google ? DPA Google AI / désactivation prod ?
7. **Mineurs** dans l’effectif / roster : règle d’éligibilité association ?
8. **Localisation** projet Supabase (EU vs US) et DPA signés (Supabase, Render, YorkHost).
9. **MySQL partagé bot** : registre unique ou traitements distincts documentés ?
10. **Email** : désormais stocké en MySQL ; utilisé pour notifs sécurité (Resend) et panneau admin — **à refléter dans la PC gowrax.me**.
11. **Consentement connexion** : liens PC/CGU ajoutés — suffisant juridiquement ? case à cocher recommandée ?

---

## 9. Texte suggéré pour LEGAL_KNOWN (site vitrine)

Copier/adapter dans `docs/LEGAL_KNOWN.md` côté gowrax.me :

- **Service `team.gowrax.me`** : hub privé réservé aux membres de l’association Gowrax Esport (authentification Discord via Supabase). Contact : teamgowrax@gmail.com.
- **Responsable de traitement** : Association Gowrax Esport (à confirmer statuts).
- **Données traitées (hub)** : identifiant Discord, pseudo et avatar Discord, **adresse email** (connexion Discord/Supabase), pseudo d’affichage choisi, rôles synchronisés depuis le serveur Discord, identifiants de jeu (Riot, Steam), URL tracker, préférences de notification, contenus publiés (VODs, tactiques, annonces), données de scouting compétitif sur équipes adverses (dont identifiants Riot publics), **données tryouts** sur candidats recrutement tiers (Riot ID, stats, notes staff — sans accès candidat V1), journal d’audit des actions administrateur (sans IP en clair si sel configuré).
- **Hébergement** : site statique GitHub Pages ; API Render ; base de données YorkHost ; authentification Supabase ; images tactiques Supabase Storage ; emails transactionnels Resend (no-reply).
- **Destinataires / sous-traitants** : Supabase, Render, GitHub, YorkHost, Discord, **Resend** ; Google (Gemini) uniquement si fonction analyse IA scouting activée.
- **Transferts hors UE** : possibles selon localisation Supabase/Render/Resend/Google — vérifier région projet et garanties (DPA, SCC).
- **Durées de conservation** : *[à définir par l’asso — non codées]* ; comptes désactivés conservés en base (suspension, pas effacement).
- **Droits** : accès, rectification (profil membre), **portabilité (export JSON depuis « Mon profil »)**, effacement *[procédure à publier — suspension possible via fondateur, suppression définitive non automatisée]*, limitation, opposition (notifications Discord partiellement via préférences profil). Réclamation CNIL possible.
- **Cookies / traceurs** : pas de mesure d’audience identifiée sur le hub ; session d’authentification et préférences stockées dans le navigateur (localStorage) ; PWA (service worker).
- **Connexion au service** : utilisation soumise aux lois françaises et aux documents **Politique de confidentialité** et **CGU** publiés sur gowrax.me (liens sur l’écran de connexion team.gowrax.me).
- **Emails** : notifications de suspension d’accès envoyées depuis une adresse **no-reply** ; le mail indique l’origine de l’adresse (OAuth Discord/Supabase) et le contact association.
- **Décisions automatisées** : scores de confiance scouting et analyses IA à titre d’aide à la décision humaine.
- **Services liés non couverts par la même notice** : site public gowrax.me, espace asso.gowrax.me, bot Discord (voir notices dédiées).
- **Date d’entrée en vigueur hub v1** : juin 2026 (launch documenté migration 012).

---

## 10. Références fichiers clés

| Fichier | Sujet |
|---------|--------|
| `ARCHITECTURE.md` | Stack, flow auth |
| `BOT_INTEGRATION.md` | Partage MySQL, bot vs site |
| `migrations/001_initial.sql` – `017_tryouts.sql` | Schéma données |
| `api/src/lib/supabase.ts` | JWT, champs Discord/email |
| `api/src/services/users.service.ts` | Upsert user MySQL |
| `api/src/lib/permissions.ts` | RBAC |
| `api/src/services/discord-queue.service.ts` | Payloads Discord |
| `web/src/hooks/useAuth.tsx` | OAuth client |
| `web/src/lib/supabase.ts` | Session persistée |
| `api/.env.example` | Variables & tiers |
| `migrations/015_admin_privacy.sql`, `016_signup_dedupe.sql` | Email, kill-switch, audit, dédup alertes |
| `api/src/lib/email.ts` | Resend, template désactivation |
| `api/src/services/privacy.service.ts` | Export RGPD |
| `api/src/services/admin.service.ts` | Panneau fondateur |
| `api/src/services/audit.service.ts` | Journal audit |
| `api/src/services/security-alerts.service.ts` | Alerte nouvelle inscription |
| `api/src/middleware/auth.ts` | Kill-switch, `requireFounder` |
| `web/src/components/legal-login-notice.tsx` | Liens PC/CGU connexion |
| `web/src/app/hub/admin/page.tsx` | UI admin + journal audit |
| `web/src/app/hub/profiles/me/page.tsx` | Bouton export RGPD membre |

---

| `api/src/lib/gemini.ts` | Transfert IA scouting |

---

## 11. Changelog post-audit (juillet 2026)

| Date | Évolution | Impact RGPD |
|------|-----------|-------------|
| 07/07 | Migration 015 : email, `is_disabled`, `admin_audit_log` | Stockage email ; traçabilité ; suspension accès |
| 07/07 | Export RGPD membre + admin | Portabilité (art. 20) |
| 07/07 | Panneau fondateur `/hub/admin` | Accès emails, kill-switch, journal |
| 07/07 | Emails Resend (désactivation, no-reply) | Information + transparence origine email |
| 07/07 | Alerte Discord nouvelle inscription | Sécurité ; dédup `signup_notified` (016) |
| 07/07 | Liens PC/CGU page connexion | Information pré-contractuelle |
| 08/07 | Module Try Outs interne (`017_tryouts.sql`) | Données tiers candidats recrutement ; accès staff + capitaines lecture seule |

---

*Document audit technique — révision 7 juillet 2026. Ne constitue pas un avis juridique.*
