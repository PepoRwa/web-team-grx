<div align="center">

# ⚡ GOWRAX HUB | Tactical Interface

**Système d'Information & Portail Sécurisé de l'Équipe GOWRAX ESPORT**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

## 📌 Présentation

Bienvenue sur le portail sécurisé GOWRAX. Ce hub centralise les plannings, les présences, et les outils stratégiques exclusifs aux membres validés de la structure. Connecté via Discord, il permet au Haut Roster (High/Academy/Chill/Tryhard) et au Staff de gérer efficacement la vie de l'équipe et les plannings compétitifs.

L'application agit comme une "Progressive Web App" (PWA), installable directement sur mobile et PC avec une interface "hybride" ultra-optimisée pour le tactile.

---

## 🚀 Fonctionnalités Principales

*   **📅 Calendrier Actif**
    *   Consultation des praccs, tournois, et matchs (Scrims).
    *   Vue détaillée des events avec participants, cartes, adversaires etc.
*   **⏳ Disponibilités & Heatmap (Type Pronote)**
    *   Grille de disponibilité Hyper-précise (Intervalles de 30 mins) conçue pour le mobile.
    *   Système complet de Déclaration d'Absence (Justifications soumises au Staff).
    *   **Jauge de Tolérance (3 strikes)** : Visualisation de l'assiduité directement sur le profil joueur.
*   **📖 Strat-Book GOWRAX**
    *   L'armoirie tactique de l'équipe.
    *   Upload, lecture plein-écran de Setups et Retakes.
    *   Filtrage optimisé par Map (Ascent, Bind, Haven...) et Side (Défense/Attaque).
*   **🎥 Archives VODs**
    *   Hub central recensant tous les replays des matchs.
    *   Code Couleur : Vert (Win), Rouge (Loose), Jaune (Draw).
    *   Ajout de VOD par Roster, avec lien vidéo, score et adversaires.
    *   Contrôle d'accès (Seul l'auteur et le Staff peuvent supprimer).
*   **�� Dossiers Accréditation Staff**
    *   Dashboard classé secret-défense pour les Coachs et le Staff.
    *   Consultation de la "Heatmap" globale (Suivi des présences).
    *   Validation ou refus des demandes de congés/absences déclarées.
*   **🔔 Alerts System (Notifications en temps réel)**
    *   Cloche de notifications interceptant les actions de l'équipe (par Roster) et annonces globales.
*   **📱 Interface PWA Hybride**
    *   Bouton d'installation native (Android/Desktop) et astuce pour iOS (Safari).
    *   Vue mobile Insta-style avec une "Bottom Nav" interactive.
    *   Design Cyber/Neon (TechMono, Rajdhani, Poppins, mode Abyss dark).

---

## ⚙️ Technologies

*   **Front-end** : React (Vite) + Tailwind CSS (Styling & Responsive)
*   **Base de Données / Backend As A Service** : Supabase (PostgreSQL, Row Level Security - RLS, Real-time channels)
*   **Authentification** : Supabase Auth (via Discord OAuth)
*   **Déploiement** : GitHub Pages (`npm run deploy`)

---

## 🛠️ Installation & Démarrage

### 1. Cloner le projet
```bash
git clone https://github.com/PepoRwa/web-team-grx.git
cd web-team-grx
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'Environnement (.env.local)
Créez un fichier `.env.local` à la racine pour vous lier au Supabase de l'équipe :
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```

---

## 🔐 Système de Droits & Rôles (RBAC)

Les accès sont conditionnés par les rôles assignés dans la base de données.
*   **Opérateur** : Rôle par défaut (Visualisation standard).
*   **Rosters (High, Academy, Tryhard, Chill)** : Peuvent interagir avec leurs events et VODs associés.
*   **Staff & Head Coach** : Accès étendu (Accréditations, Dashboard Staff, bypass de suppression VODs, validation des présences).

---

<div align="center">
  <p><i>© 2026 GOWRAX ESPORT. ALL SYSTEMS NOMINAL.</i></p>
</div>
