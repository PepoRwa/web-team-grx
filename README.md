<div align="center">

# 🌸 GOWRAX HUB | V3 Tactical Interface : Slow Bloom

**Système d'Information, Portail Sécurisé & Intégration Discord de l'Équipe GOWRAX ESPORT**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)

</div>

---

## 📌 Présentation Générale

Bienvenue sur le portail d'administration de la structure e-sport **GOWRAX**. Conçu tel un "ERP" (Enterprise Resource Planning) pour le gaming compétitif, ce Hub centralise toute la vie de la structure : du suivi des performances à l'apprentissage stratégique, en passant par le stockage de documents sécurisés.

Avec cette **Version 3.0**, l'application adopte la nouvelle charte graphique **"Slow Bloom"** (Glassmorphism, tons pastels, lueurs dynamiques) et devient une **PWA (Progressive Web App)** Mobile-First. Le Hub ne se contente plus d'être un site : c'est l'épicentre d'un écosystème ultra-sécurisé connecté en temps réel avec notre Bot Discord.

---

## 🚀 Écosystème & Fonctionnalités (V3)

### 📊 1. Profil Agent & Statistiques (Nouveau)
*   **Carte d'identité premium** affichant les rôles, les liens Discord, et une intégration complète du profil **Tracker.gg**.
*   Calcul automatisé des **statistiques de présence** (taux d'implication, retards, absences justifiées) pour un suivi managérial précis.

### 🎥 2. Laboratoire Lineups & VODs (Dual-System)
*   **Labo Lineups** : Base de données visuelle pour le partage de setups tactiques. Filtres dynamiques (Map, Side, Agent), tags de difficulté (ex: *Pixel Perfect*), et lecteurs vidéo intégrés (*Smart YouTube Embeds*).
*   **VODs & Stratégie** : Séparation claire entre les *Rapports d'Opérations* (nos propres matchs) et la *Veille Stratégique* (analyses de matchs pros). 
*   **Tracking VOD** : Système d'intégration visuelle des joueurs présents lors des scrims, et validation par le Staff via un badge officiel **VOD ANALYSÉE**.

### 🔒 3. Coffre-fort & Bibliothèque Sécurisée
*   Stockage de fichiers publics ou classifiés (confidentiels) assignés par le Staff.
*   Génération d'**URL signées éphémères** via Supabase garantissant que seul le joueur autorisé peut ouvrir le document avant péremption du lien.

### 🤖 4. Intégration Discord Interactive
Toutes les actions majeures sur le site Web dialoguent avec notre bot Discord (`gowrax-bot`) en arrière-plan :
*   Notifier le Staff d'une absence directement sur le serveur Discord.
*   Envoyer les objectifs de mentorat ou de VOD aux joueurs en DM (Messages Privés) via un formatage "Embed" ultra-propre.

---

## 🛡️ Sécurité & Conformité RGPD

La transition vers la V3 marque notre engagement strict envers la protection des données et le **RGPD** :

*   **Destruction du tracking temps réel** : Les WebSockets intrusifs retraçant l'activité des joueurs à la seconde ont été définitivement supprimés.
*   **Nettoyage BDD** : Suppression des tables de logs invasives (`system_logs`, `discord_cache`).
*   **Row Level Security (RLS)** : Renforcement absolu des bases de données Supabase. L'édition, la suppression et le téléversement de documents/vidéos sont mathématiquement impossibles sans un compte Staff certifié.
*   **Centre de Contrôle Minimaliste** : Refonte du dev-panel en un espace épuré pour piloter les modules de la plateforme à la volée.

---

## ⚙️ Architecture Technique & Stack

L'architecture repose sur un triangle robuste :

1.  **Frontend Web (Ce Dépôt)** 👉 `React 19` + `Vite` + `Tailwind CSS v4`
    *   Design "Slow Bloom" immersif et responsivité totale (Navigation Mobile Horizontale).
2.  **Backend "BaaS"** 👉 `Supabase`
    *   Authentification Discord OAuth logicielle (liaison automatique des comptes).
    *   Base hybride PostgreSQL avec règles strictes (RLS).
3.  **Bot Discord (Externe)** 👉 `Node.js` + `discord.js v14`
    *   Connecté et réveillé par les webhooks / logs de la base de données.

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
    Développement global de l'interface React V3, refonte UX/UI "Slow Bloom", structuration de la BDD Supabase, création du bot Discord `gowrax-bot`, et intégration PWA.
*   **🤖 Assistant IA (GitHub Copilot)** - *Pair Programmer & DevOps Helper* :
    Assistance au débogage collaboratif, refonte de la DA "Slow Bloom", optimisation de la PWA et durcissement des mesures de sécurité.

---

<div align="center">
  <p><i>© 2026 GOWRAX ESPORT. ALL SYSTEMS NOMINAL. "La tactique commence ici."</i></p>
</div>
