# Bot Discord Gowrax — Spec d'intégration site ↔ bot

> **Document à envoyer à l'agent / dev du bot.**  
> Le site Next.js + API Render consomme la même MySQL YorkHost.  
> Le bot reste la source de vérité pour : rôles Discord, envoi Discord, tickets, panels.

---

## Architecture globale

```
Site (GitHub Pages)          API (Render)              Bot (YorkHost)
team.gowrax.me        ──►    api.team.gowrax.me  ──►   MySQL YorkHost
     │                              │                        ▲
     └── Supabase Auth (Discord)    └── mysql2               │
                                                                  │
Bot Discord ──────────────────────────────────────────────────────┘
  poll notifications (30s)
  poll sync_roles_requests (10-15s)
  guildMemberUpdate → resync rôles
```

**Clé de liaison : `discord_id`** (ID numérique Discord, ex. `123456789012345678`).

---

## Règle d'or

| Action | Qui le fait |
|--------|-------------|
| Envoyer un message sur Discord | **Bot uniquement** (via table `notifications`) |
| Sync rôles Discord → MySQL | **Bot uniquement** |
| Lire/écrire VODs, strats, profils | **Site (API Render)** |
| Auth login Discord | **Supabase** (site) |
| Tickets, panels réaction-rôles | **Bot uniquement** |

Le site **ne doit jamais** appeler l'API Discord directement.

---

## 1. Sync des rôles (`sync_roles`)

### Contexte

Le site vérifie les permissions via MySQL, pas via l'API Discord.  
Le bot maintient la table `user_roles` à jour.

### Migration MySQL à appliquer

Fichier : `migrations/002_sync_roles.sql` (dans le repo site).

### Tables

#### `discord_roles` — catalogue des rôles connus

| `role_id` | `name` | `category` | `permission_level` |
|-----------|--------|------------|-------------------|
| `1472395939150037165` | CEO | staff | 40 |
| `1472731808121487540` | Team Manager | staff | 30 |
| `1472732049126330451` | Head Coach | staff | 20 |
| `1472734272891785339` | Coach | staff | 10 |
| `1472732829476458659` | Capitaine | decorative | 0 |
| `1474174283424075797` | High Roster | roster | 0 |
| `1511286442721280090` | Game Changers | roster | 0 |
| `1476618903223537697` | High Roster CS2 | roster | 0 |
| `1474127750343168247` | Membre Gowrax | member | 0 |

#### `user_roles` — rôles effectifs par membre

```sql
-- Maintenu par le bot. Le site lit, ne écrit jamais.
discord_id + role_id (PK composite)
```

#### `sync_roles_requests` — file déclenchée au login site

```sql
-- Le site INSERT status='pending' au login.
-- Le bot traite et passe à 'done' ou 'error'.
```

### Flow

```
1. User se connecte sur le site
   → API Render INSERT sync_roles_requests (discord_id, 'pending')
   → API Render sync users (username, avatar…)

2. Bot poll sync_roles_requests WHERE status='pending' (toutes les 10-15s)
   → Récupère les rôles du membre via Discord API (guild member roles)
   → DELETE FROM user_roles WHERE discord_id = ?
   → INSERT INTO user_roles les rôles trouvés (intersection avec discord_roles)
   → UPDATE sync_roles_requests SET status='done', processed_at=NOW()
   → En cas d'erreur : status='error', error='...'

3. Site lit user_roles pour afficher permissions
```

### Events Discord à écouter (recommandé)

| Event | Action |
|-------|--------|
| `guildMemberUpdate` | Resync `user_roles` pour ce `discord_id` (changement de rôle) |
| `guildMemberRemove` | `DELETE FROM user_roles WHERE discord_id = ?` |
| `guildMemberAdd` | Optionnel : resync si le membre a déjà des rôles |

### Règle d'accès site

- **Accès refusé** si le membre n'a **pas** le rôle `1474127750343168247` (Membre Gowrax).
- Le bot doit inclure ce rôle dans `user_roles` pour tout membre du serveur qui l'a sur Discord.

### Notes permission (pour info bot, pas de logique bot)

| Rôle | Comportement site |
|------|-------------------|
| CEO | Admin overall, transmissions |
| Team Manager | Accès membre + scope ses rosters + transmissions |
| Head Coach | Accès global tous rosters |
| Coach | Accès rosters assignés (via rôles roster Discord) |
| Capitaine | Badge décoratif uniquement, zéro permission extra |

---

## 2. Notifications Discord (table `notifications`)

Le site **INSERT**, le bot **lit et marque `sent = 1`**.  
Poll existant : toutes les **30s** (déjà en prod).

### Schéma (existant — `001_initial.sql`)

```sql
notifications (
  id, type, channel_key, discord_id, payload JSON, sent, sent_at, ...
)
```

### Types utilisés par le site

| `type` | Usage | `channel_key` | `discord_id` |
|--------|-------|---------------|--------------|
| `dm` | Notif perso au joueur | NULL | **requis** |
| `custom` | Message channel Discord | **requis** | NULL |
| `absence` | (futur) | `absences` | optionnel |
| `match` | (futur) | `matchs` | NULL |

### Événements site → INSERT notifications

#### Nouvelle VOD team (opt-in)

