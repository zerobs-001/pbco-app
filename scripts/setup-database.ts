import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  try {
    // Create a default portfolio for testing
    console.log('\n📦 Creating default portfolio...');
    
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .upsert({
        id: 'default-portfolio',
        user_id: '00000000-0000-0000-0000-000000000000', // Placeholder user ID
        name: 'Default Portfolio',
        globals: {
          rent_growth_rate: 3.0,
          capital_growth_rate: 5.0,
          expense_inflation_rate: 2.5,
          tax_rate: 32.5,
          discount_rate: 7.0
        },
        start_year: 2024
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (portfolioError) {
      console.error('❌ Error creating default portfolio:', portfolioError.message);
    } else {
      console.log('✅ Default portfolio ready');
    }

    // Test the properties table by trying to insert a test property
    console.log('\n🏠 Testing properties table...');
    
    const { data: testProperty, error: propertyError } = await supabase
      .from('properties')
      .insert({
        portfolio_id: 'default-portfolio',
        name: 'Test Property',
        type: 'residential_house',
        address: '123 Test Street',
        purchase_price: 500000,
        current_value: 550000,
        purchase_date: '2024-01-01',
        strategy: 'buy_hold',
        cashflow_status: 'not_modeled',
        financial_data: {
          annual_rent: 25000,
          annual_expenses: 8000,
          description: 'Test property for database setup'
        }
      })
      .select()
      .single();

    if (propertyError) {
      console.error('❌ Error testing properties table:', propertyError.message);
      console.log('💡 You may need to create the database tables manually in the Supabase dashboard');
      console.log('📋 Copy the SQL from database/schema.sql and run it in the SQL Editor');
    } else {
      console.log('✅ Properties table working correctly');
      
      // Clean up test property
      await supabase
        .from('properties')
        .delete()
        .eq('id', testProperty.id);
      console.log('🧹 Test property cleaned up');
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of database/schema.sql');
    console.log('4. Run the SQL to create all tables');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
