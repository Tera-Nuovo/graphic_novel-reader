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

async function checkTables() {
  try {
    console.log('Checking tables in the database...')
    
    // List all tables in the public schema
    const { data: publicTables, error: publicError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (publicError) {
      console.error('Error fetching public tables:', publicError)
    } else {
      console.log('Public tables:', publicTables.map(t => t.table_name))
    }
    
    // List all tables in the auth schema
    const { data: authTables, error: authError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'auth')
    
    if (authError) {
      console.error('Error fetching auth tables:', authError)
    } else {
      console.log('Auth tables:', authTables.map(t => t.table_name))
    }
    
    // Check if the auth.users table has a role column
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'auth')
      .eq('table_name', 'users')
    
    if (columnsError) {
      console.error('Error fetching columns:', columnsError)
    } else {
      console.log('Auth.users columns:', columns.map(c => c.column_name))
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkTables() 