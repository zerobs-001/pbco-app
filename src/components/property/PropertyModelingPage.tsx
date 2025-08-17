"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";

// Types
interface PropertyData {
  id: string;
  name: string;
  type: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  address: string;
  strategy: string;
}

interface ModelingAssumptions {
  rentGrowthRate: number;
  capitalGrowthRate: number;
  expenseInflationRate: number;
  taxRate: number;
  discountRate: number;
}

interface YearlyProjection {
  year: number;
  rentIncome: number;
  expenses: number;
  loanPayment: number;
  taxLiability: number;
  netCashflow: number;
  cumulativeCashflow: number;
  propertyValue: number;
  loanBalance: number;
}

interface StrategyComparison {
  strategy: string;
  breakEvenYear: number;
  netPresentValue: number;
  internalRateOfReturn: number;
  annualCashflow: number;
  keyAdvantages: string[];
  keyDisadvantages: string[];
}

// Constants
const DEFAULT_ASSUMPTIONS: ModelingAssumptions = {
  rentGrowthRate: 3.5,
  capitalGrowthRate: 4.0,
  expenseInflationRate: 2.5,
  taxRate: 30.0,
  discountRate: 8.0,
};

const PRESET_PROFILES = {
  conservative: { rentGrowthRate: 2.5, capitalGrowthRate: 3.0, expenseInflationRate: 2.0, taxRate: 30.0, discountRate: 7.0 },
  moderate: { rentGrowthRate: 3.5, capitalGrowthRate: 4.0, expenseInflationRate: 2.5, taxRate: 30.0, discountRate: 8.0 },
  aggressive: { rentGrowthRate: 4.5, capitalGrowthRate: 5.5, expenseInflationRate: 3.0, taxRate: 30.0, discountRate: 9.0 },
};

const STRATEGIES = [
  { id: "buy_hold", name: "Buy & Hold", description: "Long-term passive investment" },
  { id: "manufacture_equity", name: "Manufacture Equity", description: "Value-add improvements" },
  { id: "value_add_commercial", name: "Value-Add Commercial", description: "Commercial redevelopment" },
];

