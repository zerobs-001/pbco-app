// Quick test script to create a property via API
// Run with: node create_test_property.js

const testProperty = {
  portfolioId: "1a0a0a13-1b61-42c2-a842-4b7a4f107896", // Use your existing portfolio ID
  propertyData: {
    name: "Test Property for Modeling",
    type: "residential_house",
    address: "123 Test Street, Sydney NSW",
    purchase_price: 800000,
    current_value: 850000,
    purchase_date: "2024-01-01",
    strategy: "buy_hold",
    annual_rent: 52000,
    annual_expenses: 15000,
    description: "Test property for development"
  },
  loanData: {
    principal_amount: 640000,
    interest_rate: 6.5,
    term_years: 30,
    type: "principal_interest"
  }
};

fetch('http://localhost:3000/api/properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testProperty)
})
.then(response => response.json())
.then(data => {
  if (data.property) {
    console.log('Property created successfully!');
    console.log(`Test URL: http://localhost:3000/property/${data.property.id}/model`);
  } else {
    console.log('Error creating property:', data);
  }
})
.catch(error => console.error('Error:', error));