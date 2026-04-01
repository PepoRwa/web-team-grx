# 🚀 Roadmap : Gowrax Team Hub

## 🎨 Charte Graphique & UI (Glassmorphism)
* **Fonts :** `Rajdhani` (Titres), `Poppins` (Corps), `Rock Salt` (Accents), `Tech Mono` (Code/Stats).
* **Palette :**
    * Principal : `Gowrax Purple (#6F2DBD)`
    * Fond : `Void Blue (#1A1C2E)` & `Abyss Black (#0D0E15)`
    * Accent : `Neon Magenta (#D62F7F)`
* **Composants :** Cartes avec `backdrop-blur-md`, bordures semi-transparentes et lueurs néons (`box-shadow`).

---

## 🛠 Phase 1 : Infrastructure & Auth (La Porte)
- [x] **Setup Initial :** Vite + React + Tailwind CSS.
- [x] **Configuration Supabase :** Création du projet et liaison Discord OAuth2.
    - Informations supabase: 
        - URL: ...
        - Clé Anon: ... 
- [x] **Discord Role Sync :** * Mise en place d'une **Edge Function** (Supabase) qui interroge l'API Discord au moment de la connexion pour récupérer les IDs de rôles. 
    - Alternative: Un bot discord créée et hébergé (code source accessible au /gowrax-bot du workspace) pour réaliser ces actions
    * Matching automatique avec la table `user_roles` en base de données.
- [x] **Landing Page :** Page vitrine stylée avec un gros bouton "Login with Discord" (Style Néon/Magenta).
    - Déjà faite (exemple type. (index.html) on peut cependant le perfectionner. )

---

## 🔐 Phase 2 : Système de Permissions (Le Cerveau)
- [x] **Architecture RLS :** Configurer les *Row Level Security* sur Supabase pour nos futures tables (liées aux Rôles).
    * *Exemple :* Seul un `Coach` ou `Chef Staff` peut `INSERT` dans la table `events`.
- [x] **Hook de Permission :** Créer un hook React `usePermissions()` pour masquer/afficher les éléments de l'interface en temps réel.
- [x] **Table des Rôles :** Mapper les rôles Discord vers les "Capabilities" (ex: `Founder` -> `bypass_rls`) ou vérifier directement le nom du rôle via SQL.

---

## 📅 Phase 3 : Calendrier & Check-in (Le Cœur)
- [x] **Vue Calendrier :** Liste des entraînements/matchs filtrée par équipe (Vues : Hebdomadaire/Liste).
- [x] **Système de Check-in :**
    * Bouton de présence (disponible X minutes avant l'heure).
    * Statuts : `En attente`, `Présent`, `Retard`, `Absent`.
- [x] **Mode Roll-Call (Coach) :** Interface spécifique permettant au coach de cocher manuellement les joueurs (écrase le check-in auto).
- [x] **Commentaires :** Système de notes privées (Staff uniquement) ou publiques sur chaque fiche de présence.

---

## 🕒 Phase 4 : Gestion des Disponibilités (À FAIRE PLUS TARD)
- [x] **Grille de Présence :**
    * *V1 :* Sélecteur simple par créneaux (Matin / Midi / Aprèm / Soir / Nuit).
    * *V2 :* Sélecteur d'heures précises.
- [x] **Dashboard Coach :** Vue statistique montrant les "Heatmaps" de disponibilité (ex: "Mardi soir est le meilleur créneau car 5/5 joueurs sont libres").
- [ ] en cas d'absences format d'absences. Justification et tt

---

## 👤 Phase 5 : Profils & Dossiers Staff (L'Identité & Suivi)
- [x] **Table SQL `player_notes` :** Carnet de notes privé protégé par RLS (Staff Only).
- [x] **Interface Dossiers :** Onglet "Dossiers Joueurs" accessible uniquement au Staff/Coach.
- [x] **Fiche Joueur :** Intégration des données de présence (Taux de participation, ponctualité) et lecture/écriture des notes secrètes.
- [x] **Statut Team :** Affichage de l'équipe de rattachement et du statut (Titulaire/Remplaçant).
- [ ] **Intégrations (Optionnel) :** Liens vers les stats In-Game.

---

## 📱 Phase 6 : Optimisation & PWA
- [ ] **Adaptation PC :** Sidebar fixe à gauche + Header technique (`Tech Mono`).
- [ ] **Adaptation Mobile :** TabBar en bas (style Insta) pour accès pouce facile.
- [ ] **Manifest PWA :** Permettre l'installation sur mobile (icône Gowrax, splashscreen).
- [ ] **Sécurité :** `robots.txt` (no-index) et obfuscation des routes sensibles.

---

### 💡 Conseils pour ton code (avec Copilot)

1.  **Pour le Glassmorphism en Tailwind :**
    Demande à Copilot : *"Create a React card component with glassmorphism using Tailwind: backdrop-blur, semi-transparent border, and a subtle neon glow using Gowrax Purple #6F2DBD."*

2.  **Pour la logique de rôle :**
    Demande : *"Write a Supabase RLS policy where only users with the 'coach' role in the user_roles table can insert into the events table."*

3.  **Pour la gestion Mobile/PC :**
    Utilise des composants conditionnels :
    ```javascript
    {isMobile ? <BottomNav /> : <Sidebar />}
    ```
