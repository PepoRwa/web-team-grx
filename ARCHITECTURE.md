# Architecture site Gowrax v1

## Stack

| Couche | Techno | Hébergement | URL |
|--------|--------|-------------|-----|
| Frontend | Next.js (static export) | GitHub Pages | `https://team.gowrax.me` |
| API | Node.js (Express/Fastify) | Render (free/starter) | `https://api.team.gowrax.me` |
| Auth | Supabase Auth (Discord OAuth) | Supabase cloud | — |
| DB métier | MySQL | YorkHost (partagé bot) | interne |
| Images strats | Supabase Storage | Supabase cloud | — |
| Bot Discord | Node.js | YorkHost | — |

## Pourquoi 3 services ?

- **GitHub Pages** : gratuit, CDN, domaine custom — mais **statique only**
- **Render API** : connexion MySQL sécurisée, validation JWT Supabase, pas de secrets exposés
- **Supabase** : auth Discord sans recoder OAuth

## Flow auth

```
1. User clique "Connexion Discord" sur team.gowrax.me
2. Redirect Supabase OAuth → Discord → callback Supabase
3. Frontend récupère session (access_token)
4. Frontend appelle POST api.team.gowrax.me/auth/sync
   Header: Authorization: Bearer <supabase_access_token>
5. API vérifie JWT Supabase → upsert users MySQL
6. API INSERT sync_roles_requests → bot sync rôles
7. API retourne permissions (user_roles)
```

## Flow data

```
Frontend ──fetch──► API Render ──mysql2──► MySQL YorkHost
                         │
                         └── INSERT notifications ──► Bot poll ──► Discord
```

## CORS (API Render)

```
ALLOWED_ORIGINS=https://team.gowrax.me,http://localhost:3000
```

## Structure repo

```
web-team-grx/              # Repo site (docs, migrations, futur frontend)
├── migrations/
├── BOT_INTEGRATION.md
├── SITE_SETUP.md
├── .gitignore             # ignore /api/
└── api/                   # ⚠ Repo Git SÉPARÉ → push sur GitHub → Render
    ├── .git/
    ├── src/
    └── package.json
```

Le dossier `api/` a **son propre dépôt Git** (ignoré par le repo parent).
Render se connecte au repo GitHub de l'API uniquement.

## Déploiement

### GitHub Pages (frontend)

- Build : `next build` avec `output: 'export'`
- Deploy : GitHub Actions → `gh-pages` branch ou `/docs`
- `CNAME` : `team.gowrax.me`

### Render (API)

- Root : `apps/api`
- Build : `npm install && npm run build`
- Start : `npm start`
- Env vars : voir `.env.example` dans `apps/api`
- Custom domain : `api.team.gowrax.me`

### PWA

- Service worker + manifest dans `apps/web/public`
- Install prompt custom (quali mobile)
