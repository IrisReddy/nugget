-- ==============================================================================
-- Migration: 20260925_create_bookmarks.sql
-- Name: create_bookmarks_table
-- Description: Creates the bookmarks table for Step 10 Personalization.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_url TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    source_name TEXT,
    category TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, article_url)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookmarks' AND policyname = 'Users can view their own bookmarks'
    ) THEN
        CREATE POLICY "Users can view their own bookmarks" 
        ON public.bookmarks FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookmarks' AND policyname = 'Users can insert their own bookmarks'
    ) THEN
        CREATE POLICY "Users can insert their own bookmarks" 
        ON public.bookmarks FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookmarks' AND policyname = 'Users can delete their own bookmarks'
    ) THEN
        CREATE POLICY "Users can delete their own bookmarks" 
        ON public.bookmarks FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;
