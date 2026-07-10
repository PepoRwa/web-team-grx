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

Appliquer `migrations/018_asso_module.sql` sur la base YorkHost partagée.
