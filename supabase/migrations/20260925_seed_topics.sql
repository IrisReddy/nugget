-- ==============================================================================
-- Migration: 20260925_seed_topics.sql
-- Name: seed_default_topics
-- Description: Seeds baseline topics for all 10 categories and secures reading verification RLS.
-- ==============================================================================

-- 1. Insert baseline topics for each category
INSERT INTO public.topics (title, description, slug, category_id)
SELECT t.title, t.description, t.slug, c.id
FROM (
    VALUES
        ('AI & Computing Frontiers', 'Emerging software, models, and silicon architectures.', 'ai-computing', 'Technology'),
        ('Empirical Science & Cosmos', 'Astronomy, quantum mechanics, and planetary discovery.', 'science-cosmos', 'Science'),
        ('Global Markets & Enterprise', 'Macro ventures, capital reallocation, and industrial change.', 'markets-enterprise', 'Business'),
        ('Geopolitics & Global Order', 'Multilateral diplomacy, conflict dynamics, and statecraft.', 'geopolitics-order', 'World'),
        ('Public Policy & Governance', 'Legislative movements, civil institutions, and electoral shifts.', 'policy-governance', 'Politics'),
        ('Longevity & Clinical Science', 'Public health developments, pathology, and cognitive science.', 'longevity-health', 'Health'),
        ('Fiscal Dynamics & Currencies', 'Monetary policy, central banking, and financial instruments.', 'fiscal-finance', 'Finance'),
        ('Athletic Science & Culture', 'Sports analytics, biomechanics, and competitive systems.', 'sports-culture', 'Sports'),
        ('Arts, Media & Digital Storytelling', 'Cinematic narrative, music streaming, and creative industries.', 'arts-media', 'Entertainment'),
        ('Precedents & Civilizational History', 'Historical parallels, archival analysis, and historical inquiry.', 'precedents-history', 'History')
) AS t(title, description, slug, category_name)
JOIN public.categories c ON c.name = t.category_name
WHERE NOT EXISTS (
    SELECT 1 FROM public.topics WHERE public.topics.slug = t.slug
);

-- 2. Ensure RLS policies on reading_sessions
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reading_sessions' AND policyname = 'Users can insert their own reading sessions'
    ) THEN
        CREATE POLICY "Users can insert their own reading sessions"
        ON public.reading_sessions FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reading_sessions' AND policyname = 'Users can view their own reading sessions'
    ) THEN
        CREATE POLICY "Users can view their own reading sessions"
        ON public.reading_sessions FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reading_history' AND policyname = 'Users can insert their own reading history'
    ) THEN
        CREATE POLICY "Users can insert their own reading history"
        ON public.reading_history FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reading_history' AND policyname = 'Users can view their own reading history'
    ) THEN
        CREATE POLICY "Users can view their own reading history"
        ON public.reading_history FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    -- Ensure RLS on xp_events
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'xp_events' AND policyname = 'Users can insert their own xp events'
    ) THEN
        CREATE POLICY "Users can insert their own xp events"
        ON public.xp_events FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'xp_events' AND policyname = 'Users can view their own xp events'
    ) THEN
        CREATE POLICY "Users can view their own xp events"
        ON public.xp_events FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;
