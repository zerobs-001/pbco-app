-- Quick test property creation
-- Run this in your Supabase SQL Editor

-- First, make sure you have a portfolio (create one if needed)
INSERT INTO portfolios (id, user_id, name, globals, start_year) 
VALUES (
  'e20784fd-d716-431a-a857-bfba1c661b6c',
  (SELECT id FROM auth.users LIMIT 1), -- Use first available user
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

-- Create a test property using the correct JSONB structure
INSERT INTO properties (id, portfolio_id, data) 
VALUES (
  '324aa781-b1ce-4734-893d-ca63dc2a85db',
  'e20784fd-d716-431a-a857-bfba1c661b6c',
  '{
    "name": "Test Property for Modeling",
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
) ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data;

-- Verify the property was created
SELECT id, portfolio_id, data->>'name' as name, data->>'address' as address 
FROM properties 
WHERE id = '324aa781-b1ce-4734-893d-ca63dc2a85db';