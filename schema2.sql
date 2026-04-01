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
  public.has_role('Staff') OR public.has_role('Chef Staff') OR public.has_role('Coach')
);

-- ================= POLITIQUES DES PRÉSENCES (checkins) =================

DROP POLICY IF EXISTS "Tout le monde peut voir les checkins" ON public.checkins;
DROP POLICY IF EXISTS "Modif checkins" ON public.checkins;

CREATE POLICY "Tout le monde peut voir les checkins" 
ON public.checkins FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Modif checkins" 
ON public.checkins FOR ALL USING (
  auth.uid() = user_id OR public.has_role('Staff') OR public.has_role('Chef Staff') OR public.has_role('Coach')
);
