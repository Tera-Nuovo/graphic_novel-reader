import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// This endpoint allows admins to run SQL commands directly
// WARNING: This is potentially dangerous and should be properly secured
export async function POST(request: NextRequest) {
  try {
    // First verify that the user is authenticated and is an admin
    const cookieStore = cookies();
    const authClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session }, error: sessionError } = await authClient.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin (this should be properly implemented in your app)
    // Example implementation - you should use your own logic for admin checks
    const { data: userData, error: userError } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Now that we've verified the user is an admin, create a service role client
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Get the SQL statement from the request
    const body = await request.json();
    const { sql } = body;
    
    if (!sql) {
      return NextResponse.json(
        { error: 'SQL statement is required' },
        { status: 400 }
      );
    }
    
    // Execute the SQL statement
    const { data, error } = await serviceClient.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to execute SQL statement' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in run-sql endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 