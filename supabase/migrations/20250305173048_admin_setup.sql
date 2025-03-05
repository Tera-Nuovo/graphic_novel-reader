-- Add role column to auth.users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'auth'
        AND table_name = 'users'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN role TEXT;
    END IF;
END
$$;

-- Create a secure view for checking admin status
CREATE OR REPLACE VIEW admin_users AS
SELECT id, email, role
FROM auth.users
WHERE role = 'admin';

GRANT SELECT ON admin_users TO authenticated;

-- Function to set a user as admin
CREATE OR REPLACE FUNCTION set_user_as_admin(user_email TEXT)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update both the role column and user_metadata
    UPDATE auth.users
    SET 
        role = 'admin',
        raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
                ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
            END
    WHERE email = user_email;
END;
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM auth.users
        WHERE id = auth.uid()
        AND (
            role = 'admin' 
            OR raw_user_meta_data->>'role' = 'admin'
        )
    );
END;
$$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public stories are viewable by everyone" ON stories;
DROP POLICY IF EXISTS "Admins can manage all stories" ON stories;
DROP POLICY IF EXISTS "Admins can manage all chapters" ON chapters;
DROP POLICY IF EXISTS "Public chapters are viewable by everyone" ON chapters;
DROP POLICY IF EXISTS "Admins can manage all panels" ON panels;
DROP POLICY IF EXISTS "Authenticated users can view all panels" ON panels;
DROP POLICY IF EXISTS "Admins can manage all sentences" ON sentences;
DROP POLICY IF EXISTS "Authenticated users can view all sentences" ON sentences;
DROP POLICY IF EXISTS "Admins can manage all words" ON words;
DROP POLICY IF EXISTS "Authenticated users can view all words" ON words;

-- Create new policies for stories table
CREATE POLICY "Public stories are viewable by everyone" 
ON stories FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admins can manage all stories" 
ON stories FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create policies for admin users to manage other tables
CREATE POLICY "Admins can manage all chapters" 
ON chapters FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can manage all panels" 
ON panels FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can manage all sentences" 
ON sentences FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can manage all words" 
ON words FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin()); 