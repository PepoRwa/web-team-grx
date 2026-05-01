# 🎯 QUESTIONS STRATÉGIQUES POUR STRUCTURER LE ROADMAP V3
**Préparation de la phase de codage efficace — À compléter par l'équipe**

---

## 📋 CONTEXTE ACTUEL
- **Build ID**: GRX-HFH746J
- **Version**: V3 (Mai 2026)
- **État**: Commit clean restauré (4912504c)
- **Stack**: React 19 + Supabase + Vite + Tailwind
- **Composants actifs**: 21 (Calendar, Vods, Evolution, etc.)
- **Fonctionnalité critique en attente**: Slow Bloom (AI-based Evolution system)

---

## 🚀 BLOC 1: PRIORITÉS & PHASING

### Q1.1 — Quelle est la VRAIE priorité d'ici fin Mai ?
**Contexte**: Le roadmap liste 6 AJOUTS majeurs (Profil, Slow Bloom, Lineups, etc.) + 5 MODIFICATIONS + 2 SUPPRESSIONS.

**Options**:
- A) Finir Slow Bloom = 100% codebase focus (Profil attendu)

**Pourquoi ça compte**: Change totalement l'order des composants React à créer, les tables Supabase à modifier, et le timing de déploiement.

---

### Q1.2 — Est-ce que la "Page Profil" et "Slow Bloom" sont séparées ou liées ?
**Contexte**: Dans NEXT UPDATES, Slow Bloom est listé comme "panel au sein du profil" OU "page propre". Le AI_BUILD_UPDATES parle d'architecture, mais pas de UI hosting.

**Options**:
- C) Les deux, mais Slow Bloom peut fonctionner standalone si besoin

**Pourquoi ça compte**: Si c'est lié, on doit créer la structure de base Profil d'abord. Si c'est séparé, on peut coder Slow Bloom indépendamment avec juste une bannière "Accéder à mon Evolution" sur le profil.

---

### Q1.3 — VOD "Enhanced" vs Slow Bloom : quel est l'ordre logique ?
**Contexte**: VOD Pro/Coach Review est une modification urgente (onglet à rajouter, title/players fields, reviewed flag). Slow Bloom est une grosse feature mais optionnelle initialement.

**Options**:
- A) VOD d'abord (rapide win, utilisé par les coachs avant Slow Bloom)

**Pourquoi ça compte**: VOD réutilise le VodCommentsModal = risque de conflit. Mieux de finir l'un avant l'autre, OU vraiment paralléliser.

---

## 🗄️ BLOC 2: ARCHITECTURE DB & DATA

### Q2.1 — Quel est le schéma EXACT attendu pour la table `vods` ?
**Contexte**: Actuellement il y a `vods(id, user_id, link, map, date, status, score, opponent, author_name, created_at)`. Le roadmap ajoute `title`, `is_pro`, `is_reviewed`, `players_present`.

**Question précise**: 
- `title` = TEXT nullable ou required ? REP: Required
- `is_pro` = BOOLEAN (default false) ? REP: Oui
- `is_reviewed` = BOOLEAN (default false) ou timestamps (reviewed_at, reviewed_by) ? REP: TIMESTAMPS. Notamment reviewed_by 
- `players_present` = JSON array de user IDs ? Format exact ? REP: JSON ARRAY. Appel de la table profil pour lier un profil utilisateur à une vod. Comme un "apparaît dans"
- Faut-il une table `vod_players` (join table) ou direct dans le JSON ? REP: Utilise JSON array dans vods.players_present. Simpler qu'une join table. 

**Pourquoi ça compte**: Impacte la logique des RLS, les migrations Supabase, et comment Gemini va coder les INSERT/UPDATE.

---

### Q2.2 — La table `evolution_submissions` existe-t-elle ? Quel schéma ?
**Contexte**: Slow Bloom doit stocker les dossiers de candidature avec scores, états (pending/accepted/refused), cooldowns, ineligibility flags.

