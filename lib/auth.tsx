'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  goToAdmin: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Function to check if user is admin based on metadata
  const checkAdminStatus = (user: User | null) => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    
    console.log('Checking admin status for user:', user.id);
    console.log('User metadata:', JSON.stringify(user.user_metadata));
    
    // Check if the user has the admin role in their metadata
    const isUserAdmin = user.user_metadata?.role === 'admin';
    console.log('Is admin based on metadata:', isUserAdmin);
    
    setIsAdmin(isUserAdmin);
  };
  
  // Function to refresh the user data
  const refreshUser = async () => {
    try {
      console.log('Refreshing user data...');
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error refreshing user:', error);
        return;
      }
      
      if (data.user) {
        console.log('User refreshed:', data.user.email);
        setUser(data.user);
        checkAdminStatus(data.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };
  
  // Function to navigate to the admin dashboard
  const goToAdmin = async () => {
    if (isAdmin) {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.access_token) {
          // Update both storage locations
          document.cookie = `sb-access-token=${currentSession.access_token}; path=/; max-age=3600; SameSite=Lax`;
          localStorage.setItem('sb-access-token', currentSession.access_token);
          
          router.push('/admin');
        } else {
          console.error('No access token available');
        }
      } catch (error) {
        console.error('Error getting session:', error);
      }
    } else {
      console.error('User is not an admin');
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Authenticated' : 'Not authenticated');
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if user is admin
      checkAdminStatus(session?.user ?? null);
      
      // Refresh user data to get the latest metadata
      if (session?.user) {
        refreshUser();
      }
      
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        
        if (session?.user) {
          console.log('User authenticated, getting latest user data');
          // Get the latest user data to ensure we have the most up-to-date metadata
          const { data } = await supabase.auth.getUser();
          const currentUser = data?.user ?? session.user;
          setUser(currentUser);
          checkAdminStatus(currentUser);
        } else {
          console.log('User not authenticated');
          setUser(null);
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Clear any existing tokens first - using a more thorough approach
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.includes('sb-')) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`;
        }
      });
      
      // Clear any Supabase-specific items from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Wait a moment for cookies to be cleared
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Sign in with Supabase - use a more reliable option
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) throw error;
      
      // Get the latest user data and store the token
      if (data?.session) {
        console.log('Sign in successful, storing token');
        
        // Store token in cookie with proper attributes
        const maxAge = 60 * 60 * 24 * 30; // 30 days
        
        // Set the access token with proper cookie attributes
        // Note: httpOnly MUST be false to allow JavaScript access
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
        
        // Also store the refresh token in a separate cookie
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
        
        // Refresh user data to ensure we have the latest metadata
        await refreshUser();
        
        // Force a router refresh to update the UI
        router.refresh();
      } else {
        throw new Error('No session data received after sign in');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to refresh the auth token
  const refreshAuthToken = async () => {
    try {
      console.log('Refreshing auth token...');
      
      // Get the refresh token from cookies
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('sb-refresh-token='))
        ?.split('=')[1];
      
      if (!refreshToken) {
        console.warn('No refresh token found in cookies');
        return;
      }
      
      // Refresh the session using the refresh token
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });
      
      if (error) {
        console.error('Error refreshing token:', error);
        return;
      }
      
      if (data?.session) {
        console.log('Token refreshed successfully');
        
        // Update the tokens in cookies
        const maxAge = 60 * 60 * 24 * 30; // 30 days
        
        // Set the new access token - must match middleware settings
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
        
        // Set the new refresh token - must match middleware settings
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
        
        // Update our local state
        setSession(data.session);
        setUser(data.session.user);
        
        // Check admin status
        checkAdminStatus(data.session.user);
      }
    } catch (refreshError) {
      console.error('Error during token refresh:', refreshError);
    }
  };

  // Set up a periodic token refresh
  useEffect(() => {
    if (!session) return;
    
    // Set up an interval to refresh the token every 50 minutes
    // (Supabase tokens typically expire after 1 hour)
    const refreshInterval = setInterval(refreshAuthToken, 50 * 60 * 1000);
    
    // Also refresh immediately if we have a session
    refreshAuthToken();
    
    return () => clearInterval(refreshInterval);
  }, [session]);

  // Add event listener for visibility changes to refresh token when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session) {
        refreshAuthToken();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // First, clear all tokens and cookies - using a more thorough approach
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.includes('sb-')) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`;
        }
      });
      
      // Explicitly clear our custom token cookies
      document.cookie = `sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`;
      document.cookie = `sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`;
      
      // Clear any Supabase-specific items from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear user and admin status
      setUser(null);
      setIsAdmin(false);
      setSession(null);
      
      // Force a router refresh to update the UI
      router.refresh();
      
      // Navigate to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    refreshUser,
    goToAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 