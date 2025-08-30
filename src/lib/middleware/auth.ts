import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'client' | 'admin';
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: string | null;
}

/**
 * Authenticates the current request and returns user information
 * @param request - The incoming Next.js request
 * @returns Promise<AuthResult> - User data or error
 */
export async function authenticateRequest(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    
    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { 
        user: null, 
        error: 'Authentication required' 
      };
    }

    // For now, we'll use a default role since we don't have a custom users table
    // In a production app, you might want to create user profiles separately
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email!,
      role: 'client' // Default role for all users
    };

    return { user: authenticatedUser, error: null };
  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      user: null, 
      error: 'Authentication failed' 
    };
  }
}

/**
 * Middleware wrapper that returns 401 if authentication fails
 * @param request - The incoming Next.js request
 * @returns Promise<AuthenticatedUser> - Authenticated user or throws 401
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const { user, error } = await authenticateRequest();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Checks if user has admin role
 * @param user - Authenticated user
 * @returns boolean - True if user is admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin';
}

/**
 * Validates that user owns the portfolio or is admin
 * @param user - Authenticated user
 * @param portfolioUserId - Portfolio owner's user ID
 * @returns boolean - True if user has access
 */
export function canAccessPortfolio(user: AuthenticatedUser, portfolioUserId: string): boolean {
  return isAdmin(user) || user.id === portfolioUserId;
}
