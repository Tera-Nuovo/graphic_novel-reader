import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  console.log('Middleware running for path:', req.nextUrl.pathname)
  
  // Log all cookies for debugging
  const allCookies = req.cookies.getAll()
  console.log('Cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 10)}...`))
  
  // Get authorization header
  const authHeader = req.headers.get('authorization')
  console.log('Authorization header:', authHeader || 'Missing')
  
  const res = NextResponse.next()
  
  // Define protected routes
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/profile')
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin') && 
                      req.nextUrl.pathname !== '/admin-setup'
  
  // Allow access to admin-setup page
  if (req.nextUrl.pathname === '/admin-setup') {
    console.log('Allowing access to admin-setup page')
    return res
  }
  
  try {
    let supabase;
    let accessToken = null;
    
    // Check for token in authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
      console.log('Found token in Authorization header');
    }
    
    // If no token in header, check cookies
    if (!accessToken) {
      const tokenCookie = req.cookies.get('sb-access-token');
      if (tokenCookie) {
        accessToken = tokenCookie.value;
        console.log('Found token in cookies');
      }
    }
    
    // If we have a token, verify it
    if (accessToken) {
      console.log('Verifying token...');
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
      
      // Verify the token by getting user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Token verification failed:', userError);
        // Clear invalid token
        res.cookies.delete('sb-access-token');
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
      
      if (!userData?.user) {
        console.log('No valid user found for token');
        // Clear invalid token
        res.cookies.delete('sb-access-token');
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
      
      // For admin routes, verify admin status
      if (isAdminRoute) {
        console.log('Checking admin access for path:', req.nextUrl.pathname);
        
        const isAdmin = userData.user.user_metadata?.role === 'admin';
        console.log('User:', userData.user.email, 'Is admin:', isAdmin);
        
        if (!isAdmin) {
          console.log('User is not an admin, redirecting to home');
          return NextResponse.redirect(new URL('/', req.url));
        }
        
        // Update the token in cookies to keep it fresh
        res.cookies.set({
          name: 'sb-access-token',
          value: accessToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 // 1 hour
        });
        
        console.log('User is admin, allowing access');
      }
      
      // For protected routes, we've already verified the user above
      if (isProtectedRoute) {
        console.log('User is authenticated, allowing access to protected route');
      }
      
      return res;
    } else if (isProtectedRoute || isAdminRoute) {
      console.log('No token found, redirecting to login');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // Clear any invalid tokens on error
    res.cookies.delete('sb-access-token');
    return res;
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/admin-setup'],
} 