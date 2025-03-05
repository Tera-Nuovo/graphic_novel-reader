-- Add role column to auth.users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END
$$;

-- Function to set a user as admin
CREATE OR REPLACE FUNCTION public.set_user_as_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET role = 'admin'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  SELECT role INTO current_user_role FROM auth.users WHERE id = auth.uid();
  RETURN current_user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 