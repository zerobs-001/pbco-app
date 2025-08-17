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

    console.log('🔄 API: Updating loan for property:', propertyId, loanData);

    // Check if loan already exists for this property
    const { data: existingLoan, error: fetchError } = await supabase
      .from('loans')
      .select('id')
      .eq('property_id', propertyId)
      .single();

    let loanResult;
    
    if (existingLoan) {
      // Update existing loan - try different column name formats
      console.log('Attempting to update existing loan with data:', loanData);
      
      const updateData = {
        type: loanData.type,
        principal_amount: loanData.principal_amount,
        term_years: loanData.term_years,
        start_date: loanData.start_date,
        updated_at: new Date().toISOString()
      };
      
      // Try with camelCase first
      const { data: data1, error: error1 } = await supabase
        .from('loans')
        .update({
          ...updateData,
          interestRate: loanData.interest_rate
        })
        .eq('property_id', propertyId)
        .select()
        .single();

      if (!error1) {
        loanResult = data1;
        console.log('✅ Loan updated with camelCase:', loanResult);
      } else {
        console.log('CamelCase failed, trying snake_case:', error1.message);
        
        // Try with snake_case
        const { data: data2, error: error2 } = await supabase
          .from('loans')
          .update({
            ...updateData,
            interest_rate: loanData.interest_rate
          })
          .eq('property_id', propertyId)
          .select()
          .single();
          
        if (!error2) {
          loanResult = data2;
          console.log('✅ Loan updated with snake_case:', loanResult);
        } else {
          console.error('Both formats failed for update:', error2);
          return NextResponse.json(
            { error: `Failed to update loan: ${error2.message}` },
            { status: 500 }
          );
        }
      }
    } else {
      // Create new loan - try different column name formats
      console.log('Attempting to create new loan with data:', loanData);
      
      const insertData = {
        property_id: propertyId,
        type: loanData.type,
        principal_amount: loanData.principal_amount,
        term_years: loanData.term_years,
        start_date: loanData.start_date
      };
      
      // Try with camelCase first
      const { data: data1, error: error1 } = await supabase
        .from('loans')
        .insert({
          ...insertData,
          interestRate: loanData.interest_rate
        })
        .select()
        .single();

      if (!error1) {
        loanResult = data1;
        console.log('✅ Loan created with camelCase:', loanResult);
      } else {
        console.log('CamelCase failed, trying snake_case:', error1.message);
        
        // Try with snake_case
        const { data: data2, error: error2 } = await supabase
          .from('loans')
          .insert({
            ...insertData,
            interest_rate: loanData.interest_rate
          })
          .select()
          .single();
          
        if (!error2) {
          loanResult = data2;
          console.log('✅ Loan created with snake_case:', loanResult);
        } else {
          console.error('Both formats failed for insert:', error2);
          return NextResponse.json(
            { error: `Failed to create loan: ${error2.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Fetch updated property with loan data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        *,
        loans (*)
      `)
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      console.error('Error fetching updated property:', propertyError);
      return NextResponse.json(
        { error: `Failed to fetch updated property: ${propertyError.message}` },
        { status: 500 }
      );
    }

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
