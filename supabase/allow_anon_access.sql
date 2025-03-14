-- This SQL file modifies RLS policies to allow anonymous and public access
-- for development and testing purposes only

-- Create a function to tell whether we're in development mode (always returns true for local dev)
CREATE OR REPLACE FUNCTION is_development()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN TRUE; -- Always true for local development
END;
$$;

-- Remove RLS from tables to simplify local development
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE panels DISABLE ROW LEVEL SECURITY;
ALTER TABLE sentences DISABLE ROW LEVEL SECURITY;
ALTER TABLE words DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;

-- Create or replace policies for all content to allow public access
DROP POLICY IF EXISTS "Allow public access to stories" ON stories;
CREATE POLICY "Allow public access to stories" ON stories
  USING (is_development() OR status = 'published');

DROP POLICY IF EXISTS "Allow public access to chapters" ON chapters;
CREATE POLICY "Allow public access to chapters" ON chapters
  USING (is_development() OR status = 'published');

DROP POLICY IF EXISTS "Allow public access to panels" ON panels;
CREATE POLICY "Allow public access to panels" ON panels
  USING (is_development());

DROP POLICY IF EXISTS "Allow public access to sentences" ON sentences;
CREATE POLICY "Allow public access to sentences" ON sentences
  USING (is_development());

DROP POLICY IF EXISTS "Allow public access to words" ON words;
CREATE POLICY "Allow public access to words" ON words
  USING (is_development());

-- Allow anonymous access to storage buckets
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Ensure the auth schema is properly set up
DO $$
BEGIN
  -- Make sure the auth.users table exists
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_tables
    WHERE schemaname = 'auth'
    AND tablename = 'users'
  ) THEN
    RAISE NOTICE 'auth.users table does not exist, cannot modify auth settings';
    RETURN;
  END IF;

  -- Check or add the 'role' column to auth.users
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'auth'
    AND table_name = 'users'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN role TEXT;
  END IF;

END
$$; 