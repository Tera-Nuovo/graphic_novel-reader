const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkAdminFunctions() {
  try {
    // Check if the role column exists in auth.users
    const { data: columnData, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'auth')
      .eq('table_name', 'users')
      .eq('column_name', 'role');
    
    console.log('Role column exists:', columnData && columnData.length > 0);
    
    if (columnError) {
      console.error('Error checking role column:', columnError);
    }
    
    // Try to directly create the admin functions
    const sql = `
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
      CREATE OR REPLACE FUNCTION set_user_as_admin(user_email TEXT)
      RETURNS VOID AS $$
      BEGIN
        UPDATE auth.users
        SET role = 'admin'
        WHERE email = user_email;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Function to check if current user is admin
      CREATE OR REPLACE FUNCTION is_admin()
      RETURNS BOOLEAN AS $$
      DECLARE
        current_user_role TEXT;
      BEGIN
        SELECT role INTO current_user_role FROM auth.users WHERE id = auth.uid();
        RETURN current_user_role = 'admin';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Execute the SQL directly using the REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (response.ok) {
      console.log('Successfully created admin functions');
    } else {
      console.error('Error creating admin functions:', await response.text());
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAdminFunctions(); 