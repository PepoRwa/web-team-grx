# Module asso — team.gowrax.me

## Statut

Phase 1 : API Render (`/asso/*`) + schéma MySQL. UI frontend à venir.

## Trackers — règle anti-conflit

| Champ | Table | Géré par | Usage |
|-------|-------|----------|--------|
| Tracker **team** | `users.tracker_url` | Joueur (`/hub/profiles/me`) | Profil esport public |
| Tracker **asso** | `asso_dossiers.tracker_url` | Bureau (`/asso`) | Dossier administratif |

- L’API asso **ne modifie jamais** `users.tracker_url`.
- Si les deux trackers sont renseignés, ils **doivent être différents** (validation `ASSO_TRACKER_CONFLICT`).
- À la liaison Discord, le bureau peut **pré-remplir** depuis le profil team ; le joueur peut ensuite changer son tracker team sans impact sur l’asso.

## Auth & accès

| Niveau | Qui | Routes |
|--------|-----|--------|
| Membre asso | `discord_id` lié + `site_access` + dossier actif | `GET /asso/me` |
| Bureau asso | Fondateur, `ASSO_BUREAU_DISCORD_IDS`, ou `asso_bureau_grants` | CRUD dossiers, liaison |
| Site team | `canAccessSite` + membre Gowrax | Prérequis global |

Kill-switch `users.is_disabled` bloque aussi l’asso.

## Sécurité API

- Rate limit dédié `/asso` (plus strict que le global)
- JWT Supabase vérifié sur chaque route
- Audit `admin_audit_log` pour actions sensibles (`asso.*`)
- Pas d’exposition email/téléphone aux non-bureau
- Validation Zod stricte sur tous les body

## Migration

Appliquer `migrations/018_asso_module.sql` puis `migrations/019_asso_documents.sql` sur la base YorkHost partagée.

## Documents (019)

| Dossier | Lecture | Écriture |
|---------|---------|----------|
| `statuts` | Tous adhérents actifs | Bureau / édition+ |
| `pv_ag`, `pv_bureau` | Bureau ou grant explicite | Bureau / édition+ |
| `conventions`, `interne` | Bureau / admin | Bureau / édition+ |

**Niveaux module `documents`** : `aucun` · `lecture` · `edition` · `admin`  
Stockage : bucket Supabase privé `association-documents` sur le **projet asso** (`SUPABASE_ASSO_URL`), pas le projet team auth.
Import legacy : `cd api && npm run migrate:asso-documents` (métadonnées Postgres asso → MySQL).
Routes : `GET/POST/DELETE /asso/documents/*`, `PUT /asso/permissions/documents`.

## Cotisations

Données sur `asso_dossiers` (`cotisation_type`, `cotisation_status`, dispenses).
- **Partielle / dispensée** : `cotisation_exemption_ref` (n° délibération) **ou** `cotisation_exemption_note` (engagement staff + motifs) — obligatoire.
- `GET /asso/cotisations` — synthèse + liste (bureau, niveau lecture+)
- `PATCH /asso/cotisations/:id` — mise à jour (niveau édition+)
- Permissions module `cotisations` : même échelle que documents (`aucun` → `admin`)