**Besoin détaillé**:
- Champs obligatoires: `user_id`, `roster_source`, `roster_target`, `status`, `ai_score`, `submission_date`
- Champs optionnels: `tracker_rank`, `main_agents`, `motivation_text`, `availability_data`, `performance_links`, `staff_notes`, `decided_by`, `decision_date`, `cooldown_expires_at`, `is_ineligible_until`
- Faut-il une table séparée pour l'historique ? Ou versionning dans la table principale ?

**Pourquoi ça compte**: Détermine si on fait une grosse table ou une architecture multi-tables. Impact sur les queries et la performance.

REP: Elle n'existe pas encore. 
---

### Q2.3 — Comment stocker la "Banque de Mots" pour l'IA Slow Bloom ?
**Contexte**: Le AI_BUILD_UPDATES propose une banque locale (mots_positifs_gowrax, mots_negatifs, etc.) stockée en base, editable par le staff.

**Options**:
- A) Table `ai_keywords_bank` avec colonnes: `word`, `category`, `sentiment_value`, `weight`

**Pourquoi ça compte**: Affecte la maintenabilité future et si le staff peut updater les règles d'IA sans redeploy.

---

### Q2.4 — Les "Documents" (Profil) — where et how ?
**Contexte**: Le roadmap parle de "Documents généraux" (accessible tous) et "Documents personnalisés" (groupes/individuals). Besoin de protections anti-bypass.

**Options**:
- C) Une table unique + RLS policies strictes par user

**Pourquoi ça compte**: La sécurité RGPD dépend de ça. Mauvaise architecture = failles.

---

## 🎨 BLOC 3: DESIGN & UX

### Q3.1 — "Tone floral, lofi, détendu" pour Slow Bloom — c'est quoi concrètement ?
**Contexte**: Le roadmap dit ça pour Slow Bloom, mais pas de guide visuel précis. Autres pages sont "sombre tech" (gris/bleu). Contraste?

