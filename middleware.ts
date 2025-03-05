import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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
  
  // Allow access to check-admin page
  if (req.nextUrl.pathname === '/check-admin') {
    console.log('Allowing access to check-admin page')
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
    
    // If we have a token, use it
    if (accessToken) {
      console.log('Using token-based authentication');
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
      
      // For admin routes, verify the user and admin status
      if (isAdminRoute) {
        console.log('Checking admin access for path:', req.nextUrl.pathname)
        
        // Get the user directly
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        if (userError || !userData?.user) {
          console.log('No valid user found, redirecting to login')
          const redirectUrl = new URL('/login', req.url)
          redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }
        
        // Check if user is admin
        const isAdmin = userData.user.user_metadata?.role === 'admin'
        console.log('User:', userData.user.email, 'Is admin:', isAdmin)
        
        if (!isAdmin) {
          console.log('User is not an admin, redirecting to home')
          return NextResponse.redirect(new URL('/', req.url))
        }
        
        // Set the token in a cookie for future requests
        res.cookies.set({
          name: 'sb-access-token',
          value: accessToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 // 1 hour
        })
        
        console.log('User is admin, allowing access')
        return res
      }
      
      // For other protected routes
      if (isProtectedRoute) {
        // Get the user directly
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Error getting user:', userError)
        }
        
        const isAuthenticated = !!userData?.user
        console.log('Is authenticated:', isAuthenticated)
        
        if (!isAuthenticated) {
          console.log('Redirecting to login: Not authenticated')
          const redirectUrl = new URL('/login', req.url)
          redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }
      }
    } else if (isProtectedRoute || isAdminRoute) {
      console.log('No token found, redirecting to login')
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/admin-setup', '/check-admin'],
} 