# Migration VODs — Gowrax-Internal → MySQL

Importe les **30 VODs** + **8 commentaires débrief** depuis l’ancienne Supabase vers la nouvelle table MySQL.

---

## Mapping ancien → nouveau format

| Supabase (ancien) | MySQL (nouveau) |
|-------------------|-----------------|
| `id` (uuid) | `id` (INT auto — non conservé) |
| `user_id` → `profiles.discord_id` | `author_discord_id` |
| `title`, `link`, `map`, `date`, `score`, `opponent` | identique |
| `status` : `Win` / `Défaite` | `win` / `loss` |
| `is_pro` | `is_pro` |
| `description_pro` | `description_pro` |
| `players_present` : `["Nati","Adri",…]` **pseudos** | `["417371…","677936…"]` **discord_id** |
| `created_at` | `created_at` |
| `vod_comments.author_id` → profile | `author_discord_id` |
| `vod_comments.is_private` | `is_private` |

---

## Mapping joueurs (pseudos → discord_id)

Utilisé pour `players_present` :

| Pseudo (variantes) | discord_id |
|--------------------|------------|
| T3tsu, Tetsu | `464454744338071552` |
| SuKu, Suku | `1249461877474463816` |
| Adri | `677936071056556052` |
| Nati | `417371455483936778` |
| Renox | `1196130770381717538` |
| Adamacrispi, Adam | `971856872938303549` |

Le script normalise : minuscules, retire `[GRX]`, `X Axel`, `by SFR`, etc.

---

## Prérequis

1. Migration **`004_site_vods.sql`** appliquée sur YorkHost
2. Table `vods` **vide** (ou tu acceptes les doublons si tu relances)
3. Clé **service_role** du projet **Gowrax-Internal** (Supabase → Settings → API)

---

## Configuration

Dans `api/.env` (en plus des vars MySQL déjà présentes) :

```env
# Ancienne Supabase — Gowrax-Internal (lecture seule migration)
SUPABASE_OLD_URL=https://hbneliavsrdurolfamjo.supabase.co
SUPABASE_OLD_SERVICE_ROLE_KEY=eyJhbGci...   # service_role Gowrax-Internal
```

Ne **jamais** committer cette clé.

---

## Exécution

```bash
cd api

# 1. Simulation — vérifie mapping sans écrire
node scripts/migrate-vods.mjs --dry-run

# 2. Import réel
node scripts/migrate-vods.mjs
```

---

## Vérification après import

```sql
SELECT COUNT(*) FROM vods;                    -- attendu : ~30
SELECT COUNT(*) FROM vod_comments;            -- attendu : ~8
SELECT id, title, map, status, players_present FROM vods LIMIT 5;
```

Via API (une fois connecté) :
```bash
curl https://api.team.gowrax.me/vods -H "Authorization: Bearer <token>"
```

---

## En cas de joueur non mappé

Le script affiche un warning :
```
⚠ VOD "..." — joueurs non mappés : FooBar
```

Ajoute l’alias dans `PLAYER_ALIASES` en haut de `api/scripts/migrate-vods.mjs`, puis relance.

---

## Notes

- `notify_discord` = `0` pour toutes les VODs migrées (pas de spam Discord)
- Les VODs sans auteur `discord_id` sont **ignorées**
- Les titres « Sans titre » sont conservés tels quels
