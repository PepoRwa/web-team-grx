*Ca c'est que j'appelle une liste non exhaustive des fonctionnalités à ajouter dans les prochaines mises à jour (version Mai 2025)* 
Contient: Ajout / Modification-Patchs / Suppressions-Désactivations

# UPDATES A FAIRE
## Date de patch Deploy: Mai 2026 // Build ID: GRX-HFH746J // V3

## AJOUTS
**Cette partie catalogue les ajouts à faire à l'application**

### Page Profil
Envisager d'intégrer simplement une fonctionnalité qui permet à un membre de consulter son profil sur l'application. 
Il doit donc avoir accès aux possibilités suivantes (SEULE les parenthèses incluent une exception de rôle):
- Pseudo Discord
- Rang Discord d'assignation - Highest Rôle Discord ou ROSTER - cas échéant. 
    * (Exception Coach: Afficher l'assignation au Roster. OU rôle au sein du roster)
- Rang DB/GOWRAX d'assignation
- Lien vers le tracker (avec fetch automatique de la valeur) ou connexion à la RIOT Games API ?
- Photo de Profil (logique btw)
- Dernière synchronisation de l'application au compte Discord - si intégrable - 
- STATISTIQUES de participation (Taux de présence) aux évènements/roster
- VOD dans lesquelles le membre apparaît.
    * Panel Staff, = Dire qu'ils ne sont pas concernés par cette fonctionnalité.
        * Pour les staff (COACH ONLY): Montrer les vod qu'ils ont review
- Evolution. 
    * Evolution (Slow Bloom) est un panel dans lequel les membres peuvent demander une "promotion" vis à vis du staff. Exemple: Academy vers Tryhard ou Tryhard vers High Roster etc... (Voir "Evolution".)
        * Voir si Slow Bloom est intégré comme une page propre ou uniquement accessible via la page profil. Dans tous les cas, proposer de retourner au profil de l'utilisateur. 
- Points Légaux: Demande de suppression du compte, mise à jour d'informations. Précision: Le compte sur team.gowrax.me ne peut pas être supprimé tant que le membre est actif. Le bot de son côté, met à jour dès que possibles les données de compte utilisateur 
- Toute autre information utile. 
- Accès a deux types de documents:
    * Documents généraux (documents officiels de la structure. Ceux là sont par exemple les statuts et tout. Sont accessibles à TOUS LES MEMBRES IDENTIFIES AUTORISES
    * Documents personnalisés accessibles uniquement par les membres. Des documents qui sont immédiatement liés à eux ou un groupe défini de personnes. Ajouter une protection pour éviter le bypass de certaines limites. Genre, éviter qu'un utilisateur voie ce qui n'est pas à lui. 

EN CONSEQUENCE: 
SEULS LES FONDATEURS OU HEAD COACHS peuvent ajouter/modifier/supprimer des documents. 
On doit pouvoir les assigner via un panel défini. Panel de gestion de documents. On peut les assigner à des groupes / Des gens et tout. 


### ONBOARDING
A réfléchir. Faire une présentation de l'app et tout avec une sorte de tuto step by step. A voir si c'est vriament utile de faire ça. 

### Evolution

NOM: Slow Bloom

Slow Bloom est le dispositif de progression interne de Gowrax. Il permet à chaque membre de soumettre une demande d'évaluation de son dossier en vue d'un changement de roster — que ce soit de l'Academy vers le Tryhard, ou du Tryhard vers le High Roster.

L'idée derrière le nom : la progression ne se force pas, elle se cultive. Slow Bloom n'est pas un formulaire de candidature classique — c'est un miroir. Le membre y dépose ce qu'il est, ce qu'il joue, comment il s'implique. Un système hybride (calcul déterministe + agent NLP) évalue la crédibilité du dossier et produit un Score de Crédibilité. Ce score reste invisible jusqu'à la décision du staff — il est un outil interne, jamais une sentence. La décision finale appartient toujours à un humain.

Slow Bloom intègre aussi une logique de cooldown pour éviter les dépôts abusifs, un historique de progression pour que le membre voie son évolution dans le temps, et un système d'inéligibilité pour les cas où le staff souhaite bloquer l'accès temporairement.

<br> L'objectif est donc d'implémenter les fonctionnalités suivantes:
* AI FORMULAIRE based validation selon critères (selon roster demandé): (la validation IA se base sur un système de points. Il auto évalue la crédibilité du dossier)
    * Tracker. récupération des données compétitives des deux dernières actes. (UNIQUEMENT POUR LE HIGH ROSTER). 
        - Précision: Game Changers (féminin) est considéré comme High Roster
        - 2: Une fois que le tracker (pseudo Valorant + hashtag, le rank et main agent est retourné, l'utilisateur doit valider si c'est lui. il est invité à revoir sa saisie sinon)
    * Historique de présence (analyse des scores et des nombres par rapport aux matchs de son affiliation/convocations). Calcul développé et sophistiqué basé aussi sur l'historique des absences JUSTIFIEES ou avec des raisons d'absences JUGEES RECEVABLES (même considérées non justifiées). 
    * Date de naissance (simple value basée sur les données de recrutement des rosters) High Roster 18 MINIMUM (exception tolérées), Tryhard, 15 ANS MAX (cette donnée sera supprimée du DOSSIER uniquement (database en conséquene), la date de naissance n'étant requise que pour l'enregistrement du dossier)
    * Motivation: HIGH ROSTER ONLY: Texte développé de la part de l'usager expliquant les raisons de pourquoi il veut rejoindre le roster. il doit notamment mettre en avant certaines de ses capacités personnelles et s'assurer qu'elles rentrent en adéquation avec celles de la structure. Précision: On doit retrouver certains mots. Mais genre, ça peut évoluer pour chacun. D'oû le principe "d'IA". 
    * Mode de jeu: Explique son mode de jeu (toxique, chill, etc..) ça doit, bien entendu, matcher avec les valeurs de la gowrax attribuant des points supplémentaires ou en retirant - 
    * ROSTER SOURCE VERS ROSTER CIBLE: On vérifie l'éligibilité du transfert.
        * EXCEPTION HIGH ROSTER: Si le joueur est dans le high roster, alors on lui demande comment il veut évoluer. Passer de bench a titulaire etc... Pk pas passer Coach aussi (fixer critères)
    * Vue Planning (si le joueur n'a saisi aucun planning de disponiblité, on lui demande de le mettre à jour sur la page prévue.) Dans une case il indique globalement ses disponibilités à la semaine (jour) puis il clique sur un next step, là il met une IDEE des heures (matin / midi etc....)
    * Renseignement des mains agents. Une section pour renseigner ses Main Agents. Si le High Roster cherche un Controller et que le candidat est un pur Dueliste, l'IA doit pouvoir le signaler.
    * Preuves de performance (Clips/VOD) : Pour le High Roster, un champ pour mettre un lien vers un dossier (Medal.tv, YouTube) de ses meilleurs moves. L'IA ne peut pas voir le "skill visuel", mais le Staff en aura besoin.

* COOLDOWN: 2 NIVEAUX:
    * En attente de traitement: Dossier intouchable, récapitulatif des infos transférées (NOTES IA ET SCORE NON INCLUS DANS LA VUE JOUEUR), l'utilisateur ne peut ouvrir aucun nouveau dossier, ni supprimer l'actuel. Il peut juste ajouter des notes. 
    * Accepté / Refusé: L'utilisateur doit attendre entre 30 et 60 jours pour en reposer un (sauf bypass exceptionnel accordé par le staff). Objectif prévenir l'anti-spam. 
    * Inéligible: Ajouter une option pour permettre aux coachs/fondateurs d'empêcher certains utilisateurs de créer un dossier. Le bouton affiche une notif "VOus n'être pas éligible au système Evolution"

* Sécurité & esthétique: 
    * Envisager Cloudflare pour l'anti-spam AU CAS OÛ IL Y AIT COMPROMISSION. 
    * Blinder RLS
    * Jouer sur Couleurs Gowrax et polices. Aussi, indiquer dans un truc esthétique "powered by Gowrax AI" ou un truc du genre
    * Faire en sorte que toute la saisie soit esthétique et pas trop chiante. Et faire en sorte que les erreurs soient rattrapables
    * Les notes peuvent JAMAIS tomber en dessous de 0

* Gestion Staff
    * Interface de Décision : Quatre boutons pour le Staff : Valider dossier d'office | Accepter pour Tryout | Mettre en attente | Refuser.
    * Si le Staff refuse, il choisit une raison pré-remplie (ou personnalisée) et le bot envoie un message expliquant que le dossier à été mis à jour. On demande à l'utilisateur d'aller voir sur le site. Tout est indiqué sur la page membre avec une vue esthétique. 
        * L'identifiant du staff responsable n'est jamais divulguée.
    * Historique des dossiers : Une page (ou vue admin) permettant de voir toutes les anciennes demandes de l'utilisateur pour vérifier s'il s'améliore avec le temps.

* IA: 
    * Analyse sémantique (Motivation) : Tu parles de mots-clés. L'IA devrait aussi détecter le "Sentiment Analysis" : est-ce que le ton est arrogant, déterminé, ou paresseux ? - PREVENIR DANS CHAQUE CHAMP LE NECESSITANT QUE: "Ce champ est analysé par un agent automatisé avant consultation par le staff. Ne renseigne pas d'informations personnelles sensibles."
    * Le "Poids" des absences : Dans ton calcul sophistiqué, une absence Non Justifiée (sans motif communiqué en event / ni prévenue)) devrait peser 3x plus lourd qu'une absence Justifiée.
    * Envisager un machin d'IA qui ne bouffe pas les ressources ni les tokens (exmple API Gemini) trouver moyen alternatif. Sinon, on héberge tout via le site via un moyen alternatif. Sous une giga banque de mots :3

* SUGGESTIONS: 
    * Comparaison avec le Roster Cible : Puisque tu as les données du Roster visé (via le tracker des membres actuels), l'IA pourrait dire : "Ton rank est suffisant, mais l'équipe possède déjà 2 Mains Controllers. Es-tu prêt à flex ?"

    * Système de Progression : Dans la vue historique, affiche un graphique de l'évolution du score IA du joueur sur ses 3 dernières demandes. C'est ultra gratifiant pour un joueur de voir qu'il passe de 40/100 à 75/100 en 3 mois.

Précision: Le score IA du dossier n'est révélé qu'à l'issue du traitement du dossier

LINKED TO AI: "AI_BUILD_UPDATES.md" Also interprated as: "Resource 1"
L'objectif dans la DA de cette page est de jouer sur un ton plus floral, plus lofi, détendu comparé aux autres pages.


### Intégration DATADOG. 
Envisager la configuration du site (requêtes et tt) avec datadog. page par page. Moyen de check (si utile). 
Utiliser datadog sur le bot discord. Encore une fois si c'est jugé utile. On est pas obligé de s'en servir. 

Si on le juge utile, l'objectif est de vraiment monitor ABSOLUMENT TOUT de lié à la team. Ce qui veut dire que chaque requête devrait être surveillée. Si c'est pas faisable ou trop complexe on touche pas.

### Page Lineups
Trouvé par Gowrax ou pas. Par ses mmebres ou dehors. 

Les lineups permettraient d'indiquer sur quel map, avec quel agent, un lineup peut petre utile. 
On indiquerait donc les données suivantes: 
- Vidéo Lineup
- Map
- Agent (potentiellement envisager une intégration de l'icône de l'agent via une API ou un endpoint ou jsp.)
- Présentation / Description
Utilisateur qui a déposé

### Esthétique générale
#### Footer
- Ajout d'un footer qui contient OBLIGATOIREMENT les éléments suivants: 
    * Numéro de build et numéro de version
    * Copyright
    * Nom de l'application
    * Date d'inscription de l'utilisateur sur l'application
    * Lien vers la politique de confidentialité ou divers.


## Modifications / Corrections
**Cette partie catalogue les modifications et/ou corrections à apporter à l'application**


### Disponibilités

Rendre le planning plus esthétique et plus fonctionnel. Ajouter la possibilité d'EXPORTER les plannings des membres. Sous forme d'une liste (a voir le format et le document type), ajouter la possibilité de filtrer par utilisateur ayant saisi son planning. Permettant de faciliter les créations. Donc voir 2 filtres. un par roster et l'autre par membre. 

Faciliter la création de ses plannings (optimiser - facultatif). 


### Gestion des absences

Améliorer la vue. L'objectif affiché étant de rendre la saisie plus simple, envisager d'individualiser la page ou simplement de rendre le bouton plus fonctionneL. Faire en sorte que l'on puisse plus facilement le voir ou simplement le faire plus simplement. 


### VOD 

Ajouter un onglet "vod pro" (déjà inplémenté non fonctionnel). L'objectif est d'afficher de sessions VOD étudiées par le coach avec des commentaires particuliers et tt. Notamment plus de commentaires, des images et tt. 

Sur la Vod Team, faire en sorte qu'on voie si les coachs ont commenté. Ajouter une cadre qui dit si ça a été reviewed ou pas. Permettre au staff et joueurs de MODIFIER les titres des VODS. Les joueurs ne peuvent modifier que leur vod le staff peut tt changer. On peut changer toutes les informations (titre etc...). Rajouter une fonctionnalité permettant d'identifier chaque joueur (joueurs présents. On ajoute ça dans le Comment modal en bannière en haut en mode: Joueurs présents: ... le staff peut aussi décider de modifier cette liste. (ça rend le truc affichable dans le profil de l'utilisateur concerné)). 

### Synchronisation BOT DISCORD - DB - CLIENT

Envisager de switcher sur un format de "Vue" pour faire afficher les données de l'image de profil et tt dans une table modulable et le reste voit (je sais juste pas comment expliquer)
Réfléchir à donner la possibilité au bot discord de nettoyer la base de données, d'ajouter/mettre à jour les membres déjà existants et de retirer ceux qui sont partis ou qui n'ont plus un rôle X

Investiguer le problème lié aux custom_affiliations avec la db. 

Revoir le fonctionnement de la mise à jour des rôles. J'ai l'impression que le bot refuse de le faire maintenant. 

### Créations de stratégie 

Refaire le panel suite à la demande via le gform "Améliorer les créations de stratégie". Ajouter la possibilité d'insérer des liens notamment via valoplant. Et intégrer via certaines sessions d'entraînements. Modifier et dire QUI a modifié/crée la strat. Ainsi que la date de création puis date de modif. 

### Esthétique générale

Changer les couleurs. La Charte graphique de Gowrax évolue et veut jouer sur des couleurs beaucoup plus claires. Pastel. L'identité "sombre" du site doit être conservée, cependant, améliorer les effets graphiques et rendre les couleurs plus vivantes serait plus intéréssant. 

### Base de données
Pour protéger la base de données (sa RAM et tt), envisager une déconnexion de TOUS les comptes par périodes (fréquentes). Pour forcer le refresh de la photo de profil ou juste sécuriser les accès. 

## Suppressions - Désactivations
**Cette partie catalogue les suppressions et/ou désactivations à réaliser**

### DEVPANEL - Entré en V2.1 - Mars // Sortie sur la V3 - Mai 26    
Désactivation / Abandon de la page Realtime (RGPD)
Désactivation / Suppression récupération données liées aux consoles. 
* Casser la BDD liée en conséquent
Suppression du Devpanel. Retour sur Github pour les issues. Faut donc désactiver le devpanel et désactiver/supprimer toute la db liée. Pour des raisons de RGPD et notamment de maintenance. Faudra donc désactiver le realtime de cette partie. 

Faire en sorte que l'on puisse quand même, via un moyen quelconque (paramètres (genre paramètres du service - simple icone engrenage)), de pouvoir par exemple désactiver des vues. 

### Page Roster
Remplacement de la page roster par la page Profil.