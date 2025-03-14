-- Create a test user for local development
-- This uses the internal Supabase auth functions to create a user with email/password

SELECT auth.uid();

-- Use the built-in signup function to create a user
SELECT *
FROM auth.sign_up(
  'test@example.com', 
  'password123', 
  '{
    "name": "Test User",
    "role": "admin"
  }'::jsonb
);

-- If you need to also verify the email (skip email confirmation)
UPDATE auth.users
SET email_confirmed_at = now(),
    is_sso_user = false,
    confirmed_at = now()
WHERE email = 'test@example.com';

-- Set the user as admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"')
WHERE email = 'test@example.com'; 