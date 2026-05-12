<div align="center">

# ⚡ GOWRAX HUB | V3 Tactical Interface : Slow Bloom

**Système d'Information, Portail Sécurisé & Intégration Discord de l'Équipe GOWRAX ESPORT**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)

</div>

---

## 🌸 V3.0.0 : Refonte "Slow Bloom" & Mise en conformité
*Build ID: GRX-V3OOZ | Date: Mai 2026*

Cette mise à jour majeure marque un tournant décisif pour la Gowrax Tactical Interface. L'application délaisse son ancienne architecture pour adopter la nouvelle charte graphique **"Slow Bloom"** (Glassmorphism, tons pastels et lueurs dynamiques), tout en repensant intégralement sa sécurité et sa conformité RGPD.

### ✨ Nouvelles Fonctionnalités (Features)

*   **Refonte du Profil Agent (Remplace l'ancienne page Roster)** :
    *   Véritable carte d'identité premium affichant les rôles, le pseudo Discord, et l'intégration du Tracker.gg.
    *   Calcul automatisé et précis des statistiques de présence (Taux d'implication, retards, absences justifiées).
*   **Coffre-fort de Documents (Bibliothèque classifiée)** :
    *   Le Staff peut assigner des fichiers privés ou publics, avec génération d'URL signées éphémères pour une sécurité maximale.
*   **Laboratoire Lineups** :
    *   Nouvelle base de données visuelle pour le partage de lineups.
    *   Filtres dynamiques par Carte, Agent et Side.
    *   Tags de difficulté (ex: Pixel Perfect) et intégration de lecteurs vidéo (Smart YouTube Embeds).
    *   Gestion des droits d'édition et de suppression (Auteur ou Staff).
*   **VODs & Archives (Dual-System)** :
    *   Séparation claire entre les *Rapports d'Opérations* (Matchs de l'équipe) et la *Veille Stratégique* (Analyse de matchs Pros).
    *   Système d'assignation directe des joueurs présents sur les VODs de l'équipe (les identifiant visuellement dans le débrief).
    *   Nouveau badge **VOD ANALYSÉE** (Check mark officiel du Staff) pour valider une session de review.
*   **Global Footer** : 
    *   Ajout d'un pied de page affichant dynamiquement la version, le build, la date d'inscription du membre et les liens légaux.

### 🧪 En cours d'expérimentation (Bêta)

*   **Module Évolution ("Slow Bloom")** :
    *   *Note de développement* : L'interface de demande de promotion et l'assistant NLP (IA) sont actuellement implémentés à des fins de test. Le pipeline complet de traitement, les cooldowns d'anti-spam (30-60 jours) et l'analyse sémantique automatique seront pleinement opérationnels dans une mise à jour mineure ultérieure.

### 🛠️ Optimisations & Refactoring

*   **Responsive & PWA (Mobile First)** : Refonte totale de la navigation sur mobile. La barre de menu inférieure est désormais scrollable horizontalement, garantissant l'accès à 100% des modules depuis un smartphone.
*   **Disponibilités & Planning** : Interface épurée et ajout futur de filtres d'exportation pour la création rapide de plannings.
*   **Stratbook** : Intégration améliorée des liens externes (ex: Valoplant) et traçabilité des modifications (Auteur/Dates).

### 🔒 Sécurité & RGPD (Suppressions)

Afin de garantir une stricte conformité au RGPD et alléger la charge de nos bases de données, plusieurs systèmes intrusifs ont été retirés :

*   **Suppression du DevPanel V2** : Le panneau développeur complexe a été détruit. Il est remplacé par un "Centre de Contrôle" épuré permettant au Staff de gérer la version de l'application et de désactiver l'accès à certains modules à la volée.
*   **Désactivation du Realtime Tracking** : Le radar temps réel (WebSockets) traçant l'activité des joueurs seconde par seconde a été supprimé.
*   **Nettoyage BDD** : Destruction des tables `system_logs`, `discord_cache`, et `bug_reports`. Le tracking des bugs se fera désormais exclusivement via les Issues GitHub.
*   **RLS (Row Level Security)** : Renforcement des règles de base de données, en particulier sur le Supabase Storage (seul le staff peut uploader/détruire des documents).

---

## ⚙️ Architecture Technique & Stack

L'architecture repose sur un triangle robuste :

1.  **Frontend Web (Ce Dépôt)** 👉 `React 19` + `Vite` + `Tailwind CSS v4`
    *   Interface "Slow Bloom" (Glassmorphism, tons pastels).
    *   Design ultra-responsive (Bottom Nav Mobile, Side Panel Desktop).
    *   Intégration de balises **Open Graph** pour des prévisualisations enrichies parfaites lors des partages sur Discord.
2.  **Backend "BaaS"** 👉 `Supabase`
    *   Authentification Discord OAuth (liaison automatique de l'`user_id` et du `discord_id`).
    *   Row Level Security (RLS) renforcé pour sécuriser chaque donnée et fichier.
3.  **Bot Discord (Externe)** 👉 `Node.js` + `discord.js v14`
    *   Connecté avec la `SERVICE_ROLE_KEY` de Supabase.
    *   Écouteur backend pour interagir avec le frontend.

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

## 👥 Contributeurs & Équipe

Un immense merci à ceux qui ont bâti et perfectionné l'infrastructure numérique de la structure :

*   **👑 Antoine (PepoRwa)** - *Fondateur, Architecte Principal & Lead Développeur* :
    Développement entier de l'interface React, structuration de la BDD Supabase, création du bot Discord `gowrax-bot`, design UI/UX et intégration de la logique PWA.
*   **🤖 Assistant IA (GitHub Copilot)** - *Pair Programmer & DevOps Helper* :
    Assistance au débogage collaboratif, refonte de la DA "Slow Bloom", optimisation de la PWA et des mesures de sécurité.

---

<div align="center">
  <p><i>© 2026 GOWRAX ESPORT. ALL SYSTEMS NOMINAL. "La tactique commence ici."</i></p>
</div>
