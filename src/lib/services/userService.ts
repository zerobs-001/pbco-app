import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export class UserService {
  private supabase = createClient();

  /**
   * Create a user profile record in the users table
   */
  async createUserProfile(authUser: User): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      console.log('🔥 Creating user profile for:', authUser.email, 'ID:', authUser.id);
      
      // First check if a user with this email already exists (from old deleted auth user)
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email!)
        .single();
      
      if (existingUser && existingUser.id !== authUser.id) {
        console.log('🔥 Found old user profile with different ID, updating to new ID');
        // Update the existing user record with the new auth user ID
        const { data: updatedUser, error: updateError } = await this.supabase
          .from('users')
          .update({ 
            id: authUser.id,
            updated_at: new Date().toISOString()
          })
          .eq('email', authUser.email!)
          .select()
          .single();
        
        if (updateError) {
          console.error('🔥 Error updating user ID:', updateError);
          // If update fails due to ID conflict, delete the old record and create new
          if (updateError.code === '23505') {
            console.log('🔥 ID conflict, deleting old user record');
            await this.supabase
              .from('users')
              .delete()
              .eq('email', authUser.email!);
            
            // Now try to create fresh
            return this.createFreshUserProfile(authUser);
          }
          return { 
            success: false, 
            error: `Failed to update user profile: ${updateError.message}` 
          };
        }
        
        console.log('🔥 User profile updated successfully:', updatedUser.id);
        return { 
          success: true, 
          user: updatedUser 
        };
      }
      
      // No existing user, create new one
      return this.createFreshUserProfile(authUser);

    } catch (err) {
      console.error('🔥 Unexpected error creating user profile:', err);
      return { 
        success: false, 
        error: 'An unexpected error occurred while creating user profile' 
      };
    }
  }

  /**
   * Create a fresh user profile (helper method)
   */
  private async createFreshUserProfile(authUser: User): Promise<{ success: boolean; user?: any; error?: string }> {
    console.log('🔥 Creating fresh user profile for:', authUser.email);
    
    const { data: user, error } = await this.supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
        role: 'client'
      })
      .select()
      .single();

    if (error) {
      // Check if user already exists with this ID
      if (error.code === '23505') {
        console.log('🔥 User profile already exists with this ID, fetching existing user');
        return await this.getUserProfile(authUser.id);
      }
      
      console.error('🔥 Error creating user profile:', error);
      return { 
        success: false, 
        error: `Failed to create user profile: ${error.message}` 
      };
    }

    console.log('🔥 User profile created successfully:', user.id);
    return { 
      success: true, 
      user 
    };
  }

  /**
   * Get user profile from users table
   */
  async getUserProfile(userId: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { 
            success: false, 
            error: 'User profile not found' 
          };
        }
        
        console.error('Error fetching user profile:', error);
        return { 
          success: false, 
          error: `Failed to fetch user profile: ${error.message}` 
        };
      }

      return { 
        success: true, 
        user 
      };

    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
      return { 
        success: false, 
        error: 'An unexpected error occurred while fetching user profile' 
      };
    }
  }

  /**
   * Ensure user profile exists in users table, create if needed
   */
  async ensureUserProfile(authUser: User): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      console.log('🔥 Ensuring user profile exists for:', authUser.email);
      
      // First, check if user profile already exists
      const profileResult = await this.getUserProfile(authUser.id);
      
      if (profileResult.success && profileResult.user) {
        console.log('🔥 User profile already exists');
        return profileResult;
      }

      // User profile doesn't exist, create it
      console.log('🔥 User profile not found, creating new profile');
      return await this.createUserProfile(authUser);

    } catch (err) {
      console.error('🔥 Unexpected error ensuring user profile:', err);
      return { 
        success: false, 
        error: 'An unexpected error occurred while ensuring user profile exists' 
      };
    }
  }
}

// Export a singleton instance
export const userService = new UserService();