export default function PropertyModelingPage({ propertyId }: { propertyId: string }) {
  const [assumptions, setAssumptions] = useState<ModelingAssumptions>(DEFAULT_ASSUMPTIONS);
  const [selectedStrategy, setSelectedStrategy] = useState("buy_hold");
  const [isEditingProperty, setIsEditingProperty] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData>({
    id: propertyId,
    name: "Sydney House",
    type: "Residential House",
    purchasePrice: 850000,
    currentValue: 920000,
    purchaseDate: "2023-01-15",
    address: "123 Sydney Street, Sydney NSW 2000",
    strategy: "buy_hold",
  });

  // Mock loan data
  const loanData = {
    principalAmount: 680000,
    interestRate: 5.5,
    termYears: 30,
    type: "principal_interest",
  };

  // Calculate projections
  const projections = useMemo(() => {
    const data: YearlyProjection[] = [];
    let cumulativeCashflow = 0;
    let currentLoanBalance = loanData.principalAmount;
    let currentRent = 45000; // Annual rent
    let currentExpenses = 12000; // Annual expenses

    for (let year = 2024; year <= 2054; year++) {
      const yearIndex = year - 2024;
      
      // Calculate growing values
      const rentIncome = currentRent * Math.pow(1 + assumptions.rentGrowthRate / 100, yearIndex);
      const expenses = currentExpenses * Math.pow(1 + assumptions.expenseInflationRate / 100, yearIndex);
      const propertyValue = propertyData.currentValue * Math.pow(1 + assumptions.capitalGrowthRate / 100, yearIndex);
      
      // Calculate loan payment (simplified)
      const monthlyRate = loanData.interestRate / 100 / 12;
      const totalPayments = loanData.termYears * 12;
      const monthlyPayment = (loanData.principalAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                           (Math.pow(1 + monthlyRate, totalPayments) - 1);
      const annualLoanPayment = monthlyPayment * 12;
      
      // Update loan balance
      const annualInterest = currentLoanBalance * (loanData.interestRate / 100);
      const annualPrincipal = annualLoanPayment - annualInterest;
      currentLoanBalance = Math.max(0, currentLoanBalance - annualPrincipal);
      
      // Calculate tax liability (simplified)
      const taxableIncome = rentIncome - expenses - annualInterest;
      const taxLiability = Math.max(0, taxableIncome * (assumptions.taxRate / 100));
      
      // Calculate net cashflow
      const netCashflow = rentIncome - expenses - annualLoanPayment - taxLiability;
      cumulativeCashflow += netCashflow;
      
      data.push({
        year,
        rentIncome,
        expenses,
        loanPayment: annualLoanPayment,
        taxLiability,
        netCashflow,
        cumulativeCashflow,
        propertyValue,
        loanBalance: currentLoanBalance,
      });
    }
    
    return data;
  }, [assumptions, propertyData, loanData]);

  // Calculate key metrics
  const breakEvenYear = projections.find(p => p.cumulativeCashflow >= 0)?.year || 2054;
  const netPresentValue = useMemo(() => {
    return projections.reduce((npv, projection) => {
      const discountFactor = Math.pow(1 + assumptions.discountRate / 100, projection.year - 2024);
      return npv + projection.netCashflow / discountFactor;
    }, 0);
  }, [projections, assumptions.discountRate]);

  // Debug: Log chart data
  console.log('Chart Debug:', {
    projectionsLength: projections.length,
    first10Years: projections.slice(0, 10).map(p => ({ year: p.year, cashflow: p.netCashflow })),
    maxCashflow: Math.max(...projections.slice(0, 10).map(p => Math.abs(p.netCashflow))),
    breakEvenYear
  });

  // Strategy comparisons
  const strategyComparisons = useMemo((): StrategyComparison[] => {
    return STRATEGIES.map(strategy => {
      // Simplified comparison logic
      const strategyMultiplier = strategy.id === "buy_hold" ? 1 : strategy.id === "manufacture_equity" ? 1.2 : 1.4;
      const adjustedCashflow = projections[0]?.netCashflow * strategyMultiplier;
      const adjustedBreakEven = Math.max(2024, breakEvenYear - (strategyMultiplier - 1) * 2);
      
      return {
        strategy: strategy.name,
        breakEvenYear: adjustedBreakEven,
        netPresentValue: netPresentValue * strategyMultiplier,
        internalRateOfReturn: (assumptions.discountRate + (strategyMultiplier - 1) * 2),
        annualCashflow: adjustedCashflow,
        keyAdvantages: strategy.id === "buy_hold" ? ["Stable returns", "Lower risk"] : 
                      strategy.id === "manufacture_equity" ? ["Higher returns", "Value creation"] : 
                      ["Maximum returns", "Commercial potential"],
        keyDisadvantages: strategy.id === "buy_hold" ? ["Lower returns", "Limited upside"] : 
                         strategy.id === "manufacture_equity" ? ["Higher risk", "More work"] : 
                         ["Highest risk", "Complex execution"],
      };
    });
  }, [projections, breakEvenYear, netPresentValue, assumptions.discountRate]);

  const handleAssumptionChange = useCallback((key: keyof ModelingAssumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePresetChange = useCallback((preset: keyof typeof PRESET_PROFILES) => {
    setAssumptions(PRESET_PROFILES[preset]);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827]">
      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="text-xl font-bold text-[#111827]">Property Portfolio CF</div>
              <nav className="hidden md:flex items-center gap-6">
                <a href="/dashboard" className="text-[#6b7280] hover:text-[#111827]">Dashboard</a>
                <a href="#" className="text-[#111827] font-medium">Properties</a>
                <a href="#" className="text-[#6b7280] hover:text-[#111827]">Reports</a>
                <a href="#" className="text-[#6b7280] hover:text-[#111827]">Settings</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6]">
                <IconBell className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#2563eb] flex items-center justify-center">
                  <span className="text-sm font-medium text-white">JD</span>
                </div>
                <span className="hidden md:block text-sm font-medium text-[#111827]">John Doe</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {/* Breadcrumb and Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-[#6b7280] mb-2">
            <a href="/dashboard" className="hover:text-[#2563eb]">Dashboard</a>
            <span>/</span>
            <a href="#" className="hover:text-[#2563eb]">Properties</a>
            <span>/</span>
            <span className="text-[#111827]">{propertyData.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Property Modeling</h1>
              <p className="text-sm text-[#6b7280]">Advanced cashflow modeling and strategy analysis</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditingProperty(!isEditingProperty)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#111827] hover:shadow-sm"
              >
                <IconEdit className="h-4 w-4" />
                {isEditingProperty ? 'Save' : 'Edit Property'}
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">
                <IconDownload className="h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          {/* Left Sidebar - Controls */}
          <div className="xl:col-span-1 space-y-6">
            {/* Property Info */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Property Details</h2>
              {isEditingProperty ? (
                <PropertyEditForm property={propertyData} onSave={(data) => setPropertyData(data)} />
              ) : (
                <PropertyInfoDisplay property={propertyData} />
              )}
            </section>

            {/* Strategy Selector */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Investment Strategy</h2>
              <StrategySelector 
                selectedStrategy={selectedStrategy}
                onStrategyChange={setSelectedStrategy}
                strategies={STRATEGIES}
              />
            </section>

            {/* Assumptions */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Modeling Assumptions</h2>
                <button className="text-sm text-[#2563eb] hover:underline">Reset</button>
              </div>
              
              {/* Preset Profiles */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#111827] mb-2">Quick Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(PRESET_PROFILES).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handlePresetChange(key as keyof typeof PRESET_PROFILES)}
                      className="px-3 py-2 text-xs rounded-lg border border-[#e5e7eb] hover:bg-[#f9fafb] capitalize"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <AssumptionsForm 
                assumptions={assumptions}
                onAssumptionChange={handleAssumptionChange}
              />
            </section>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Key Metrics */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <MetricCard 
                label="Break-even Year" 
                value={breakEvenYear.toString()} 
                accent="blue"
                helper={`${breakEvenYear - 2024} years to positive cashflow`}
              />
              <MetricCard 
                label="Net Present Value" 
                value={`$${(netPresentValue / 1000).toFixed(0)}K`} 
                accent="green"
                helper={`${assumptions.discountRate}% discount rate`}
              />
              <MetricCard 
                label="Annual Cashflow" 
                value={`$${(projections[0]?.netCashflow / 1000).toFixed(1)}K`} 
                accent="orange"
                helper="Year 1 projection"
              />
              <MetricCard 
                label="Property Value" 
                value={`$${(propertyData.currentValue / 1000).toFixed(0)}K`} 
                accent="purple"
                helper="Current market value"
              />
            </section>

            {/* Cashflow Chart */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">30-Year Cashflow Projection</h2>
              <CashflowBarChart 
                projections={projections} 
                breakEvenYear={breakEvenYear}
                height={400}
              />
            </section>

            {/* Strategy Comparison */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Strategy Comparison</h2>
              <StrategyComparisonTable comparisons={strategyComparisons} />
            </section>

            {/* Year-by-Year Breakdown */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Detailed Projections</h2>
              <YearlyBreakdownTable projections={projections.slice(0, 10)} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function CashflowBarChart({ projections, breakEvenYear, height = 300 }: { projections: YearlyProjection[]; breakEvenYear: number; height?: number }) {
  const [isClient, setIsClient] = useState(false);

  // Only render chart on client to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state on server
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6b7280]">Annual Cashflow Projection (First 10 Years)</p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>Negative</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-[#6b7280]">Loading chart...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TEST: Use static data first to verify chart rendering works
  const testData = [
    { year: 2024, cashflow: -12000 },
    { year: 2025, cashflow: -10500 },
    { year: 2026, cashflow: -8500 },
    { year: 2027, cashflow: -6000 },
    { year: 2028, cashflow: -3000 },
    { year: 2029, cashflow: 2000 },
    { year: 2030, cashflow: 8500 },
    { year: 2031, cashflow: 12000 },
    { year: 2032, cashflow: 15800 },
    { year: 2033, cashflow: 19500 },
  ];

  const maxCashflow = Math.max(...testData.map(d => Math.abs(d.cashflow)));
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6b7280]">TEST: Static Cashflow Chart (First 10 Years)</p>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Positive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Negative</span>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <div className="flex items-end justify-between h-48 gap-2">
          {testData.map((data, index) => {
            const cashflow = data.cashflow;
            const isPositive = cashflow >= 0;
            const heightPercent = maxCashflow > 0 ? (Math.abs(cashflow) / maxCashflow) * 100 : 0;
            const barHeight = Math.max(heightPercent, 5); // Minimum 5% height
            
            return (
              <div key={data.year} className="flex flex-col items-center flex-1">
                {/* Bar */}
                <div 
                  className={`w-full rounded-t transition-all duration-200 ${
                    isPositive ? 'bg-blue-500' : 'bg-gray-400'
                  }`}
                  style={{ height: `${barHeight}%` }}
                ></div>
                
                {/* Year label */}
                <div className="text-xs text-[#6b7280] mt-2 text-center">
                  {data.year}
                </div>
                
                {/* Value label */}
                <div className="text-xs font-medium mt-1 text-center">
                  ${(cashflow / 1000).toFixed(1)}K
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Summary */}
      <div className="text-center text-sm text-[#6b7280]">
        TEST: Static data showing negative to positive cashflow transition
      </div>
      
      {/* Data summary */}
      <div className="text-xs text-[#6b7280] bg-[#f9fafb] p-3 rounded">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Test Chart Summary:</p>
            <p>• 10 test years</p>
            <p>• Max cashflow: ${(maxCashflow / 1000).toFixed(1)}K</p>
            <p>• Break-even: ~2029</p>
          </div>
          <div>
            <p className="font-medium">Sample Values:</p>
            <p>• Year 1: -$12.0K</p>
            <p>• Year 5: -$3.0K</p>
            <p>• Year 10: +$19.5K</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyInfoDisplay({ property }: { property: PropertyData }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#6b7280]">Property Name</label>
        <p className="text-sm font-medium text-[#111827]">{property.name}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6b7280]">Type</label>
        <p className="text-sm text-[#111827]">{property.type}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6b7280]">Address</label>
        <p className="text-sm text-[#111827]">{property.address}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6b7280]">Purchase Price</label>
          <p className="text-sm font-medium text-[#111827]">${(property.purchasePrice / 1000).toFixed(0)}K</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b7280]">Current Value</label>
          <p className="text-sm font-medium text-[#111827]">${(property.currentValue / 1000).toFixed(0)}K</p>
        </div>
      </div>
    </div>
  );
}

function PropertyEditForm({ property, onSave }: { property: PropertyData; onSave: (data: PropertyData) => void }) {
  const [formData, setFormData] = useState(property);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#6b7280] mb-1">Property Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6b7280] mb-1">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        >
          <option>Residential House</option>
          <option>Residential Unit</option>
          <option>Commercial Office</option>
          <option>Commercial Retail</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6b7280] mb-1">Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1">Purchase Price</label>
          <input
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1">Current Value</label>
          <input
            type="number"
            value={formData.currentValue}
            onChange={(e) => setFormData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full px-3 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8]"
      >
        Save Changes
      </button>
    </form>
  );
}

function StrategySelector({ selectedStrategy, onStrategyChange, strategies }: { 
  selectedStrategy: string; 
  onStrategyChange: (strategy: string) => void;
  strategies: Array<{ id: string; name: string; description: string }>;
}) {
  return (
    <div className="space-y-3">
      {strategies.map((strategy) => (
        <div
          key={strategy.id}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            selectedStrategy === strategy.id
              ? 'border-[#2563eb] bg-blue-50'
              : 'border-[#e5e7eb] hover:border-[#d1d5db]'
          }`}
          onClick={() => onStrategyChange(strategy.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#111827]">{strategy.name}</h3>
              <p className="text-xs text-[#6b7280]">{strategy.description}</p>
            </div>
            {selectedStrategy === strategy.id && (
              <div className="w-4 h-4 bg-[#2563eb] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AssumptionsForm({ assumptions, onAssumptionChange }: { 
  assumptions: ModelingAssumptions; 
  onAssumptionChange: (key: keyof ModelingAssumptions, value: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Rent Growth Rate (%)</label>
        <input
          type="number"
          value={assumptions.rentGrowthRate}
          onChange={(e) => onAssumptionChange('rentGrowthRate', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          step="0.1"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Capital Growth Rate (%)</label>
        <input
          type="number"
          value={assumptions.capitalGrowthRate}
          onChange={(e) => onAssumptionChange('capitalGrowthRate', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          step="0.1"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Expense Inflation Rate (%)</label>
        <input
          type="number"
          value={assumptions.expenseInflationRate}
          onChange={(e) => onAssumptionChange('expenseInflationRate', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          step="0.1"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Tax Rate (%)</label>
        <input
          type="number"
          value={assumptions.taxRate}
          onChange={(e) => onAssumptionChange('taxRate', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          step="0.1"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Discount Rate (%)</label>
        <input
          type="number"
          value={assumptions.discountRate}
          onChange={(e) => onAssumptionChange('discountRate', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          step="0.1"
        />
      </div>
    </div>
  );
}

function StrategyComparisonTable({ comparisons }: { comparisons: StrategyComparison[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Strategy</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Break-even</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">NPV</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">IRR</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Annual CF</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Pros/Cons</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {comparisons.map((comparison) => (
            <tr key={comparison.strategy} className="hover:bg-[#f9fafb]">
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-[#111827]">{comparison.strategy}</div>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-[#111827]">{comparison.breakEvenYear}</td>
              <td className="py-3 px-4 text-sm text-[#111827]">${(comparison.netPresentValue / 1000).toFixed(0)}K</td>
              <td className="py-3 px-4 text-sm text-[#111827]">{comparison.internalRateOfReturn.toFixed(1)}%</td>
              <td className="py-3 px-4 text-sm text-[#111827]">${(comparison.annualCashflow / 1000).toFixed(1)}K</td>
              <td className="py-3 px-4">
                <div className="text-xs">
                  <div className="text-green-600">✓ {comparison.keyAdvantages[0]}</div>
                  <div className="text-red-600">✗ {comparison.keyDisadvantages[0]}</div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function YearlyBreakdownTable({ projections }: { projections: YearlyProjection[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Year</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Rent Income</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Expenses</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Loan Payment</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Tax</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Net Cashflow</th>
            <th className="text-left py-3 px-4 font-medium text-[#111827]">Cumulative</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {projections.map((projection) => (
            <tr key={projection.year} className="hover:bg-[#f9fafb]">
              <td className="py-3 px-4 font-medium text-[#111827]">{projection.year}</td>
              <td className="py-3 px-4 text-sm text-[#111827]">${(projection.rentIncome / 1000).toFixed(1)}K</td>
              <td className="py-3 px-4 text-sm text-[#111827]">${(projection.expenses / 1000).toFixed(1)}K</td>
              <td className="py-3 px-4 text-sm text-[#111827]">${(projection.loanPayment / 1000).toFixed(1)}K</td>
              <td className="py-3 px-4 text-sm text-[#111827]">${(projection.taxLiability / 1000).toFixed(1)}K</td>
              <td className={`py-3 px-4 text-sm font-medium ${projection.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(projection.netCashflow / 1000).toFixed(1)}K
              </td>
              <td className={`py-3 px-4 text-sm font-medium ${projection.cumulativeCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(projection.cumulativeCashflow / 1000).toFixed(1)}K
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({ label, value, accent, helper }: { label: string; value: string; accent: string; helper: string }) {
  const accentColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
  };

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
      <p className="text-xs text-[#6b7280]">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${accentColors[accent as keyof typeof accentColors]}`}>{value}</p>
      <p className="text-xs text-[#6b7280] mt-1">{helper}</p>
    </div>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function IconEdit({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
