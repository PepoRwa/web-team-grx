# Brief agent — Site Gowrax (à lire en premier)

> **Copie-colle ce fichier** (`@SITE_HANDOFF.md`) au début de ta conv site Next.js.  
> Le bot Discord est **terminé et en prod** — ne le recode pas, connecte-toi à la même MySQL.

---

## Contexte en 30 secondes

On a rebuild le **bot Discord Gowrax** from scratch. Il tourne sur **YorkHost** et utilise une **MySQL partagée** avec le futur site.

| Service | Rôle |
|---|---|
| **Supabase Auth** | Login Discord sur le site **uniquement** |
| **MySQL YorkHost** | Données métier + file `notifications` vers le bot |
| **Bot Discord** | Lit MySQL, envoie sur Discord — **ne touche pas à Supabase** |

**Pont entre site et bot : `discord_id`** (ID numérique Discord).

---

## Docs du repo bot (source de vérité)

| Fichier | Contenu |
|---|---|
| `SITE_INTEGRATION.md` | Guide complet site : env, sync login, exemples INSERT |
| `migrations/001_initial.sql` | **Schéma MySQL officiel** — ne pas inventer d'autres tables sans accord |
| `migrations/002_utf8mb4_reactions.sql` | Charset emojis |
| `SETUP.md` | Architecture globale bot ↔ site ↔ Supabase |
| `BOT_PLAN.md` | Fonctionnalités bot (tickets, panels, twitch…) |

---

## MySQL — connexion site

```env
# Next.js — SERVEUR UNIQUEMENT (jamais NEXT_PUBLIC_)
DB_HOST=83.150.218.23
DB_PORT=3306
DB_USER=u0_o9h5s45qH1
DB_NAME=s0_Gowraxbot
DB_PASSWORD=...   # même que le bot, dans .env bot
```

```env
# Supabase — client OK
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> Supabase sera un **nouveau projet** (reset orga) — à créer côté site.  
> Discord OAuth redirect : `https://<ref>.supabase.co/auth/v1/callback`

---

## Tables importantes pour le site

### `users` — sync au login Discord
- `discord_id` (PK)
- `supabase_user_id`
- `username`, `avatar_url`
- `twitch_username` (optionnel, aussi via `/link-twitch` sur Discord)

### `notifications` — le site INSERT, le bot envoie
- `type` : `absence`, `match`, `dm`, `custom`…
- `channel_key` : `absences`, `matchs`, `lives`…
- `discord_id` : pour les DM
- `payload` : JSON (title, description, fields…)
- `sent` : 0 = en attente, le bot poll toutes les 30s

### `absences`, `matches`, `match_assignments`
Données métier — à remplir quand les formulaires site existeront.

### `tickets`, `reaction_role_panels`
**Gérés par le bot Discord** — le site n'a pas besoin d'y toucher pour l'instant.

---

## Ce que le site doit faire (MVP)

1. **Next.js App Router**
2. **Supabase Auth** — Discord login
3. Au login → **sync `users`** dans MySQL (voir `SITE_INTEGRATION.md`)
4. Plus tard : formulaires → INSERT `absences` + `notifications`
5. **Jamais** appeler l'API Discord pour les notifs — passer par `notifications`

---

## Ce que le bot fait déjà (ne pas refaire)

- Panels rôles réactions (`/setup-panels`)
- Tickets Discord (`/setup-tickets`)
- Poll `notifications` → channels Discord
- Lives Twitch (si secret configuré)
- Assignation match → DM via `notifications` type `dm`

---

## Exemple notif test (vérifier liaison site→bot)

```sql
INSERT INTO notifications (type, channel_key, payload)
VALUES ('custom', 'absences', '{"title":"Test site","description":"Si tu vois ça, MySQL OK."}');
```

→ Message dans le channel absences sous 30s si le bot tourne.

---

## Stack imposée

- **Site** : Next.js (App Router)
- **Auth** : Supabase Discord OAuth
- **DB métier** : MySQL YorkHost (même base que le bot)
- **Pas de** Supabase Database pour les données métier (sauf auth)

---

## Prompt suggéré pour démarrer la conv site

```
Je construis le site Gowrax en Next.js. Le bot Discord est déjà fait et documenté dans ce repo.

Lis @SITE_HANDOFF.md @SITE_INTEGRATION.md et @migrations/001_initial.sql

Architecture :
- Supabase = auth Discord uniquement
- MySQL YorkHost = données partagées avec le bot
- Liaison via discord_id

Commence par : setup Next.js + Supabase Auth Discord + sync users vers MySQL au login.
Les formulaires (absences, matchs…) viendront après.
```
