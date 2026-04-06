# 🛠️ GOWRAX - TRACKER ET BUGS (Workflow de Test)

Ce fichier sert à repertorier les bugs rencontrés et à assurer leur suivi.
- **Workflow de test du Dev** : 
  1. Le Dev vérifie le build localement.
  2. Le Dev reproduit l'erreur à partir de la trace console.
  3. Le Dev corrige et re-build ou re-lance sur le port local pour s'assurer que ça ne crashe plus.
  4. Update de ce tracker pour éviter les régressions.

## 🐛 Bugs Récents
- [x] **Composant Calendar** : L'application crashait avec l'erreur `ReferenceError: loading is not defined`.
  - *Cause :* La variable d'état de chargement avait été oubliée suite à la refonte visuelle des états de scan.
  - *Fix :* Ajout de `const [loading, setLoading] = useState(true);`. Crash résolu.
- [x] **Composant Mentorat (CoachingHub)** : La page chargeait de manière infinie ou crashait avec `ReferenceError: fetchProfiles is not defined`.
  - *Cause :* Le refactoring des requêtes Supabase relationnelles a emboîté une fonction dans un `useEffect`, la rendant inaccessible pour le reste des hooks.
  - *Fix :* La fonction a été sortie du wrapper et rendue accessible. Le build est réparé.

## 🚀 Fonctionnalités / Suggestions
- [ ] Mettre en place un hook Webhook pour relier les **Absences** déclarées sur le site Web directement vers le bot Discord (`gowrax-bot`).
- [ ] Connecter le système d'alerte **Mentoring** avec Discord MP.
- [ ] Synchroniser par le bot (via Supabase) le rôle Roster (High/Academy/Elite) mis à jour sur le serveur Discord vers le site Web.


---

Évènements Passés : Désormais Calendar.jsx récupère tous les évènements. Les futurs sont listés normalement. Tout en bas, j'ai ajouté un menu accordéon "▶ VOIR LES ÉVÈNEMENTS PASSÉS" qui permet de consulter les archives. Ces cartes apparaissent légèrement grisées.
Verrouillage des Interactions :
Si l'évènement est dans le passé : le bouton du joueur passe en statut "ARCHIVÉ", il garde la couleur de son "check-in" final mais devient inactif.
Si le staff modifie la présence d'un joueur (depuis le panel "VOIR APPEL"), la base de données marque marked_by_coach: true. Conséquence : le statut du joueur passe en mode "VERROUILLÉ STAFF" et il ne peut plus l'écraser (c'est grisé et inactif pour lui, mais la couleur de son statut est préservée).
Todo List & Idées pour le Bot Discord (gowrax-bot)
Honnêtement, le site est déjà très dense et fonctionnel (HUD e-sport, Master/Detail sur mobile, gestion de rôles complexes avec rosters, présence avancée). Ce qui manque pour boucler la boucle "écosystème parfait", c'est effectivement les ponts avec Discord.

Vu qu'on a ton code gowrax-bot de dispo et que chaque chose doit se faire en son temps, voici comment on pourrait utiliser le bot pour améliorer le site dans de futures updates :

Ping d'Absence Automatique :
Idée : Quand un joueur signale une "Absence" justifiée sur le site Web, le site Web insère l'entrée dans Supabase, et le Bot lit cette table (ou le site web fait un appel Webhook au Bot) pour poster un message propre dans le salon #absences sur le serveur Discord.
Alertes de Mentoring :
Idée : Quand le Coach rajoute un rapport dans le Dossier (Coaching Hub) d'un joueur, le Bot envoie automatiquement un MP Discord au joueur disant : "Un nouveau compte rendu d'entraînement est disponible sur ton espace Gowrax."
Synchronisation des Rôles (Sens Bot -> Site) :
Idée : Si un joueur passe du roster "Academy" au roster "High" sur Discord, le bot met à jour la table des rôles dans Supabase automatiquement pour que le site web soit toujours 100% raccord avec les grades Discord en temps réel !
Rappels d'Évènements (Check-in) :
Idée : Le bot ping les rosters 1h avant un événement pour leur rappeler de cliquer sur "Présent" sur le site web.
Je pense que la synchro des notifications entre le Bot et le site serait le "Game Changer" final de ton portail. Qu'est-ce que tu en penses ? On focus sur les tests du Calendar pour l'instant ou il y a un des points Discord qui te chauffe en premier ?