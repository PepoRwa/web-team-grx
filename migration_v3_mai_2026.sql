-- MIGRATION GOWRAX - V3 (MAI 2026)
-- Ce script ajoute toutes les tables et colonnes requises pour la mise à jour (Profil, Slow Bloom, VOD Pro)

-- ==============================================================
-- 1. MISE À JOUR DE LA TABLE `vods`
-- ==============================================================
ALTER TABLE public.vods
ADD COLUMN title TEXT NOT NULL DEFAULT 'Sans titre',
ADD COLUMN is_pro BOOLEAN DEFAULT false,
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN players_present JSONB DEFAULT '[]'::jsonb;

-- ==============================================================
-- 2. CRÉATION DE LA TABLE `evolution_submissions` (SLOW BLOOM)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.evolution_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    roster_source TEXT NOT NULL,
    roster_target TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'En attente', -- Valeurs: 'En attente', 'Accepté', 'Refusé', 'Inéligible'
    ai_score INTEGER NOT NULL DEFAULT 0,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    tracker_rank TEXT,
    main_agents JSONB DEFAULT '[]'::jsonb,
    motivation_text TEXT,
    availability_data JSONB,
    performance_links TEXT,
    staff_notes TEXT,
    decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    decision_date TIMESTAMP WITH TIME ZONE,
    cooldown_expires_at TIMESTAMP WITH TIME ZONE,
    is_ineligible_until TIMESTAMP WITH TIME ZONE
);

-- RLS: evolution_submissions
ALTER TABLE public.evolution_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions"
ON public.evolution_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions"
ON public.evolution_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can manage all submissions"
ON public.evolution_submissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (
            profiles.custom_affiliations @> ARRAY['Staff'::text] OR 
            profiles.is_dev = true OR 
            profiles.custom_affiliations @> ARRAY['Fondateurs'::text] OR 
            profiles.custom_affiliations @> ARRAY['Head Coach'::text]
        )
    )
);

-- ==============================================================
-- 3. CRÉATION DE LA TABLE `ai_keyword_bank` (POUR ANALYSE NLP)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.ai_keyword_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- ex: 'mots_positifs_gowrax', 'mots_negatifs', 'arrogance', 'determination'
    sentiment_value INTEGER NOT NULL DEFAULT 0,
    weight NUMERIC NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Injections initiales pour avoir une base de départ
INSERT INTO public.ai_keyword_bank (word, category, sentiment_value, weight) VALUES
('collectif', 'mots_positifs_gowrax', 2, 1.2),
('progression', 'mots_positifs_gowrax', 2, 1.1),
('équipe', 'mots_positifs_gowrax', 1, 1.0),
('easy', 'mots_negatifs', -1, 1.0),
('meilleur', 'arrogance', -2, 1.5),
('apprendre', 'determination', 2, 1.2),
('travailler', 'determination', 2, 1.2),
('carry', 'arrogance', -3, 1.5)
ON CONFLICT (word) DO NOTHING;

-- RLS: ai_keyword_bank
ALTER TABLE public.ai_keyword_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to keyword bank"
ON public.ai_keyword_bank FOR SELECT
USING (true);

CREATE POLICY "Staff manage keyword bank"
ON public.ai_keyword_bank FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (
            profiles.custom_affiliations @> ARRAY['Staff'::text] OR 
            profiles.is_dev = true
        )
    )
);

-- ==============================================================
-- 4. CRÉATION DE LA TABLE `user_documents`
-- (Mentionnée dans les politiques, mais manifestement absente du dump)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    allowed_groups JSONB DEFAULT '[]'::jsonb, -- Array of groups (ex: ["High Roster"])
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS: user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public or own documents"
ON public.user_documents FOR SELECT
USING (
    is_public = true 
    OR auth.uid() = user_id
    OR (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                -- On vérifie s'il y a intersection avec les allowed_groups
                profiles.custom_affiliations && ARRAY(SELECT jsonb_array_elements_text(allowed_groups))
            )
        )
    )
    OR (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.custom_affiliations @> ARRAY['Staff'::text] OR 
                profiles.custom_affiliations @> ARRAY['Fondateurs'::text] OR
                profiles.custom_affiliations @> ARRAY['Head Coach'::text] OR
                profiles.is_dev = true
            )
        )
    )
);

CREATE POLICY "Only High Staff can manage documents"
ON public.user_documents FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (
            profiles.custom_affiliations @> ARRAY['Fondateurs'::text] OR 
            profiles.custom_affiliations @> ARRAY['Head Coach'::text] OR
            profiles.is_dev = true
        )
    )
);
