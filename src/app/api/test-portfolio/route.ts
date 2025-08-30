import { NextRequest, NextResponse } from 'next/server';
import { portfolioService } from '@/lib/services/portfolioService';
import { userService } from '@/lib/services/userService';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log('🔥 Testing user and portfolio creation for userId:', userId);
    
    // First create/test user profile if email provided
    if (email) {
      const userResult = await userService.createUserProfile({
        id: userId,
        email: email,
        user_metadata: { name: email.split('@')[0] }
      } as any);
      console.log('🔥 User creation test result:', userResult);
      
      if (!userResult.success) {
        return NextResponse.json(userResult);
      }
    }
    
    // Test portfolio creation
    const result = await portfolioService.createDefaultPortfolio(userId);
    console.log('🔥 Portfolio creation test result:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('🔥 Test creation error:', error);
    return NextResponse.json(
      { error: 'Failed to test creation', details: error },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log('🔥 Testing portfolio fetch for userId:', userId);
    
    // Test portfolio fetch
    const result = await portfolioService.getUserPrimaryPortfolio(userId);
    console.log('🔥 Portfolio fetch test result:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('🔥 Test portfolio fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to test portfolio fetch', details: error },
      { status: 500 }
    );
  }
}