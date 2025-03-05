import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Get all headers for debugging
    const headerEntries = Array.from(request.headers.entries());
    console.log('All request headers:', headerEntries);
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    console.log('Auth header:', authHeader);
    console.log('Cookie header:', cookieHeader);
    
    // Create a new cookie store for this request
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('Cookies from store:', allCookies.map(c => c.name));
    
    // Create a Supabase client using the authorization header if available
    let supabase;
    let authMethod = 'unknown';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      console.log('Using access token from Authorization header:', accessToken.substring(0, 15) + '...');
      authMethod = 'token';
      
      // Create a direct Supabase client with the access token
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );
      
      // Manually verify the token
      try {
        // Test the token by making a direct request to get the user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error verifying token:', userError);
          return NextResponse.json(
            { 
              error: 'Invalid token', 
              details: userError,
              auth_header: authHeader,
              token: accessToken.substring(0, 15) + '...'
            },
            { status: 401 }
          );
        }
        
        if (!userData.user) {
          console.error('No user found with token');
          return NextResponse.json(
            { 
              error: 'Invalid token - no user found', 
              token: accessToken.substring(0, 15) + '...'
            },
            { status: 401 }
          );
        }
        
        // Get the session info
        const { data: sessionData } = await supabase.auth.getSession();
        
        // Check if the user has the admin role in their metadata
        const isAdmin = userData.user.user_metadata?.role === 'admin';
        
        return NextResponse.json({
          isAdmin,
          user: {
            id: userData.user.id,
            email: userData.user.email,
            metadata: userData.user.user_metadata
          },
          session: sessionData.session ? {
            id: sessionData.session.access_token.substring(0, 10) + '...',
            expires_at: sessionData.session.expires_at
          } : null,
          auth_method: authMethod,
          token_used: accessToken.substring(0, 15) + '...'
        });
      } catch (error) {
        console.error('Error verifying token:', error);
        return NextResponse.json(
          { 
            error: 'Error verifying token', 
            details: error,
            token: accessToken.substring(0, 15) + '...'
          },
          { status: 500 }
        );
      }
    } else {
      console.log('No valid authorization header found');
      
      // Return a clear error message about the missing token
      return NextResponse.json(
        { 
          error: 'No valid authorization token provided', 
          auth_header: authHeader,
          all_headers: Object.fromEntries(headerEntries)
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error in check-admin route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
} 