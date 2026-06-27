# Gowrax Web — Phase 0

Frontend Next.js (static export) → GitHub Pages `team.gowrax.me`

## Dev local

```bash
cp .env.local.example .env.local   # ou déjà rempli
npm install
npm run dev
```

→ http://localhost:3000

## Build

```bash
npm run build   # output → out/
```

## Deploy GitHub Pages

Workflow : `.github/workflows/deploy-web.yml`

**CNAME** : `web/public/CNAME` et `web/CNAME` → `team.gowrax.me` (copié dans `out/` au build)

**Secrets repo GitHub** (Settings → Secrets → Actions) :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Sécurité

Voir `SECURITY.md` — pas d'accès direct Storage/MySQL côté client.

## Stack

- Next.js 15 App Router (static export)
- Supabase Auth (Discord OAuth)
- API Render (`NEXT_PUBLIC_API_URL`)
