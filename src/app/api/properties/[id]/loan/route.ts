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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;
    const loanData = await request.json();

    console.log('🔄 API: Storing loan data in property JSONB:', propertyId, loanData);

    // WORKAROUND: Store loan data in property's JSONB data column instead of loans table
    // This bypasses the persistent Supabase schema cache issues with the loans table
    
    // First, get the current property data
    const { data: currentProperty, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (fetchError) {
      console.error('Error fetching property:', fetchError);
      throw fetchError;
    }

    // Merge loan data into the property's data JSONB column
    const currentData = currentProperty.data || {};
    const updatedData = {
      ...currentData,
      loan: {
        type: loanData.type,
        principal_amount: loanData.principal_amount,
        interest_rate: loanData.interest_rate,
        term_years: loanData.term_years,
        start_date: loanData.start_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    // Update the property with the loan data embedded
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update({ data: updatedData })
      .eq('id', propertyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating property with loan data:', updateError);
      throw updateError;
    }

    // Map the property data to match our service format
    const propertyData = updatedProperty.data || {};
    const mappedProperty = {
      id: updatedProperty.id,
      portfolio_id: updatedProperty.portfolio_id,
      name: propertyData.name,
      type: propertyData.type,
      address: propertyData.address,
      purchase_price: propertyData.purchase_price,
      current_value: propertyData.current_value,
      purchase_date: propertyData.purchase_date,
      strategy: propertyData.strategy,
      cashflow_status: propertyData.cashflow_status || 'not_modeled',
      created_at: updatedProperty.created_at,
      updated_at: updatedProperty.updated_at,
      // Financial data from JSONB
      annual_rent: propertyData.annual_rent,
      annual_expenses: propertyData.annual_expenses,
      description: propertyData.description,
      // Include the embedded loan data as if it came from the loans table
      loan: propertyData.loan ? {
        id: `embedded_${propertyId}`, // Fake ID for compatibility
        property_id: propertyId,
        type: propertyData.loan.type,
        principal_amount: propertyData.loan.principal_amount,
        interest_rate: propertyData.loan.interest_rate,
        term_years: propertyData.loan.term_years,
        start_date: propertyData.loan.start_date,
        created_at: propertyData.loan.created_at,
        updated_at: propertyData.loan.updated_at
      } : undefined
    };

    console.log('✅ Loan data stored in property JSONB successfully');
    return NextResponse.json({ property: mappedProperty });

  } catch (error: any) {
    console.error('❌ Error storing loan data:', error);
    return NextResponse.json(
      { error: 'Failed to store loan data', details: error.message },
      { status: 500 }
    );
  }
}