-- Create test data for development
-- Run this in your Supabase SQL Editor

-- First, let's temporarily disable RLS for development
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Note: We need to create the user in auth.users first, but we can't do that via SQL
-- So let's use an existing user ID or create the user through the Supabase dashboard
-- For now, let's check what users exist in auth.users
SELECT id, email FROM auth.users LIMIT 5;

-- Create a test portfolio
-- Replace 'YOUR_EXISTING_USER_ID' with an actual user ID from the query above
INSERT INTO portfolios (id, user_id, name, globals, start_year) 
VALUES (
  'e20784fd-d716-431a-a857-bfba1c661b6c',
  'YOUR_EXISTING_USER_ID', -- Replace this with an actual user ID
  'Test Portfolio',
  '{
    "startYear": 2024,
    "marginalTax": 0.37,
    "medicare": 0.02,
    "rentGrowth": 0.03,
    "expenseInflation": 0.025,
    "capitalGrowth": 0.04,
    "targetIncome": 100000
  }'::jsonb,
  2024
) ON CONFLICT (id) DO NOTHING;

-- Create a test property
INSERT INTO properties (id, portfolio_id, data) 
VALUES (
  '324aa781-b1ce-4734-893d-ca63dc2a85db',
  'e20784fd-d716-431a-a857-bfba1c661b6c',
  '{
    "name": "Test Property",
    "type": "residential_house",
    "address": "123 Test Street, Sydney NSW 2000",
    "purchase_price": 800000,
    "current_value": 850000,
    "purchase_date": "2024-01-01",
    "strategy": "buy_hold",
    "cashflow_status": "not_modeled",
    "annual_rent": 52000,
    "annual_expenses": 15000,
    "description": "Test property for development"
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS (optional - you can leave it disabled for development)
-- ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify the data was created
SELECT 'Portfolios:' as info, count(*) as count FROM portfolios
UNION ALL
SELECT 'Properties:' as info, count(*) as count FROM properties
UNION ALL
SELECT 'Users:' as info, count(*) as count FROM users;