**Besoin**:
- Palette couleur exact (hex codes) ? Pastel vs vibrant ?
    REPS: 
    #F7CAD0 Rose quartz - Pour remplacer le Neon Magenta, idéal pour les reflets et les effets de brume.
    Lavande Gowrax (#B185DB) - Version adoucie du Gowrax Purple
    Bleu Éther (#A2D2FF) - Une déclinaison pastel du Void Blue (#1A1C2E) pour les fonds et les dégradés
    Nacre / Starlight White (#F0F2F5) - couleur de corps de texte actuelle, qui sert ici de base lumineuse pour l'ensemble
    --- 
    Accents Métalliques: 
    Or Poudré (#E9C46A) - À utiliser très discrètement
    Cyan Glacé (#BEE9E8) : Pour les effets "Neon" mais en version givrée,

- Font changes ? Rajat Dhani + Poppins comme base ou autre ?
    REP: Oui, mais on envisage l'utilisation de la police d'accent aussi. Rock Salt 
- Layout ? Cards simples, aéré ? Animations chill ou energetic ?
    REP: Aéré et animations chill.
- Exemple: Voir Figma / Pinterest / reference ?
    REP: Non

**Pourquoi ça compte**: Gemini doit coder les styles Tailwind exactement. Vague = itérations infinies.

---

### Q3.2 — Le Footer — component partagé ou injecté dans Layout ?
**Contexte**: Doit afficher: Build ID, Version, Copyright, User signup date, Privacy link. Apparaît sur TOUTES les pages.

**Options**:
- A) Composant `Footer.jsx` injecté en bas de `App.jsx`

**Pourquoi ça compte**: Si mal intégré, sera oublié ou cassé lors de futures modifs.

---

### Q3.3 — Esthétique générale: "Pastel + Sombre" — comment balancer ?
**Contexte**: Roadmap dit passer à couleurs plus claires/pastels, mais garder l'identité sombre. Contradiction apparente.

**Clarification**:
- Les backgrounds restent dark (#1A1C2E, #0F1419) ?
- Les accents/cards/highlights deviennent pastel ? REP: OUI
- Ratio? 80% dark / 20% pastel ou 50/50 ? REP: 50/50
- Quelles pages ? Toutes ou juste Slow Bloom ? REP: Slow Bloom et Profil et futures pages

PRECISION: La nouvelle DA de Gowrax part sur des tons pastels.
**Pourquoi ça compte**: Gemini va utiliser un ratio couleur partagé partout sinon.

---

## 🤖 BLOC 4: SLOW BLOOM / IA ARCHITECTURE

### Q4.1 — Le score IA: calcul local ou API ?
**Contexte**: AI_BUILD_UPDATES propose hybride local + Gemini Free Tier. Mais "token gratuit = limité". Risque de hitting limits.

**Décision à prendre**:
- B) Hybride comme proposé = Phase 1 local, Phase 2 via Gemini (si texte > 100 chars ou flag special)

**Contraintes connues**:
- Gemini Free = ~60 requests/min, ~1500 requests/day
- Slow Bloom = potentiellement 20-30 submissions/day en production
- = probablement OK, mais tight

**Pourquoi ça compte**: Détermine toute l'archi backend (Supabase Edge Functions? Lambda? Direct JS?).

---

### Q4.2 — Sentiment analysis & keyword bank: librairie ou custom ?
**Contexte**: AI_BUILD_UPDATES propose `sentiment` (Node.js) ou `natural` pour NLP local.

**Décision**:
- B) `natural` (plus powerful, mais lourd) + bank dynamique

**Pré-req check**:
- Quelles sont les dependencies déjà installées ? (package.json = React, Supabase, React-icons only) REP: Tout ce qui est dans package.json: 
    "@supabase/supabase-js": "^2.101.1",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-icons": "^5.6.0"
  "devDependencies": 
    "@eslint/js": "^9.39.4",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "autoprefixer": "^10.4.27",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "gh-pages": "^6.3.0",
    "globals": "^17.4.0",
    "postcss": "^8.5.8",
    "tailwindcss": "^3.4.19",
    "vite": "^8.0.1",
    "vite-plugin-pwa": "^1.2.0"
- Faut-il les rajouter ? (npm install sentiment) REP: Oui
- Où tourne le code ? Frontend React ou Supabase Functions ou Bot Discord ? REP: Frontend React.

**Pourquoi ça compte**: Affecte la stack, les dépendances, et où le code lives.

---

### Q4.3 — Cooldown: how to enforce ? (DB logic vs Frontend)
**Contexte**: Slow Bloom doit avoir 3 niveaux de cooldown:
1. "En attente" = dossier intouchable
2. "Accepted/Refused" = wait 30-60 jours
3. "Ineligible" = flag `is_ineligible_until`

**Options**:
- C) Hybrid (DB is source of truth, Frontend optimistic UI)

**Pourquoi ça compte**: Sécurité RGPD dépend que la DB forcée, pas la UI.

---

### Q4.4 — Tracker Valorant: qui gère l'intégration ? Bot ou Frontend ?
**Contexte**: Slow Bloom doit fetcher Valorant rank pour High Roster. "2 actes" = requires current + previous season data.

**Questions**:
- Qui a la clé API Riot Games ? (Bot Discord ou App web ?) REP: Personne. Je comptais passer par une free API
- Qui calle le fetch ? (User soumet pseudo → quand le rank s'update ?) REP: Quand il met son pseudo, ça lui demande si il a bien respecté la casse et tt, et il met "Récupérer mon rang" et ensuite ça indique son rang avec l'icone
- Ou stocker les résultats ? (Table `tracker_cache` ?) REP: Dans Evolution dans une table spécifique
- TTL ? (Données fraîches chaque jour ? Chaque heure ?) REP: Uniquement au moment de la constitution du dossier. valeur fixe.
- What if Riot API is down ? Fallback ? REP: Jsp.

**Pourquoi ça compte**: Si c'est pas clair, Slow Bloom sera bloquée sur cette dépendie externe.

---

### Q4.5 — Staff Interface: où et quoi exactement ?
**Contexte**: Roadmap dit "4 boutons pour le Staff: Valider d'office | Accepter pour Tryout | Mettre en attente | Refuser". Avec raisons pré-remplies et DM bot.

**Détails manquants**:
- Ça va dans l'Admin Panel ? Une page dédiée ? Un modal dans Profil ? REP: Dans le Evolution, avec une page en plus pour les staffs autorisés .
- Comment le staff voit les dossiers ? (Liste de tous? Filter par user? Timeline?) REP: Timeline / Filtre et une liste des dossiers ouverts ou en traitement. les traités apparaissent à part.
- Les "raisons pré-remplies" = textes hardcodés ou stockées en DB (editable) ? REP: Stockées en DB
- Le DM bot = comment déclenché ? (DB trigger? Manual click?) REP: Quand le staff finit le traitement, c'est déclenché via le bot discord. grâce à l'accès qu'ils donnent au compte. 

**Pourquoi ça compte**: Impact sur UI/UX et si c'est même un besoin frontend ou juste bot Discord.

---

## 📊 BLOC 5: SYNC & DATA INTEGRITY

### Q5.1 — "Synchronisation BOT-DB-CLIENT": c'est quoi exactement le problème ?
**Contexte**: Roadmap mentionne un problème avec `custom_affiliations` et role updates buggés.

**Besoin clarification**:
- Le bot met à jour les rôles Discord, mais la DB ne suit pas ?
- Ou l'inverse: DB est à jour, mais le frontend montre de l'old data ? REP: OUI
- Les "custom_affiliations" = field spécifique dans `members` table ? Quel est le bug ? 
    REP: Investiguer le schema et le UPDATE trigger

**À investiguer**:
- Voir les logs du bot (si dispos)
- Checker la dernière sync date
- Tester end-to-end: bot change rôle → check DB → check frontend

**Pourquoi ça compte**: Faut fixer ça avant de relier Slow Bloom à la DB (sinon ça va casc
ader les bugs).

---

### Q5.2 — Periodic logout: "forcer refresh photo profil ou sécuriser les accès"?
**Contexte**: Roadmap propose déconnecter tous les users par période. Raison: RAM DB + sécurité + refresh avatar.

**Options**:
- D) Juste faire un CORS/cache-bust sur les avatars (targeted solution)

**Considérations**:
- Combien de users concurrents ? (Si <50, logout simple OK) REP: Une vingtaine MAX
- Faut-il vraiment forcer ou juste expire les sessions ? REP: Expirer les sessions 

**Pourquoi ça compte**: Peut affecter la UX si mal géré (random logouts = frustration).

---

## 🗑️ BLOC 6: CLEANUP (Suppressions/Désactivations)

### Q6.1 — DevPanel: complète suppression ou juste désactivation ?
**Contexte**: Roadmap dit "Suppression. Retour sur Github pour les issues." Mais aussi "pouvoir désactiver des vues via un icone engrenage".

**Clarification**:
- Est-ce qu'on supprime le composant `DevPanel.jsx` du code ? REP: Oui et Non. On supprime TOUT le devpanel sauf els versions et pages bloquées.
- Ou on le laisse + le flag `disabled_pages` le cache juste ? REP: Non
- Les "paramètres du service" = c'est une page Settings globale ou per-user ? REP: C'est la page Admin mais ça nettoie un peu l'UX. Juste que via ce paramètre, ça permet aussi de rajouter des trucs comme des volumes ou des bails du genre dans le futur. Là c'est le dev panel (avec la gestion des Profils pour le staff, les pages bloquées (pour les DEVS) et la gestion de Version)

**Pourquoi ça compte**: Si on supprime, Gemini va nettoyer les imports. Si on keep, on doit garder la logique.

---

### Q6.2 — Page Roster: "Remplacement par Profil" — ça veut dire quoi exactement ?
**Contexte**: Roster existe actuellement? Est-ce une page ou un composant?

**Questions**:
- Roster page existe-t-elle dans le code ? (grep pour "Roster" ou "roster" route?) REP: Oui
- Si oui, c'est juste un rename vers Profil ou contenu différent ?
- Ou on crée une nouvelle Profil qui combine Roster + autres trucs ? REP: On crée la page Profil et ON SUPPRIME Roster

**Pourquoi ça compte**: Change si c'est une refactor simple ou une vraie reconstruction.

---

### Q6.3 — Realtime & Consoles data: vraiment supprimer ou juste pas afficher?
**Contexte**: "Désactivation / Suppression récupération données liées aux consoles" + "Désactivation Realtime (RGPD)".

**Options**:
- A) Supprimer les tables Supabase (`realtime_*`, `consoles_*`) = destructif

**Risque**: Suppression est destructif. Backups faites ?

**Pourquoi ça compte**: Si c'est une vraie suppression, faut backup d'abord.

---

## 📱 BLOC 7: MOBILE & RESPONSIVE

### Q7.1 — "Fonctionner aussi bien sur PC que sur mobile" — c'est testé comment ?
**Contexte**: User rappel strict, mais pas de mention de breakpoints ou device testing.

**Besoin**:
- Quels devices tester ? (iPhone 12/14/15? Android? iPad?) REP: Android. Iphone 14
- Tous les nouveaux composants doivent être mobile-first ? REP: De préférence
- Existe-t-il déjà des breakpoints Tailwind définis ? (sm, md, lg, xl) REP: Je sais pas
- Testing automatisé ou manuel ? REP: Les deux 

**Pourquoi ça compte**: Gemini va coder responsive, mais faut savoir les priorités (mobile-first vs desktop-first).

---

## 🔐 BLOC 8: SÉCURITÉ & RGPD

### Q8.1 — RLS policies: audit recent? Ou à blinder?
**Contexte**: "Blinder RLS" est listée dans Slow Bloom security. Existantes RLS sont où?

**Check needed**:
- Voir les RLS policies actuelles dans Supabase
REP: 
    [
  {
    "schema": "public",
    "table": "absences",
    "policy_name": "Création d'absence personnelle",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "INSERT",
    "using_filter": null,
    "check_filter": "(auth.uid() = user_id)"
  },
  {
    "schema": "public",
    "table": "absences",
    "policy_name": "Lecture des absences pour tous",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "absences",
    "policy_name": "Staff can manage all absences",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_filter": "(( SELECT ((profiles.custom_affiliations @> ARRAY['Staff'::text]) OR (profiles.is_dev = true))\n   FROM profiles\n  WHERE (profiles.id = auth.uid())) = true)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "absences",
    "policy_name": "Staff gère tout",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "absences",
    "policy_name": "Users can manage their own absences",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_filter": "(auth.uid() = user_id)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "app_version",
    "policy_name": "Public Read Access Version",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "app_version",
    "policy_name": "Staff Update Access Version",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "checkins",
    "policy_name": "Modif checkins",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_filter": "((auth.uid() = user_id) OR has_role('Fondateurs'::text) OR has_role('Staff'::text) OR has_role('Chef Staff'::text) OR has_role('Coach'::text) OR has_role('Head Coach'::text))",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "checkins",
    "policy_name": "Tout le monde peut voir les checkins",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "(auth.role() = 'authenticated'::text)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "coaching_goals",
    "policy_name": "Delete access",
    "is_permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "command": "DELETE",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "coaching_goals",
    "policy_name": "Insert access",
    "is_permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "command": "INSERT",
    "using_filter": null,
    "check_filter": "true"
  },
  {
    "schema": "public",
    "table": "coaching_goals",
    "policy_name": "Read full access",
    "is_permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "command": "SELECT",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "coaching_goals",
    "policy_name": "Update access",
    "is_permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "discord_cache",
    "policy_name": "Activer la lecture pour tout le monde",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "events",
    "policy_name": "Seul Staff Coach suppr_creates evts",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_filter": "(has_role('Fondateurs'::text) OR has_role('Staff'::text) OR has_role('Chef Staff'::text) OR has_role('Coach'::text) OR has_role('Head Coach'::text))",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "events",
    "policy_name": "Tout le monde peut voir les evts",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "(auth.role() = 'authenticated'::text)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "global_objective",
    "policy_name": "Seul le Staff peut modifier l'objectif",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_filter": "(has_role('Fondateurs'::text) OR has_role('Staff'::text) OR has_role('Chef Staff'::text) OR has_role('Coach'::text) OR has_role('Head Coach'::text))",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "global_objective",
    "policy_name": "Tout le monde peut voir l'objectif",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "(auth.role() = 'authenticated'::text)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "notifications",
    "policy_name": "Anyone can insert",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "INSERT",
    "using_filter": null,
    "check_filter": "true"
  },
  {
    "schema": "public",
    "table": "notifications",
    "policy_name": "Anyone can insert notifications",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "INSERT",
    "using_filter": null,
    "check_filter": "true"
  },
  {
    "schema": "public",
    "table": "notifications",
    "policy_name": "Users can update their notifications",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "UPDATE",
    "using_filter": "(auth.uid() = user_id)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "notifications",
    "policy_name": "Users can update their own notifications",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "UPDATE",
    "using_filter": "(auth.uid() = user_id)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "notifications",
    "policy_name": "Users can view their notifications",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "((auth.uid() = user_id) OR (user_id IS NULL))",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "notifications",
    "policy_name": "Users can view their own and global notifications",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "((auth.uid() = user_id) OR (user_id IS NULL))",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "player_notes",
    "policy_name": "Seul le staff peut ecrire et modifier les notes",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_filter": "(has_role('Fondateurs'::text) OR has_role('Staff'::text) OR has_role('Chef Staff'::text) OR has_role('Coach'::text) OR has_role('Head Coach'::text))",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "player_notes",
    "policy_name": "Seul le staff peut lire les notes",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "(has_role('Fondateurs'::text) OR has_role('Staff'::text) OR has_role('Chef Staff'::text) OR has_role('Coach'::text) OR has_role('Head Coach'::text))",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "profiles",
    "policy_name": "Public profiles are viewable by everyone.",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "profiles",
    "policy_name": "Users can update own profile.",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "UPDATE",
    "using_filter": "(auth.uid() = id)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "roles",
    "policy_name": "Roles are viewable by authenticated users.",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "(auth.role() = 'authenticated'::text)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "strats",
    "policy_name": "Ajout de strats autorisé",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "INSERT",
    "using_filter": null,
    "check_filter": "true"
  },
  {
    "schema": "public",
    "table": "strats",
    "policy_name": "Les joueurs voient les strats",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "strats",
    "policy_name": "Modification de strats autorisée",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "UPDATE",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "strats",
    "policy_name": "Suppression de strats autorisée",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "DELETE",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "user_availabilities",
    "policy_name": "Les utilisateurs modifient leurs propres dispos",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_filter": "(auth.uid() = user_id)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "user_availabilities",
    "policy_name": "Tout le monde peut voir les dispos",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "(auth.role() = 'authenticated'::text)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "user_documents",
    "policy_name": "Staff can manage all docs",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_filter": "(( SELECT ((profiles.custom_affiliations @> ARRAY['Staff'::text]) OR (profiles.is_dev = true))\n   FROM profiles\n  WHERE (profiles.id = auth.uid())) = true)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "user_documents",
    "policy_name": "Users can read their own documents",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "(auth.uid() = user_id)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "user_documents",
    "policy_name": "Users can view their own or public documents",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "((auth.uid() = user_id) OR (is_public = true))",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "user_roles",
    "policy_name": "User roles are viewable by authenticated users.",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "(auth.role() = 'authenticated'::text)",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "vod_comments",
    "policy_name": "Enable Delete Access Comments",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "DELETE",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "vod_comments",
    "policy_name": "Enable Insert Access Comments",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "INSERT",
    "using_filter": null,
    "check_filter": "(auth.uid() = author_id)"
  },
  {
    "schema": "public",
    "table": "vod_comments",
    "policy_name": "Enable Read Access Comments",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "vods",
    "policy_name": "Insertion VODs",
    "is_permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "command": "INSERT",
    "using_filter": null,
    "check_filter": "(auth.uid() = user_id)"
  },
  {
    "schema": "public",
    "table": "vods",
    "policy_name": "Lecture VODs",
    "is_permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_filter": "true",
    "check_filter": null
  },
  {
    "schema": "public",
    "table": "vods",
    "policy_name": "Suppression VODs",
    "is_permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "command": "DELETE",
    "using_filter": "true",
    "check_filter": null
  }
]
- Y a-t-il des policies que le staff a flagged comme faibles ? REP: Je suis pas dev pro mais pas trop.
- Faut-il une audit externe ou juste review interne ? REP: Les deux :3

**Pourquoi ça compte**: Faut pas inventer une faille en codant Slow Bloom.

---

### Q8.2 — Cloudflare anti-spam: "AU CAS OÛ IL Y AIT COMPROMISSION" — ça veut dire?
**Contexte**: Slow Bloom peut être rate-limited. Cloudflare peut aider, mais ça veut dire quoi "au cas où"?

**Clarification**:
- C'est une dépendance hard ou optional ? REP: Pas hard mais pas optional non plus. 
- Est-ce qu'on l'intègre MAINTENANT ou c'est du "à faire si attaque"? REP: Si on se fait cracker et que dcp ça balance des tonnes de requêtes
- Si maintenant: quel plan Cloudflare ? (Free, Pro, etc.?) REP: Free

**Pourquoi ça compte**: Affecte l'archi backend (workers, rules, etc.).

---

## 📈 BLOC 9: MONITORING & STATS

### Q9.1 — Datadog: vraiment utile ou "nice-to-have"?
**Contexte**: Roadmap dit "envisager" mais "pas obligé de s'en servir si trop complexe".

**Décision**:
- On inclut Datadog dans V3 ou on skip ? REP: On inclut si on a beaucoup d'appels. pour la gestion de statut c pas mal. mais il faut en mettre partout et me dire comment configurer
- Si oui: quels metrics ? (User count? Query performance? Errors?) REP: mettre les logs basiques et d'autres avancés, tu configures le dashboard après
- Budget/coût OK ? REP: Offert car étudiant

**Pourquoi ça compte**: Gemini veut savoir si ajouter des logs Datadog partout ou non.

---

### Q9.2 — Historique Slow Bloom: graphique d'évolution comment?
**Contexte**: "Graphique de l'évolution du score IA sur les 3 dernières demandes". Avec quelle librairie?

**Détails**:
- Chart.js ? Recharts ? Visx ? REP: La plus performante et belle. Chart js je pense
- Données stockées où ? (dans la même row ou table séparée?) REP: Dans la meme row. C'est juste une récup des 3 dernières données de l'utilisation.
- UI mockup existe? REP: Non

**Pourquoi ça compte**: Faut choisir la librairie et ajouter les dépendances.

---

## 🎯 BLOC 10: NICE-TO-HAVE & SUGGESTIONS

### Q10.1 — Comparaison "Roster Cible" dans Slow Bloom: MVP ou future?
**Contexte**: "L'IA pourrait dire: Ton rank est suffisant, mais l'équipe possède déjà 2 Mains Controllers..."

**Décision**:
- C'est une feature MVP (V3) ou V3.1 ? REP: MVP
- Données dispos ? (Faut fetch les rosters actuels + leurs agents?) REP: Ca pourrait être mais peut le scoper MVP mais c'est un nice-to-have si time permet
.
- Complexité AI acceptable ou trop heavy pour Phase 2 NLP? REP: Acceptable

**Pourquoi ça compte**: Peut être scopé out si tight de time.

---

### Q10.2 — Planning Slow Bloom: inline dans le formulaire ou externe?
**Contexte**: "Si le joueur n'a pas de planning, on lui demande de le mettre à jour sur la page prévue."

**Options**:
- A) Modal popup "Go remplir ton planning d'abord"

