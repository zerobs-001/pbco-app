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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Missing required parameter: portfolioId' },
        { status: 400 }
      );
    }

    console.log('🔍 API: Fetching properties for portfolio:', portfolioId);

    // Fetch properties using service role (bypasses RLS)
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        *,
        loans (*)
      `)
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      return NextResponse.json(
        { error: `Failed to fetch properties: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Properties found:', properties.length);

    // Map the properties data to match our service format
    const mappedProperties = properties.map((property: any) => {
      const propertyData = property.data || {};
      return {
        id: property.id,
        portfolio_id: property.portfolio_id,
        name: propertyData.name,
        type: propertyData.type,
        address: propertyData.address,
        purchase_price: propertyData.purchase_price,
        current_value: propertyData.current_value,
        purchase_date: propertyData.purchase_date,
        strategy: propertyData.strategy,
        cashflow_status: propertyData.cashflow_status || 'not_modeled',
        created_at: property.created_at,
        updated_at: property.updated_at,
        // Financial data from JSONB
        annual_rent: propertyData.annual_rent,
        annual_expenses: propertyData.annual_expenses,
        description: propertyData.description,
        loan: property.loans?.[0] ? {
          id: property.loans[0].id,
          property_id: property.loans[0].property_id,
          type: property.loans[0].type,
          principal_amount: property.loans[0].principal_amount,
          interest_rate: property.loans[0].interest_rate,
          term_years: property.loans[0].term_years,
          start_date: property.loans[0].start_date,
          created_at: property.loans[0].created_at,
          updated_at: property.loans[0].updated_at
        } : propertyData.loan ? {
          id: `embedded_${property.id}`,
          property_id: property.id,
          type: propertyData.loan.type,
          principal_amount: propertyData.loan.principal_amount,
          interest_rate: propertyData.loan.interest_rate,
          term_years: propertyData.loan.term_years,
          start_date: propertyData.loan.start_date,
          created_at: propertyData.loan.created_at,
          updated_at: propertyData.loan.updated_at
        } : undefined
      };
    });

    return NextResponse.json({ properties: mappedProperties });
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
    const body = await request.json();
    const { portfolioId, propertyData, loanData } = body;

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

    // If loan data is provided, create the loan and embed it in the property data
    if (loanData) {
      console.log('Creating loan with property:', { propertyId: property.id, loanData });
      
      const newLoan = {
        id: `loan_${Date.now()}`, // Generate a simple ID for the loan
        ...loanData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store loan data in the property's JSONB data column with support for multiple loans
      const updatedPropertyData = {
        ...propertyData,
        loans: [newLoan], // Initialize with first loan in array
        loan: newLoan // Keep backward compatibility
      };

      // Update the property with the embedded loan data
      const { data: updatedProperty, error: updateError } = await supabase
        .from('properties')
        .update({ data: updatedPropertyData })
        .eq('id', property.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error adding loan to property:', updateError);
        // Don't fail the whole request - property was created successfully
        console.warn('Property created but loan creation failed');
      } else {
        // Use the updated property with loan data
        property.data = updatedPropertyData;
      }
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
