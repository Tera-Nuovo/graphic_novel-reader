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
      
      // Sign in with Supabase
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Get the latest user data and store the token
      if (data?.session) {
        console.log('Sign in successful, storing token');
        
        // Store token in cookie with proper attributes - using session cookie approach
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        
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