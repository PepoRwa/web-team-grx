<div align="center">

# ⚡ GOWRAX HUB | V2 Tactical Interface

**Système d'Information, Portail Sécurisé & Intégration Discord de l'Équipe GOWRAX ESPORT**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)

</div>

---

## 📌 Présentation Générale

Bienvenue sur le portail d'administration de la structure e-sport **GOWRAX**. Conçu tel un "ERP" (Enterprise Resource Planning) pour le gaming compétitif, ce Hub centralise toute la vie de la structure : des strat-books aux disponibilités, en passant par le mentorat et l'historique des matchs.

Dans cette **Version 2.0**, l'application devient l'épicentre d'un écosystème interconnecté. Le site web (React) communique en **temps réel** avec le Bot Discord Node.js de la structure via les websockets de Supabase.

L'application est également une **PWA (Progressive Web App)** : installable nativement sur iOS, Android et PC pour une expérience "App Mobile" optimale avec navigation tactile.

---

## 🚀 Écosystème & Fonctionnalités (V2)

### 🤖 1. Intégration Discord & Realtime (Le Cœur du Système)
Le site web n'est plus isolé. Toutes les actions clés déclenchent des notifications silencieuses en base de données qui sont interceptées instantanément par le bot Discord officiel (`gowrax-bot`) :
*   **Alerte Absence** : Dès qu'un joueur déclare une absence sur le Hub, le bot informe les salons Staff.
*   **Notifications de Mentorat** : Quand un Coach assigne un objectif tactique depuis le site, le joueur reçoit un **Message Privé (DM)** formaté avec les couleurs GOWRAX (Embed) contenant ses consignes de VOD.
*   **Alerte Match & Calendrier** : Planifier un Scrim sur le site envoie une alerte ping dans le salon du Roster concerné (High, Academy, etc.).

### 🎓 2. Mentorat & Coaching Hub
*   Interface asymétrique : Vue synthétique pour les joueurs (Mes objectifs, Ma progression), et Vue globale pour le Staff.
*   Création d'objectifs personnalisés (ex: "Crosshair Placement", "Retake A Bind").
*   Fiches de suivi des VODs personnelles.

### ⏳ 3. Disponibilités & Absences (Heatmap)
*   **Grille de Dispos** : Gestion au créneau près (par 30 minutes) inspirée des plannings pros.
*   **Heatmap Staff** : Vue radar permettant aux Coachs de voir les trous de disponibilité d'un Roster entier pour planifier les matchs.
*   **Module de Congés** : Soumission de motif d'absence et justificatif. Validation/Refus par le Staff avec changement de statut.

### 📅 4. Calendrier & Événements
*   Séparation par typologie : *Pracc*, *Match Officiel*, *Tournoi*, *Réunion Tactique*.
*   Filtre automatique : Un joueur "Academy" ne voit pas le planning "Tryhard" afin de réduire la charge mentale.

### 📖 5. Strat-Book & Archives VOD
*   Librairie tactique classée par Map et Side (Attaque/Défense).
*   Dossiers VODs de matchs : Historique avec scores, liens cachés, et codes couleurs (Victoire/Défaite).
*   Garde-fous de suppression réservé aux Super-Admins et Créateurs de la strat.

---

## ⚙️ Architecture Technique & Stack

L'architecture repose sur un triangle robuste :

1.  **Frontend Web (Ce Dépôt)** 👉 `React 19` + `Vite` + `Tailwind CSS v4`
    *   Interface cyber-esport (Polices *Rajdhani* et *TechMono*).
    *   Design ultra-responsive (Bottom Nav Mobile, Side Panel Desktop).
    *   Intégration de balises **Open Graph** pour des prévisualisations enrichies parfaites lors des partages sur Discord.
2.  **Backend "BaaS"** 👉 `Supabase`
    *   Authentification Discord OAuth (liaison automatique de l'`user_id` et du `discord_id`).
    *   Row Level Security (RLS) pour sécuriser chaque donnée selon le roster.
    *   **Postgres Changes (WebSockets)** : Signal en temps réel activé sur la table `notifications`.
3.  **Bot Discord (Externe)** 👉 `Node.js` + `discord.js v14`
    *   Connecté avec la `SERVICE_ROLE_KEY` de Supabase.
    *   Écouteur passif qui se réveille uniquement quand le site web écrit dans la BDD.

---

## 🛠️ Installation Locale (Développeurs)

### 1. Cloner le projet
```bash
git clone https://github.com/PepoRwa/web-team-grx.git
cd web-team-grx
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'Environnement (`.env.local`)
Récupérez les clés de l'API Supabase GOWRAX. Créez un fichier `.env.local` à la racine :
```env
VITE_SUPABASE_URL="votre_url_supabase"
VITE_SUPABASE_ANON_KEY="votre_cle_anon"
```

### 4. Lancer l'environnement de développement
```bash
npm run dev
# Le site sera accessible sur http://localhost:5173
```

---

## 📦 Déploiement

Le site est hébergé de manière serverless. Pour compiler le code de production et l'envoyer en ligne :
```bash
npm run build
npm run deploy
```
*(Ceci déploiera automatiquement le site sur la branche `gh-pages` hébergée par GitHub).*


> [!ERROR]
> Précision: Cette fonctionnalité n'est pas encore supportée. La repository étant privée
---

## 👥 Contributeurs & Équipe

Un immense merci à ceux qui ont bâti et perfectionné l'infrastructure numérique de la structure :

*   **�� Antoine (PepoRwa)** - *Fondateur, Architecte Principal & Lead Développeur* :
    Développement entier de l'interface React, structuration de la BDD Supabase, création du bot Discord `gowrax-bot`, design UI/UX et intégration de la logique PWA.
*   **🤖 Assistant IA (GitHub Copilot)** - *Pair Programmer & DevOps Helper* :
    Assistance au débogage collaboratif, refonte des layouts responsives, optimisation de la PWA, et mise en place sécurisée du pipeline temps réel "Web ➔ Supabase ➔ Bot Discord".

---

<div align="center">
  <p><i>© 2026 GOWRAX ESPORT. ALL SYSTEMS NOMINAL. "La tactique commence ici."</i></p>
</div>