**Pourquoi ça compte**: UX et si on crée une dépendance circulaire.

---

## ✅ BLOC 11: ACCEPTANCE CRITERIA & VALIDATION

### Q11.1 — Comment valider que "tout marche PC + mobile"?
**Contexte**: Strict requirement, mais pas de test plan défini.

**À définir**:
- Test cases par page ? (Slow Bloom sur iPhone = 5 actions minimales?) REP: Non /3
- Performance targets ? (LCP < 3s? TTI < 5s?)  REP: Oui
- Browser compatibility ? (Chrome, Firefox, Safari, Edge?) REP: Oui 
- Automated tests ou manual ? REP: On peut tenter de faire du auto mais jsp comment

**Pourquoi ça compte**: Gemini doit coder pour un target, pas du vague.

---

### Q11.2 — "Tout marche aussi bien" = fonctionnalité identique ou optimized?
**Contexte**: Mobile peut pas tout afficher. Priorités?

**Clarification**:
- Sur mobile, faut-il réduire certains champs Slow Bloom? (Ex: 8 agents becomes 4?) REP: Oui
- Les données affichées sont les mêmes ou condensées? REP: Les mêmes mais adaptées
- Touch interactions (clics sur mobile)? Swipes? REP: Clics

**Pourquoi ça compte**: Affecte le responsive design strategy.

