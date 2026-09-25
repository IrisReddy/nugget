-- ==============================================================================
-- Migration: 20260925_seed_achievements.sql
-- Name: seed_nugget_achievements
-- Description: Seeds milestone achievements and configures RLS for user achievements.
-- ==============================================================================

-- 1. Insert core milestone achievements
INSERT INTO public.achievements (name, description, icon, xp_reward)
SELECT a.name, a.description, a.icon, a.xp_reward
FROM (
    VALUES
        ('First Nugget', 'Verified your very first daily intelligence briefing.', 'Sparkles', 20),
        ('Curiosity Rekindled', 'Maintained a 3-day consecutive reading habit.', 'Flame', 50),
        ('Unbroken Habit', 'Maintained a 7-day uninterrupted learning streak.', 'Award', 100),
        ('Polymath Apprentice', 'Verified dispatches across 3 distinct topic categories.', 'Compass', 30),
        ('Centurion Scholar', 'Accumulated over 100 total verified XP points.', 'ShieldCheck', 50)
) AS a(name, description, icon, xp_reward)
WHERE NOT EXISTS (
    SELECT 1 FROM public.achievements WHERE public.achievements.name = a.name
);

-- 2. Ensure RLS on achievements & user_achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Achievements public read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'achievements' AND policyname = 'Achievements are viewable by everyone'
    ) THEN
        CREATE POLICY "Achievements are viewable by everyone"
        ON public.achievements FOR SELECT
        USING (true);
    END IF;

    -- User achievements read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_achievements' AND policyname = 'Users can view their own achievements'
    ) THEN
        CREATE POLICY "Users can view their own achievements"
        ON public.user_achievements FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    -- User achievements insert
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_achievements' AND policyname = 'Users can unlock their own achievements'
    ) THEN
        CREATE POLICY "Users can unlock their own achievements"
        ON public.user_achievements FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
