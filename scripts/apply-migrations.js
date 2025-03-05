const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
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

// Get all migration files
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort() // Sort to ensure migrations are applied in order

// Apply migrations
async function applyMigrations() {
  console.log('Starting migration process...')
  
  for (const file of migrationFiles) {
    console.log(`Applying migration: ${file}`)
    
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error)
        // Continue with other migrations
      } else {
        console.log(`Successfully applied migration: ${file}`)
      }
    } catch (error) {
      console.error(`Error reading or applying migration ${file}:`, error)
    }
  }
  
  console.log('Migration process completed')
}

// Create the exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  console.log('Creating exec_sql function...')
  
  try {
    // Create the function directly using raw SQL query
    const { error } = await supabase.from('_rpc').select('*').limit(1);
    
    // If we can connect, try to create the function
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Use REST API to execute raw SQL
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql: createFunctionQuery })
    });
    
    if (!response.ok) {
      // If the function doesn't exist yet, create it using a direct connection
      console.log('Creating exec_sql function using direct SQL...');
      
      // Use the REST API to execute raw SQL
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({
          query: createFunctionQuery
        })
      });
      
      if (!createResponse.ok) {
        console.error('Error creating exec_sql function:', await createResponse.text());
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error checking or creating exec_sql function:', error);
    process.exit(1);
  }
  
  console.log('exec_sql function created or verified successfully');
}

// Run the migration process
async function run() {
  try {
    await createExecSqlFunction()
    await applyMigrations()
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

run() 