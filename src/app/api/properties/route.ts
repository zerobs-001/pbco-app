import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId, propertyData } = body;

    if (!portfolioId || !propertyData) {
      return NextResponse.json(
        { error: 'Missing required fields: portfolioId and propertyData' },
        { status: 400 }
      );
    }

    // Create property using service role (bypasses RLS)
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        portfolio_id: portfolioId,
        data: propertyData
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return NextResponse.json(
        { error: `Failed to create property: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
