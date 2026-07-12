# Prompt agent — commande `/capitaine-define` (gowrax-bot)

Tu travailles sur le repo **gowrax-bot** (`/Users/antoine/Documents/gowrax-bot`).

## Objectif

Déployer et valider la commande slash **`/capitaine-define`** qui gère les capitaines **par roster** via la table MySQL `roster_captains` (partagée avec l’API site).

## Prérequis

1. Migration SQL exécutée sur YorkHost :
   ```bash
   mysql ... < migrations/024_roster_captains.sql
   ```
   (fichier aussi dans `gowrax-bot/migrations/`)

2. Variables bot : token Discord, `clientId`, `guildId`, connexion MySQL identique au site.

## Commande

Fichier : `src/commands/capitaine-define.js`

| Sous-commande | Description |
|---------------|-------------|
| `liste` | Affiche tous les capitaines par roster |
| `definir roster joueur` | Nomme un capitaine |
| `retirer roster` | Retire le capitaine du roster |

**Permissions :** CEO, Team Manager, Head Coach (ou Administrator Discord).

## Déploiement slash commands

```bash
cd gowrax-bot
node deploy-commands.js
```

Redémarrer le bot après pull.

## Règle importante — DM manuel obligatoire

Après **`/capitaine-define definir`**, le bot rappelle dans sa réponse éphémère d’envoyer un **DM au joueur nommé capitaine**.  
**Ne pas automatiser** ce DM depuis le bot ni le site pour l’instant.

Message type à envoyer au capitaine :

> Salut ! Tu es nommé(e) capitaine pour **[roster]** sur le hub Gowrax.  
> Connecte-toi sur https://team.gowrax.me — tu as accès aux **Tryouts** de ton roster en **lecture seule**.

## Tests à faire

1. `/capitaine-define liste` → liste vide ou existante
2. `/capitaine-define definir roster:high_roster joueur:@…` → succès + rappel DM
3. Reconnexion site avec ce compte → badge « Capitaine · … » + accès tryouts **uniquement** sur ce roster
4. `/capitaine-define retirer roster:high_roster` → accès tryouts retiré au prochain sync session
5. Vérifier qu’un membre avec le rôle Discord « Capitaine » **sans** ligne en base **n’a pas** accès tryouts

## Fichiers concernés

- `src/commands/capitaine-define.js`
- `src/services/rosterCaptains.js`
- `src/utils/captainManager.js`
- `src/data/rosterCaptains.js`
- `migrations/024_roster_captains.sql`

## Site (contexte, repo séparé)

- Gestion aussi via `/hub/captains/` (CEO / TM / Head Coach)
- Édition profils joueurs : fondateur / Head Coach via « Modifier ce profil »
- Aucune notification auto à la nomination depuis le site
