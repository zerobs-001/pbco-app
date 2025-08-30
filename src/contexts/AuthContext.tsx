"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { portfolioService } from '@/lib/services/portfolioService';
import { userService } from '@/lib/services/userService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, userData?: { name?: string }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔥 Auth state change:', event, session?.user?.email);
        console.log('🔥 Full auth event details:', { event, hasSession: !!session, userId: session?.user?.id });
        
        setSession(session);
        setUser(session?.user ?? null);

        // Handle new user sign in - ensure they have user profile and portfolio
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔥 User signed in, ensuring user profile and portfolio exist for:', session.user.email);
          
          try {
            // First, ensure user profile exists in users table
            const userResult = await userService.ensureUserProfile(session.user);
            console.log('🔥 User profile creation result:', userResult);
            
            if (!userResult.success) {
              console.error('🔥 Failed to create user profile:', userResult.error);
              setError(`Failed to create user profile: ${userResult.error}`);
              setLoading(false);
              return;
            }

            // Then ensure user has a portfolio
            const portfolioResult = await portfolioService.ensureUserHasPortfolio(session.user.id);
            console.log('🔥 Portfolio creation result:', portfolioResult);
            
            if (!portfolioResult.success) {
              console.error('🔥 Failed to create portfolio:', portfolioResult.error);
              setError(`Failed to create portfolio: ${portfolioResult.error}`);
            } else {
              console.log('🔥 Portfolio ensured successfully:', portfolioResult.portfolio?.id);
            }
          } catch (err) {
            console.error('🔥 Error ensuring user profile and portfolio:', err);
            setError('Failed to set up your account. Please try signing in again.');
          }
        }
        
        setLoading(false);

        // Clear any existing errors on successful auth change (only if no new errors were set)
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && !error) {
          setError(null);
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setError(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signUp = useCallback(async (email: string, password: string, userData?: { name?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData?.name || '',
          },
        },
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during sign up';
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔥 AuthContext: Starting sign in for:', email);
      
      // Add a timeout to prevent hanging
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout - please try again')), 15000)
      );
      
      const result = await Promise.race([
        signInPromise,
        timeoutPromise
      ]).catch(err => {
        console.error('🔥 AuthContext: Sign in timeout or error:', err);
        if (err.message.includes('timeout')) {
          return { error: { message: 'Sign in is taking too long. Please check your connection and try again.' } };
        }
        return { error: { message: err.message || 'Sign in failed. Please try again.' } };
      }) as any;

      const { error } = result;

      if (error) {
        console.error('🔥 AuthContext: Sign in error:', error);
        setError(error.message);
        setLoading(false); // Ensure loading is cleared immediately on error
      } else {
        console.log('🔥 AuthContext: Sign in successful, waiting for auth state change...');
        // Don't set loading to false here - let the auth state change handler do it
      }

      return { error };
    } catch (err) {
      console.error('🔥 AuthContext: Unexpected sign in error:', err);
      const errorMessage = 'An unexpected error occurred during sign in';
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage } as AuthError };
    }
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during sign out';
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during password reset';
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}