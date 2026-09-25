-- ==============================================================================
-- Migration: 20260925_seed_categories.sql
-- Name: seed_categories_and_read_policy
-- Description: Seeds the 10 initial NUGGET categories and ensures public read access.
-- ==============================================================================

-- 1. Insert initial categories idempotently
INSERT INTO public.categories (name, description)
SELECT name, description FROM (
    VALUES
        ('Technology', 'Computing, artificial intelligence, software, and hardware breakthroughs.'),
        ('Science', 'Physics, biology, space exploration, and empirical discoveries.'),
        ('Business', 'Markets, industrial strategy, startups, and economic models.'),
        ('World', 'Geopolitics, international affairs, and global structural shifts.'),
        ('Politics', 'Governance, policy analysis, legislation, and civic systems.'),
        ('Health', 'Medical research, public health, neuroscience, and longevity.'),
        ('Finance', 'Macroeconomics, banking, fiscal policy, and currency dynamics.'),
        ('Sports', 'Athletic science, sporting culture, and competitive performance.'),
        ('Entertainment', 'Cinematic arts, narrative media, music, and creative industries.'),
        ('History', 'Historical precedents, archival inquiries, and civilizational patterns.')
) AS new_cats(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories WHERE public.categories.name = new_cats.name
);

-- 2. Ensure RLS is active and allows public SELECT on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' AND policyname = 'Categories are viewable by everyone'
    ) THEN
        CREATE POLICY "Categories are viewable by everyone" 
        ON public.categories FOR SELECT 
        USING (true);
    END IF;
END $$;
