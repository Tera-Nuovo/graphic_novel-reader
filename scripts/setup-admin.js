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

async function setupAdmin() {
  try {
    // Get the email from command line arguments
    const email = process.argv[2];
    
    if (!email) {
      console.error('Error: Email is required')
      console.error('Usage: node scripts/setup-admin.js <email>')
      process.exit(1)
    }
    
    console.log(`Setting up admin role for user: ${email}`);
    
    // First, try to directly update the user using the Supabase API
    console.log('Attempting to update user directly using Supabase API...');
    
    // Get the user ID from the email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      process.exit(1);
    }
    
    // Find the user with the matching email
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.id} (${user.email})`);
    
    // Update the user's metadata to include admin role
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { user_metadata: { role: 'admin' } }
    );
    
    if (updateError) {
      console.error('Error updating user metadata:', updateError);
    } else {
      console.log('Successfully updated user metadata:', updateData);
    }
    
    console.log('Admin setup completed');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

setupAdmin(); 