Uniquement si la VOD a `notify_discord = 1` (coché par l'auteur).

```sql
INSERT INTO notifications (type, channel_key, payload)
VALUES (
  'custom',
  'matchs',  -- ou channel scrims si configuré côté bot
  JSON_OBJECT(
    'title', '🎬 Nouvelle VOD team',
    'description', 'Une VOD a été ajoutée au hub.',
    'fields', JSON_ARRAY(
      JSON_OBJECT('name', 'Titre', 'value', '<titre>', 'inline', false),
      JSON_OBJECT('name', 'Map', 'value', '<map>', 'inline', true),
      JSON_OBJECT('name', 'Score', 'value', '<score>', 'inline', true),
      JSON_OBJECT('name', 'Auteur', 'value', '<@discord_id>', 'inline', true)
    )
  )
);
```

#### Nouvelle strat publiée (staff)

```sql
INSERT INTO notifications (type, channel_key, payload)
VALUES (
  'custom',
  'matchs',
  JSON_OBJECT(
    'title', '📋 Nouvelle strat',
    'description', '**<titre>** — <map> (<side>)',
    'fields', JSON_ARRAY(
      JSON_OBJECT('name', 'Auteur', 'value', '<@discord_id>', 'inline', true)
    )
  )
);
```

#### DM notif perso (VOD / strat — opt-in user)

Si `users.notify_vod_dm = 1` ou `users.notify_strat_dm = 1` :

```sql
INSERT INTO notifications (type, discord_id, payload)
VALUES (
  'dm',
  '<discord_id_cible>',
  JSON_OBJECT(
    'title', '🔔 Nouvelle VOD sur le hub',
    'description', '**<auteur>** a ajouté une VOD : <titre>'
  )
);
```

#### Transmission staff (page Transmissions)

Le staff compose un message depuis le site → INSERT `custom` avec le `channel_key` choisi.

```sql
INSERT INTO notifications (type, channel_key, payload)
VALUES (
  'custom',
  '<channel_key>',  -- absences | matchs | lives | evolution
  JSON_OBJECT(
    'title', '<titre>',
    'description', '<contenu markdown>',
    'mention_role_id', '<role_id_optionnel>'
  )
);
```

### `channel_key` disponibles (bot)

| `channel_key` | Variable `.env` bot | Rôle pingé par défaut |
|---------------|-------------------|----------------------|
| `absences` | `CHANNEL_ABSENCES` | `ROLE_NOTIF_ABSENCES` |
| `matchs` | `CHANNEL_MATCHS` | Rôle Matchs |
| `lives` | `CHANNEL_LIVES` | Rôle Lives |
| `evolution` | `CHANNEL_EVOLUTION` | — |

### Payload JSON — champs supportés

```json
{
  "title": "string (requis)",
  "description": "string (markdown Discord)",
  "color": 2371685,
  "fields": [
    { "name": "string", "value": "string", "inline": true }
  ],
  "mention_role_id": "1472735427571220655"
}
```

---

## 3. Sync utilisateur (`users`)

Au login, l'API Render fait un upsert (déjà documenté dans `SITE_INTEGRATION.md`) :

```sql
INSERT INTO users (discord_id, supabase_user_id, username, avatar_url)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  supabase_user_id = VALUES(supabase_user_id),
  username = VALUES(username),
  avatar_url = VALUES(avatar_url);
```

Le bot peut **lire** `users` pour enrichir les messages (pseudo, avatar).  
Le bot **ne modifie pas** `supabase_user_id`.

Champs site additionnels (migration `003_site_profiles.sql`) :
- `tracker_url`, `riot_id`, `steam_id`, `game`
- `notify_vod_dm`, `notify_strat_dm`

---

## 4. Ce que le bot ne touche PAS

| Table | Owner |
|-------|-------|
| `vods`, `vod_comments` | Site |
| `strats` | Site |
| `site_notifications` | Site (notifs in-app, pas Discord) |
| `transmission_templates` | Site |
| `season_banner` | Site |
| `sync_roles_requests` | Site INSERT / Bot UPDATE |
| `user_roles` | Bot WRITE / Site READ |
| `notifications` | Site INSERT / Bot READ+UPDATE |
| `tickets`, `reaction_role_panels` | Bot only |
| `absences`, `matches` | Futur (site write) |

---

## 5. Checklist implémentation bot

- [ ] Appliquer migration `002_sync_roles.sql` sur MySQL YorkHost
- [ ] Seed `discord_roles` avec les 9 rôles
- [ ] Poll `sync_roles_requests` (10-15s) + traitement
- [ ] Handler `guildMemberUpdate` → resync `user_roles`
- [ ] Handler `guildMemberRemove` → delete `user_roles`
- [ ] Vérifier que `type = 'dm'` fonctionne avec `discord_id` renseigné
- [ ] Vérifier que `type = 'custom'` + `channel_key` fonctionne pour transmissions site
- [ ] Tester INSERT notif depuis site → réception Discord sous 30s

### Test rapide

```sql
INSERT INTO notifications (type, channel_key, payload)
VALUES ('custom', 'matchs', JSON_OBJECT('title', 'Test site→bot', 'description', 'Liaison OK.'));
```

---

## 6. Twitter / X (hors scope v1)

Les transmissions Twitter ne passent **pas** par la table `notifications` en v1.  
Si besoin v1.5 : ajouter `type = 'social'` + handler bot, ou appel API direct côté Render.

---

## 7. Contact / repos

| Repo | Rôle |
|------|------|
| Site (ce repo) | Frontend GH Pages + migrations MySQL + spec |
| API Render | `api/` — endpoints REST, MySQL, auth Supabase |
| Bot Discord | Poll MySQL, Discord events, envoi messages |

Questions schema MySQL → valider avec l'agent YorkHost avant exécution des migrations `003` à `007`.
