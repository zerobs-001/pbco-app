import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🔥 Cleanup: Starting cleanup for email:', email);
    
    const supabase = await createClient();
    
    // First, find and delete any orphaned user records
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (fetchError) {
      console.error('🔥 Cleanup: Error fetching users:', fetchError);
      return NextResponse.json({ error: `Failed to fetch users: ${fetchError.message}` }, { status: 500 });
    }
    
    console.log('🔥 Cleanup: Found users:', users?.length || 0);
    
    // For now, we'll delete all users with this email (since you recreated the auth user)
    const orphanedUsers = users || [];
    
    // Delete orphaned user records
    if (orphanedUsers.length > 0) {
      console.log('🔥 Cleanup: Deleting', orphanedUsers.length, 'orphaned users');
      
      for (const orphan of orphanedUsers) {
        // First delete any portfolios
        const { error: portfolioDeleteError } = await supabase
          .from('portfolios')
          .delete()
          .eq('user_id', orphan.id);
        
        if (portfolioDeleteError) {
          console.error('🔥 Cleanup: Error deleting portfolios:', portfolioDeleteError);
        }
        
        // Then delete the user
        const { error: userDeleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', orphan.id);
        
        if (userDeleteError) {
          console.error('🔥 Cleanup: Error deleting user:', userDeleteError);
        } else {
          console.log('🔥 Cleanup: Deleted orphaned user:', orphan.id);
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleanup complete. Deleted ${orphanedUsers.length} orphaned users.`,
      deletedUsers: orphanedUsers.map(u => ({ id: u.id, email: u.email }))
    });
    
  } catch (error) {
    console.error('🔥 Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup user data', details: error },
      { status: 500 }
    );
  }
}