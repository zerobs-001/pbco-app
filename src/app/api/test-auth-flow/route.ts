import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { userService } from '@/lib/services/userService';
import { portfolioService } from '@/lib/services/portfolioService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🔥 Testing complete auth flow for:', email);
    
    const supabase = await createClient();
    
    // Check if auth user exists
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users.find(u => u.email === email);
    
    if (!authUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Auth user not found in Supabase Auth' 
      });
    }

    console.log('🔥 Found auth user:', authUser.id, authUser.email);
    
    // Test user profile creation
    const userResult = await userService.ensureUserProfile(authUser);
    console.log('🔥 User profile result:', userResult);
    
    if (!userResult.success) {
      return NextResponse.json({
        success: false,
        error: `User profile failed: ${userResult.error}`,
        authUser: { id: authUser.id, email: authUser.email }
      });
    }
    
    // Test portfolio creation
    const portfolioResult = await portfolioService.ensureUserHasPortfolio(authUser.id);
    console.log('🔥 Portfolio result:', portfolioResult);
    
    return NextResponse.json({
      success: true,
      message: 'Complete auth flow test successful',
      authUser: { id: authUser.id, email: authUser.email },
      userProfile: userResult,
      portfolio: portfolioResult
    });
    
  } catch (error) {
    console.error('🔥 Test auth flow error:', error);
    return NextResponse.json(
      { error: 'Failed to test auth flow', details: error },
      { status: 500 }
    );
  }
}