---

## 🎁 BONUS: PROCESS & WORKFLOW

### Q-PROCESS.1 — Git workflow: feature branches ou direct?
**Contexte**: Commit 4912504c est le base. Comment push les changes?

**À clarifier**:
- Branch per feature (feature/slow-bloom, feature/vod-pro) ou tout dans main ? REP: Tout dans main. juste plusieurs commits :3
- PR reviews ou direct merge ? REP: Non
- Commit message format ? (Conventional commits?) REP: Je sais pas mais les classiques

**Pourquoi ça compte**: Gemini peut gérer ça mais faut les instructions.

---

### Q-PROCESS.2 — Deployment: manual ou auto?
**Contexte**: package.json a `deploy` script (gh-pages). Mais quand? 

**Options**:
- C) Auto to staging, manual to prod 
    REP: Auto 'build' mais par contre deploy manuel.

**Pourquoi ça compte**: Impacte le testing flow et risk management.

---

### Q-PROCESS.3 — Supabase migrations: versioned ou manual SQL?
**Contexte**: Existe schema.sql, mais comment applier les changes?

**À clarifier**:
- Utiliser Supabase migrations CLI ou SQL direct? 
- Tables doivent être créées par Gemini ou pré-setup?
- Backup before changes?
REP: Je fais un backup de la base déjà fait. PAR CONTRE, Je gère toutes les interactions avec la base, on me donne les scripts le RLS et tout :3

**Pourquoi ça compte**: Impacte la data safety et si on peut reset facilement.

---

---

## 📌 RÉSUMÉ: TOP 10 QUESTIONS CRITIQUES

**SI ON PEUT RÉPONDRE QUE CES 10, ON PEUT CODER LE RESTE**:

1. **Priorité**: Profil first + Slow Bloom parallèle? Ou Profil puis Slow Bloom?
2. **Slow Bloom hosting**: Page propre ou onglet du Profil?
3. **IA approach**: 100% local ou hybride Gemini?
4. **DB schema**: Exact structure pour vods, evolution_submissions, documents?
5. **Sync bug**: C'est quoi le problème exact avec custom_affiliations?
6. **Design tone**: Palette couleur exact (hex) et font changes pour "floral lofi"?
7. **Tracker integration**: Qui gère l'API Riot? Quand fetch? Où cache?
8. **Staff interface**: Où elle va? Admin panel ou page dédiée?
9. **Mobile testing**: Devices cibles? Performance targets?
10. **Cleanup**: DevPanel vraiment supprimer ou juste désactiver?

TOUT repondu /3
---

**Document préparé pour Gemini Coding Session**
*À remplir et valider avant de lancer la phase de développement*
