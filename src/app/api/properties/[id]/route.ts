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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;

    console.log('🔍 API: Fetching property with ID:', propertyId);

    // Fetch property using service role (bypasses RLS)
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        loans (*)
      `)
      .eq('id', propertyId)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch property: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Property found:', property);

    // Map the property data to match our service format
    const propertyData = property.data || {};
    const mappedProperty = {
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
      status: propertyData.status || 'modelling',
      created_at: property.created_at,
      updated_at: property.updated_at,
      // Financial data from JSONB
      annual_rent: propertyData.annual_rent,
      annual_expenses: propertyData.annual_expenses,
      description: propertyData.description,
      // Support for multiple loans (primary source: JSONB data)
      loans: propertyData.loans || [],
      // Backward compatibility - first loan
      loan: propertyData.loans?.[0] ? propertyData.loans[0] 
            : property.loans?.[0] ? {
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

    return NextResponse.json({ property: mappedProperty });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;
    const updates = await request.json();

    console.log('🔄 API: Updating property with ID:', propertyId);
    console.log('📝 Updates received:', updates);
    
    // Special handling for loans array
    if (updates.loans) {
      console.log('💰 Loans array in updates:', updates.loans);
      console.log('💰 Number of loans:', updates.loans.length);
    }

    // First, get the current property to merge with updates
    const { data: currentProperty, error: fetchError } = await supabase
      .from('properties')
      .select('data')
      .eq('id', propertyId)
      .single();

    if (fetchError) {
      console.error('Error fetching current property:', fetchError);
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch property: ${fetchError.message}` },
        { status: 500 }
      );
    }

    // Merge current data with updates
    const currentData = currentProperty.data || {};
    const updatedData = {
      ...currentData,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    console.log('📊 Current data:', currentData);
    console.log('🔄 Updated data to save:', updatedData);
    
    // Special logging for loans
    if (updatedData.loans) {
      console.log('💰 Final loans data to save:', updatedData.loans);
    }

    // Update property using service role (bypasses RLS)
    const { data: property, error } = await supabase
      .from('properties')
      .update({ data: updatedData })
      .eq('id', propertyId)
      .select(`
        *,
        loans (*)
      `)
      .single();

    if (error) {
      console.error('❌ Error updating property:', error);
      return NextResponse.json(
        { error: `Failed to update property: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('✅ Property updated successfully in database');
    console.log('📄 Updated property from DB:', property);
    
    if (property.data?.loans) {
      console.log('💰 Loans saved in DB:', property.data.loans);
    }

    console.log('✅ Property updated:', property);

    // Map the updated property data to match our service format
    const propertyData = property.data || {};
    const mappedProperty = {
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
      status: propertyData.status || 'modelling',
      created_at: property.created_at,
      updated_at: property.updated_at,
      // Financial data from JSONB
      annual_rent: propertyData.annual_rent,
      annual_expenses: propertyData.annual_expenses,
      description: propertyData.description,
      // Support for multiple loans (primary source: JSONB data)
      loans: propertyData.loans || [],
      // Backward compatibility - first loan
      loan: propertyData.loans?.[0] ? propertyData.loans[0] 
            : property.loans?.[0] ? {
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

    return NextResponse.json({ property: mappedProperty });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
