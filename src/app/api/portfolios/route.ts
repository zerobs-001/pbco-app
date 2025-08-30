import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Create authenticated Supabase client
    const supabase = await createClient();

    // Fetch portfolios for the authenticated user (RLS will enforce access)
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching portfolios:', error);
      return NextResponse.json(
        { error: `Failed to fetch portfolios: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Portfolios found:', portfolios?.length || 0);

    return NextResponse.json({ portfolios: portfolios || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable authentication for production
    // const user = await requireAuth();
    const user = { id: '00000000-0000-0000-0000-000000000000', email: 'dev@example.com', role: 'admin' as const };

    const body = await request.json();
    const { name, globals, start_year } = body;

    // Create authenticated Supabase client
    const supabase = await createClient();

    // Create portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        name: name || 'Test Portfolio',
        globals: globals || {
          startYear: 2024,
          marginalTax: 0.37,
          medicare: 0.02,
          rentGrowth: 0.03,
          expenseInflation: 0.025,
          capitalGrowth: 0.04,
          targetIncome: 100000
        },
        start_year: start_year || 2024
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating portfolio:', error);
      return NextResponse.json(
        { error: `Failed to create portfolio: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Portfolio created:', portfolio.id);

    return NextResponse.json({ portfolio }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
