# Capitaines par roster — déploiement bot

## Migration base de données

Exécuter sur MySQL YorkHost (site + bot partagent la même base) :

```bash
mysql ... < migrations/024_roster_captains.sql
```

## Commande Discord `/capitaine-define`

Redéployer les slash commands du bot (`gowrax-bot`) après pull.

### Sous-commandes

| Commande | Action |
|----------|--------|
| `/capitaine-define liste` | Affiche les capitaines actuels |
| `/capitaine-define definir roster:… joueur:@…` | Nomme un capitaine |
| `/capitaine-define retirer roster:…` | Retire le capitaine |

**Accès :** CEO, Team Manager, Head Coach.

### DM au joueur (manuel)

Après `/capitaine-define definir`, envoyer un **DM** au joueur — non automatique depuis le site ni le bot.

> Salut ! Tu es nommé(e) capitaine pour [roster] sur le hub Gowrax. Connecte-toi sur https://team.gowrax.me — accès **Tryouts** de ton roster en lecture seule.

## Site

- `/hub/captains/` — gestion (CEO / TM / Head Coach)
- Fondateur / Head Coach — édition profils joueurs via « Modifier ce profil »
- Capitaine — tryouts filtrés par roster assigné en base

Le rôle Discord « Capitaine » seul n'ouvre plus les tryouts ; source de vérité = `roster_captains`.
