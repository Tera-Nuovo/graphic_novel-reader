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
    let refreshToken = null;
    
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
        console.log('Found access token in cookies');
      }
    }
    
    // Get refresh token from cookies
    const refreshTokenCookie = req.cookies.get('sb-refresh-token');
    if (refreshTokenCookie) {
      refreshToken = refreshTokenCookie.value;
      console.log('Found refresh token in cookies');
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
      let { data: userData, error: userError } = await supabase.auth.getUser();
      
      // If token verification failed but we have a refresh token, try to refresh the session
      if (userError && refreshToken) {
        console.log('Access token invalid, trying to refresh...');
        
        try {
          // Create a new client without the invalid token
          const refreshClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await refreshClient.auth.refreshSession({
            refresh_token: refreshToken
          });
          
          if (refreshError || !refreshData.session) {
            console.error('Token refresh failed:', refreshError);
            // Clear invalid tokens
            res.cookies.delete('sb-access-token');
            res.cookies.delete('sb-refresh-token');
            const redirectUrl = new URL('/login', req.url);
            redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
            return NextResponse.redirect(redirectUrl);
          }
          
          // We successfully refreshed the token
          console.log('Session refreshed successfully');
          
          // Update access and refresh tokens in cookies
          const maxAge = 60 * 60 * 24 * 30; // 30 days
          
          res.cookies.set({
            name: 'sb-access-token',
            value: refreshData.session.access_token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: maxAge
          });
          
          res.cookies.set({
            name: 'sb-refresh-token',
            value: refreshData.session.refresh_token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: maxAge
          });
          
          // Use the refreshed data for user verification
          accessToken = refreshData.session.access_token;
          
          // Update the user data with the refreshed token
          const { data: refreshedUserData, error: refreshedUserError } = await supabase.auth.getUser(accessToken);
          
          if (refreshedUserError || !refreshedUserData.user) {
            console.error('Failed to verify user with refreshed token:', refreshedUserError);
            // Clear invalid tokens
            res.cookies.delete('sb-access-token');
            res.cookies.delete('sb-refresh-token');
            const redirectUrl = new URL('/login', req.url);
            redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
            return NextResponse.redirect(redirectUrl);
          }
          
          // Use refreshed user data for the rest of the process
          userData = refreshedUserData;
        } catch (refreshException) {
          console.error('Error during token refresh:', refreshException);
          // Clear invalid tokens
          res.cookies.delete('sb-access-token');
          res.cookies.delete('sb-refresh-token');
          const redirectUrl = new URL('/login', req.url);
          redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
      } else if (userError) {
        // If there's no refresh token or another error
        console.error('Token verification failed:', userError);
        // Clear invalid token
        res.cookies.delete('sb-access-token');
        res.cookies.delete('sb-refresh-token');
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
      
      if (!userData?.user) {
        console.log('No valid user found for token');
        // Clear invalid token
        res.cookies.delete('sb-access-token');
        res.cookies.delete('sb-refresh-token');
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
          maxAge: 60 * 60 * 24 * 30 // 30 days
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
    res.cookies.delete('sb-refresh-token');
    return res;
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/admin-setup'],
} 