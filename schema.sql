-- Table des profils utilisateurs liés à l'authentification
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    discord_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des rôles possibles (ex: Founder, Coach, Player)
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    discord_role_id TEXT UNIQUE -- Optionnel: pour lier directement à l'ID du rôle sur ton serveur Discord
);

-- Table de liaison Utilisateur <-> Rôles
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Table pour la file d'attente de synchronisation (le bot Discord va écouter cette table)
CREATE TABLE IF NOT EXISTS public.sync_requests (
    id SERIAL PRIMARY KEY,
    discord_id TEXT NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    scanned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer Row Level Security (RLS)
ALTER TABLE public.sync_requests ENABLE ROW LEVEL SECURITY;

-- Politiques (Policies) basiques :
-- Suppression des existantes au cas où on relance le script
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Roles are viewable by authenticated users." ON public.roles;
DROP POLICY IF EXISTS "User roles are viewable by authenticated users." ON public.user_roles;

-- Chacun peut lire les profils
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

-- L'utilisateur peut modifier son propre profil
CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tous les utilisateurs connectés peuvent voir les rôles
CREATE POLICY "Roles are viewable by authenticated users." 
ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "User roles are viewable by authenticated users." 
ON public.user_roles FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger de création automatique de profil après connexion Discord sur Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, discord_id, username, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'provider_id',
    COALESCE(new.raw_user_meta_data->'custom_claims'->>'global_name', new.raw_user_meta_data->>'full_name', 'Unknown'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url;

  -- Envoyer une demande de synchronisation au bot Discord
  INSERT INTO public.sync_requests (discord_id, profile_id)
  VALUES (new.raw_user_meta_data->>'provider_id', new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Activer le Realtime sur sync_requests pour le bot
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'sync_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sync_requests;
  END IF;
END $$;

-- ==========================================
-- PHASE 2 & 3 : SYSTÈME DE PERMISSIONS ET CALENDRIER (ÉVÉNEMENTS & CHECK-INS)
-- ==========================================

-- 1. Fonction Utilisateur Magique (Bypass RLS)
-- Permet de vérifier rapidement en SQL si l'utilisateur actuel a un rôle spécifique (ex: 'Chef Staff', 'Coach')
CREATE OR REPLACE FUNCTION public.has_role(target_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
      AND r.name = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Table des Événements (Matchs, Entraînements, Réunions)
CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,    
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('training', 'match', 'meeting', 'tournament')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table des Check-ins (Présences)
-- Statuts : pending (attente), present (présent), late (retard), absent (absent)
CREATE TABLE IF NOT EXISTS public.checkins (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'present', 'late', 'absent')),
    note TEXT, -- Commentaire optionnel ou justification d'absence
    marked_by_coach BOOLEAN DEFAULT false, -- True si c'est un coach qui a forcé l'appel
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, user_id) -- Un seul statut de check-in par personne par événement
);

-- Activation de la Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes politiques si relance du script
DROP POLICY IF EXISTS "Tout le monde peut voir les evts" ON public.events;
DROP POLICY IF EXISTS "Seul Staff Coach suppr_creates evts" ON public.events;

-- ================= POLITIQUES DES ÉVÉNEMENTS (events) =================

CREATE POLICY "Tout le monde peut voir les evts" 
ON public.events FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Seul Staff Coach suppr_creates evts" 
ON public.events FOR ALL USING (
  public.has_role('Fondateurs') OR public.has_role('Staff') OR public.has_role('Chef Staff') OR public.has_role('Coach') OR public.has_role('Head Coach')
);

-- ================= POLITIQUES DES PRÉSENCES (checkins) =================

DROP POLICY IF EXISTS "Tout le monde peut voir les checkins" ON public.checkins;
DROP POLICY IF EXISTS "Modif checkins" ON public.checkins;

CREATE POLICY "Tout le monde peut voir les checkins" 
ON public.checkins FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Modif checkins" 
ON public.checkins FOR ALL USING (
  auth.uid() = user_id OR public.has_role('Fondateurs') OR public.has_role('Staff') OR public.has_role('Chef Staff') OR public.has_role('Coach') OR public.has_role('Head Coach')
);

-- ==========================================
-- PHASE 5 : DOSSIERS JOUEURS & NOTES STAFF CI-DESSOUS
-- ==========================================

-- Table pour stocker les notes "secrètes" du Staff sur un joueur
CREATE TABLE IF NOT EXISTS public.player_notes (
    id SERIAL PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Le coach/staff qui a écrit la note
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de la Row Level Security (RLS) pour garantir la confidentialité
ALTER TABLE public.player_notes ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes politiques si le script est relancé
DROP POLICY IF EXISTS "Seul le staff peut lire les notes" ON public.player_notes;
DROP POLICY IF EXISTS "Seul le staff peut ecrire et modifier les notes" ON public.player_notes;

-- Lecture des notes : Strictement réservé au Staff / Fondateurs / Coachs
CREATE POLICY "Seul le staff peut lire les notes" 
ON public.player_notes FOR SELECT USING (
  public.has_role('Fondateurs') OR public.has_role('Staff') OR public.has_role('Chef Staff') OR public.has_role('Coach') OR public.has_role('Head Coach')
);

-- Écriture / Modification des notes : Strictement réservé au Staff / Fondateurs / Coachs
CREATE POLICY "Seul le staff peut ecrire et modifier les notes" 
ON public.player_notes FOR ALL USING (
  public.has_role('Fondateurs') OR public.has_role('Staff') OR public.has_role('Chef Staff') OR public.has_role('Coach') OR public.has_role('Head Coach')
);

-- ==========================================
-- PHASE 4 : GESTION DES DISPONIBILITÉS (HEATMAP)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_availabilities (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    schedule JSONB NOT NULL DEFAULT '{}'::jsonb, -- Grille stockée au format JSON (ex: {"lundi": {"matin": true, ...}})
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_availabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout le monde peut voir les dispos" ON public.user_availabilities;
DROP POLICY IF EXISTS "Les utilisateurs modifient leurs propres dispos" ON public.user_availabilities;

-- Tout membre connecté peut voir les disponibilités des autres membres de l'équipe (utile pour le Heatmap)
CREATE POLICY "Tout le monde peut voir les dispos" 
ON public.user_availabilities FOR SELECT USING (auth.role() = 'authenticated');

-- Chacun met à jour sa propre grille
CREATE POLICY "Les utilisateurs modifient leurs propres dispos" 
ON public.user_availabilities FOR ALL USING (auth.uid() = user_id);
