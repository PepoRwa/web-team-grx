# Sécurité — Frontend Gowrax

## Principe

| Donnée | Où | Accès client |
|--------|-----|--------------|
| Auth Discord | Supabase Auth | ✅ anon key only |
| VODs, strats, profils | MySQL via API Render | ✅ Bearer JWT Supabase |
| Images strats | Supabase Storage | ❌ **jamais direct** — API service_role |
| MySQL credentials | Render | ❌ jamais |

## Supabase Storage & RLS

Le **frontend n'upload jamais** vers Supabase Storage.

- Upload images strats → `POST /strats/:id/image` sur l'API
- L'API utilise `SUPABASE_SERVICE_ROLE_KEY` (Render only)
- Bucket `strat-images` reste **privé**
- Pas besoin de policies RLS côté client

Si un jour upload client direct : policies **authenticated** + validation staff en Edge Function — pas en v1.

## MySQL YorkHost

- Aucune connexion directe depuis le navigateur
- Toute requête passe par `api.team.gowrax.me` avec JWT vérifié
- Permissions enforced côté API (rôles bot sync)

## Secrets

| Variable | Commit ? |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | OK (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Render only |
| `DB_PASSWORD` | ❌ Render only |

## Auth flow

```
Discord OAuth → Supabase session → Bearer token → API Render → MySQL
```

Ne jamais stocker de secrets dans localStorage hors session Supabase.
