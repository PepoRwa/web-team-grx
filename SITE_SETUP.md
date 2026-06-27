# Guide setup — Site Gowrax v1

## Prérequis

- Node.js 20+
- Compte Supabase (nouvelle orga)
- Accès MySQL YorkHost (mêmes creds que le bot)
- App Discord Developer (OAuth2)

---

## 1. Supabase — nouveau projet

### Créer le projet

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New project
2. Région : **eu-central-1** ou **eu-west-2** (proche YorkHost)
3. Noter le **Project URL** et **anon key**

### Activer Discord OAuth

1. **Authentication → Providers → Discord** → Enable
2. Discord Developer Portal → ton application → OAuth2 :
   - **Redirect URI** :
     ```
     https://<PROJECT_REF>.supabase.co/auth/v1/callback
     ```
3. Coller **Client ID** + **Client Secret** dans Supabase

### Supabase Storage (images strats)

1. **Storage → New bucket** : `strat-images`
2. **Public** : non (signed URLs ou policy authenticated)
3. Policies :
   - SELECT : authenticated users
   - INSERT/UPDATE/DELETE : authenticated + vérification côté API (staff)

### Redirect URLs site (Auth settings)

Ajouter dans Supabase → Authentication → URL Configuration :

```
Site URL: https://team.gowrax.me
Redirect URLs:
  - https://team.gowrax.me/**
  - http://localhost:3000/**
```

---

## 2. Discord Developer Portal

1. [discord.com/developers/applications](https://discord.com/developers/applications)
2. OAuth2 → Redirects : URL Supabase callback (ci-dessus)
3. Scopes utilisés par Supabase : `identify`, `email` (géré par Supabase)

---

## 3. Fichiers `.env`

### Frontend — `apps/web/.env.local`

Copier depuis `.env.local.example` à la racine.

```env
# Supabase (public — OK côté client)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# API Render
NEXT_PUBLIC_API_URL=https://api.team.gowrax.me

# Dev local
# NEXT_PUBLIC_API_URL=http://localhost:4000
```

### API — `apps/api/.env` (Render + local)

```env
# Server
PORT=4000
NODE_ENV=production
ALLOWED_ORIGINS=https://team.gowrax.me,http://localhost:3000

# MySQL YorkHost — JAMAIS côté frontend
DB_HOST=83.150.218.23
DB_PORT=3306
DB_USER=u0_o9h5s45qH1
DB_NAME=s0_Gowraxbot
DB_PASSWORD=...

# Supabase — pour vérifier les JWT (serveur only)
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # Render dashboard only, pas Git

# Supabase Storage (upload images strats)
SUPABASE_SERVICE_ROLE_KEY=...  # même clé
```

> **Sécurité** : ne jamais commit `.env.local` ou `.env`.  
> Sur Render : coller les vars dans le dashboard (Environment).

---

## 4. MySQL — migrations

Ordre d'exécution sur YorkHost :

```bash
# Déjà en prod (bot)
001_initial.sql

# À valider avec agent YorkHost + bot
002_sync_roles.sql
003_site_profiles.sql
004_site_vods.sql
005_site_strats.sql
006_site_notifications.sql
007_site_transmissions.sql
008_site_season.sql
```

Envoyer `BOT_INTEGRATION.md` à l'agent bot **avant** d'appliquer `002_sync_roles.sql`.

---

## 5. Render — déployer l'API

1. [render.com](https://render.com) → New **Web Service**
2. Connect repo GitHub
3. Root Directory : `apps/api`
4. Build : `npm install && npm run build`
5. Start : `npm start`
6. Ajouter toutes les env vars (section 3)
7. Custom domain : `api.team.gowrax.me` (CNAME → Render)

Plan **Free** OK pour démarrer (cold start ~30s acceptable en dev).

---

## 6. GitHub Pages — déployer le frontend

1. Repo Settings → Pages → Source : GitHub Actions
2. Workflow build Next.js static export → deploy `out/`
3. Custom domain : `team.gowrax.me`
4. DNS : CNAME `team` → `<user>.github.io` ou A records GitHub

---

## 7. Dev local

```bash
# Terminal 1 — API
cd apps/api && cp .env.example .env  # remplir
npm install && npm run dev          # :4000

# Terminal 2 — Frontend
cd apps/web && cp ../../.env.local.example .env.local  # remplir
npm install && npm run dev          # :3000
```

---

## 8. Checklist go-live

- [ ] Supabase projet créé, Discord OAuth OK
- [ ] `.env.local` frontend rempli
- [ ] Render API deploy + health check `GET /health`
- [ ] MySQL migrations appliquées
- [ ] Bot poll `sync_roles_requests` actif
- [ ] Test login → sync user → rôles visibles
- [ ] Test INSERT notification → Discord sous 30s
- [ ] GH Pages live sur team.gowrax.me
- [ ] PWA installable sur mobile

---

## 9. Migration VODs (Gowrax-Internal)

**Source** : Supabase `Gowrax-Internal` (`hbneliavsrdurolfamjo`)  
**Volume** : 30 VODs team (0 pro)  
**Script** : à exécuter en Phase 3 (après tables `vods` créées)

Mapping :
- `profiles.discord_id` ← join via `vods.user_id`
- `players_present` jsonb → remapper UUIDs → discord_ids
- `description_pro` → ignoré (colonne pro future)

L'agent site génèrera `scripts/migrate-vods.mjs` au moment venu.
