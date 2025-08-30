import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, canAccessPortfolio } from '@/lib/middleware/auth';
import { validateAndSanitize, UpdatePropertyRequestSchema } from '@/lib/validation/property';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;

    // Create authenticated Supabase client
    const supabase = await createClient();

    // Fetch property using authenticated user (RLS will enforce access)
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
        // For development, create the property if it doesn't exist
        if (process.env.NODE_ENV === 'development') {
          console.log('Creating missing property for development:', propertyId);
          
          // First ensure portfolio exists
          const portfolioId = 'e20784fd-d716-431a-a857-bfba1c661b6c';
          const { data: portfolio } = await supabase
            .from('portfolios')
            .select('id')
            .eq('id', portfolioId)
            .single();
            
          if (!portfolio) {
            // Create portfolio first
            await supabase
              .from('portfolios')
              .insert({
                id: portfolioId,
                user_id: user.id,
                name: 'Development Portfolio',
                globals: {
                  startYear: 2024,
                  marginalTax: 0.37,
                  medicare: 0.02,
                  rentGrowth: 0.03,
                  expenseInflation: 0.025,
                  capitalGrowth: 0.04,
                  targetIncome: 100000
                },
                start_year: 2024
              });
          }
          
          // Create property
          const { data: newProperty, error: createError } = await supabase
            .from('properties')
            .insert({
              id: propertyId,
              portfolio_id: portfolioId,
              data: {
                name: 'Test Property',
                type: 'residential_house',
                address: '123 Test Street, Sydney NSW 2000',
                purchase_price: 800000,
                current_value: 850000,
                purchase_date: '2024-01-01',
                strategy: 'buy_hold',
                cashflow_status: 'not_modeled',
                annual_rent: 52000,
                annual_expenses: 15000,
                description: 'Test property for development'
              }
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating property:', createError);
            return NextResponse.json(
              { error: 'Property not found and could not create' },
              { status: 404 }
            );
          }
          
          console.log('Created property:', newProperty.id);
          
          // Return the created property
          const propertyData = newProperty.data || {};
          const mappedProperty = {
            id: newProperty.id,
            portfolio_id: newProperty.portfolio_id,
            name: propertyData.name,
            type: propertyData.type,
            address: propertyData.address,
            purchase_price: propertyData.purchase_price,
            current_value: propertyData.current_value,
            purchase_date: propertyData.purchase_date,
            strategy: propertyData.strategy,
            cashflow_status: propertyData.cashflow_status || 'not_modeled',
            status: propertyData.status || 'modelling',
            created_at: newProperty.created_at,
            updated_at: newProperty.updated_at,
            annual_rent: propertyData.annual_rent,
            annual_expenses: propertyData.annual_expenses,
            description: propertyData.description,
            loans: [],
            loan: undefined
          };

          return NextResponse.json({ property: mappedProperty });
        } else {
          return NextResponse.json(
            { error: 'Property not found' },
            { status: 404 }
          );
        }
      }
      return NextResponse.json(
        { error: `Failed to fetch property: ${error.message}` },
        { status: 500 }
      );
    }

    // Log success without sensitive data
    console.log('✅ Property found:', property?.id);

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
    const user = await requireAuth();
    
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;
    const updates = await request.json();

    // Validate input data
    const validation = validateAndSanitize(UpdatePropertyRequestSchema, updates);
    if (!validation.success) {
      return NextResponse.json(
        { error: `Validation failed: ${validation.error}` },
        { status: 400 }
      );
    }

    const validatedUpdates = validation.data;

    // Create authenticated Supabase client
    const supabase = await createClient();

    // First, get the current property to merge with updates and verify access
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

    // Verify portfolio ownership or admin access
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('user_id')
      .eq('id', currentProperty.portfolio_id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (!canAccessPortfolio(user, portfolio.user_id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Merge current data with validated updates
    const currentData = currentProperty.data || {};
    const updatedData = {
      ...currentData,
      ...validatedUpdates,
      updated_at: new Date().toISOString()
    };

    // Update property using authenticated user (RLS will enforce access)
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
    
    console.log('✅ Property updated successfully');

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
