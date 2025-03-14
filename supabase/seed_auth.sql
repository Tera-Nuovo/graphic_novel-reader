-- Seed data for the auth schema in local Supabase

-- First, check if the auth schema exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) THEN
    CREATE SCHEMA IF NOT EXISTS auth;
  END IF;
END
$$;

-- Set up a test user with a known password
-- Password: password123 
-- Hash for 'password123': $2a$10$7YXt9g4xUgfYW2m6I8BN6.tbR.eGGwWRlXfCoQaqlK9STc0Zq3jse
DO $$
BEGIN
  -- Delete existing test user if exists to avoid conflicts
  DELETE FROM auth.users WHERE email = 'test@example.com';
  
  -- Now insert the test user
  INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      recovery_token,
      instance_id,
      is_super_admin
  )
  VALUES (
      '00000000-0000-0000-0000-000000000000', -- Hardcoded ID for predictability
      'test@example.com',
      '$2a$10$7YXt9g4xUgfYW2m6I8BN6.tbR.eGGwWRlXfCoQaqlK9STc0Zq3jse', -- 'password123'
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Test User", "role":"admin"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '',
      '',
      '00000000-0000-0000-0000-000000000000',
      false
  );
  
  -- Handle any errors silently
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create test user: %', SQLERRM;
END
$$;

-- Insert user progress records for test user
DO $$
BEGIN
  -- First delete any existing progress records
  DELETE FROM user_progress 
  WHERE user_id = '00000000-0000-0000-0000-000000000000';
  
  -- Now insert the progress record
  INSERT INTO user_progress (id, user_id, story_id, chapter_id, panel_id, last_accessed, completed)
  VALUES 
    ('12345678-1234-1234-1234-123456789abc', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11aaaaaa-1111-1111-1111-111111111111', NOW(), false);
  
  -- Handle any errors silently
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create user progress: %', SQLERRM;
END
$$; 