"use client";

import React, { useState, useMemo } from "react";
import { InvestmentStrategy, ModelingAssumptions, YearlyProjection } from "@/types";

export default function PropertyModelingPage({ propertyId }: { propertyId: string }) {
  const [selectedStrategy, setSelectedStrategy] = useState<InvestmentStrategy>('buy_hold');
  const [assumptions, setAssumptions] = useState<ModelingAssumptions>({
    rent_growth_rate: 3.0,
    capital_growth_rate: 4.0,
    expense_inflation_rate: 2.5,
    tax_rate: 32.5,
    discount_rate: 7.0,
  });
  const [isModeling, setIsModeling] = useState(false);

  // Mock property data
  const property = {
    id: propertyId,
    name: "Sydney House",
    type: "residential_house" as const,
    value: 850000,
    purchase_price: 750000,
    current_rent: 45000, // Annual rent
    current_expenses: 12000, // Annual expenses
    loan_balance: 578000,
    loan_payment: 32000, // Annual loan payment
  };

  // Generate 30-year cashflow projections
  const projections = useMemo(() => {
    const yearlyData: YearlyProjection[] = [];
    let cumulativeCashflow = 0;
    
    for (let year = 2024; year <= 2054; year++) {
      const yearIndex = year - 2024;
      
      // Calculate growing values
      const rentIncome = property.current_rent * Math.pow(1 + assumptions.rent_growth_rate / 100, yearIndex);
      const expenses = property.current_expenses * Math.pow(1 + assumptions.expense_inflation_rate / 100, yearIndex);
      const loanPayment = property.loan_payment; // Assuming fixed loan payment for simplicity
      
      // Calculate tax (simplified)
      const taxableIncome = rentIncome - expenses - (loanPayment * 0.7); // Assume 70% of loan payment is interest
      const tax = Math.max(0, taxableIncome * (assumptions.tax_rate / 100));
      
      // Calculate net cashflow
      const netCashflow = rentIncome - expenses - loanPayment - tax;
      cumulativeCashflow += netCashflow;
      
      // Calculate property value growth
      const propertyValue = property.value * Math.pow(1 + assumptions.capital_growth_rate / 100, yearIndex);
      
      yearlyData.push({
        year,
        rent_income: rentIncome,
        expenses: expenses,
        loan_payment: loanPayment,
        tax_liability: tax,
        net_cashflow: netCashflow,
        cumulative_cashflow: cumulativeCashflow,
        property_value: propertyValue,
        loan_balance: property.loan_balance, // Simplified - not reducing over time
      });
    }
    
    return yearlyData;
  }, [property, assumptions]);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const breakEvenYear = projections.find(p => p.cumulative_cashflow >= 0)?.year || 2054;
    const annualCashflow = projections[29]?.net_cashflow || 0; // Year 30
    
    // Calculate NPV (simplified)
    let npv = 0;
    projections.forEach((p, index) => {
      npv += p.net_cashflow / Math.pow(1 + assumptions.discount_rate / 100, index + 1);
    });
    
    return {
      breakEvenYear,
      annualCashflow,
      netPresentValue: npv,
      internalRateOfReturn: 8.2, // Simplified calculation
      cashOnCashReturn: ((annualCashflow / (property.value - property.loan_balance)) * 100),
    };
  }, [projections, assumptions, property]);

  const handleRunProjection = () => {
    setIsModeling(true);
    // Simulate calculation time
    setTimeout(() => setIsModeling(false), 1000);
  };

  const handleAssumptionChange = (key: keyof ModelingAssumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827]">
      <AppHeader />
      <main className="mx-auto max-w-[1400px] px-6 pb-8 pt-6">
        <div className="flex flex-col gap-6">
          <PropertyHeader property={property} />
          <PropertySummary property={property} />
          <ModelingControls 
            selectedStrategy={selectedStrategy}
            onStrategyChange={setSelectedStrategy}
            assumptions={assumptions}
            onAssumptionsChange={handleAssumptionChange}
            onRunProjection={handleRunProjection}
            isLoading={isModeling}
          />
          <ResultsSection projections={projections} keyMetrics={keyMetrics} />
          <YearlyBreakdown projections={projections} />
          <ActionsSection />
        </div>
      </main>
    </div>
  );
}

function AppHeader() {
  return (
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
  );
}

function PropertyHeader({ property }: { property: any }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm text-[#6b7280] mb-1">
          <a href="/dashboard" className="hover:text-[#111827]">Dashboard</a>
          <span>→</span>
          <a href="#" className="hover:text-[#111827]">{property.name}</a>
          <span>→</span>
          <span className="text-[#111827]">Cashflow Modeling</span>
        </div>
        <h1 className="text-2xl font-bold text-[#111827]">{property.name} - Cashflow Modeling</h1>
      </div>
      <div className="flex gap-3">
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white hover:bg-[#047857]">
          <IconSave className="h-4 w-4" /> Save to Portfolio
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#111827] hover:shadow-sm">
          <IconDownload className="h-4 w-4" /> Export Report
        </button>
      </div>
    </div>
  );
}

function PropertySummary({ property }: { property: any }) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-[#6b7280]">Property Value</p>
        <p className="text-2xl font-bold text-[#111827] mt-1">${(property.value / 1000).toFixed(0)}K</p>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-[#6b7280]">Current Cashflow</p>
        <p className="text-2xl font-bold text-red-600 mt-1">-${((property.current_rent - property.current_expenses - property.loan_payment) / 1000).toFixed(1)}K/yr</p>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-[#6b7280]">Loan Balance</p>
        <p className="text-2xl font-bold text-[#111827] mt-1">${(property.loan_balance / 1000).toFixed(0)}K</p>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-[#6b7280]">Strategy Type</p>
        <p className="text-2xl font-bold text-[#111827] mt-1">Buy & Hold</p>
      </div>
    </section>
  );
}

function ModelingControls({ 
  selectedStrategy, 
  onStrategyChange, 
  assumptions, 
  onAssumptionsChange, 
  onRunProjection, 
  isLoading 
}: {
  selectedStrategy: InvestmentStrategy;
  onStrategyChange: (strategy: InvestmentStrategy) => void;
  assumptions: ModelingAssumptions;
  onAssumptionsChange: (key: keyof ModelingAssumptions, value: number) => void;
  onRunProjection: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Strategy & Assumptions</h3>
        <div className="flex flex-wrap gap-3">
          {(['buy_hold', 'manufacture_equity', 'value_add_commercial'] as const).map((strategy) => (
            <button
              key={strategy}
              onClick={() => onStrategyChange(strategy)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedStrategy === strategy
                  ? 'border-[#2563eb] bg-[#2563eb] text-white'
                  : 'border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#f9fafb]'
              }`}
            >
              {strategy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6b7280]">Rent Growth (%)</label>
          <input
            type="number"
            value={assumptions.rent_growth_rate}
            onChange={(e) => onAssumptionsChange('rent_growth_rate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            step="0.1"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6b7280]">Capital Growth (%)</label>
          <input
            type="number"
            value={assumptions.capital_growth_rate}
            onChange={(e) => onAssumptionsChange('capital_growth_rate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            step="0.1"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6b7280]">Expense Inflation (%)</label>
          <input
            type="number"
            value={assumptions.expense_inflation_rate}
            onChange={(e) => onAssumptionsChange('expense_inflation_rate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            step="0.1"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#6b7280]">Tax Rate (%)</label>
          <input
            type="number"
            value={assumptions.tax_rate}
            onChange={(e) => onAssumptionsChange('tax_rate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            step="0.1"
          />
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onRunProjection}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-6 py-3 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <IconSpinner className="h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <IconPlay className="h-4 w-4" />
              Run 30-Year Projection
            </>
          )}
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-6 py-3 text-sm font-medium text-[#111827] hover:shadow-sm">
          <IconRefresh className="h-4 w-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

function ResultsSection({ projections, keyMetrics }: { projections: YearlyProjection[], keyMetrics: any }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Cashflow Projection Chart</h3>
        <CashflowBarChart projections={projections} />
      </div>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Key Metrics & Insights</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#6b7280]">Break-even Year</p>
            <p className="text-2xl font-bold text-[#111827]">{keyMetrics.breakEvenYear}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#6b7280]">Net Present Value</p>
            <p className="text-2xl font-bold text-[#111827]">${(keyMetrics.netPresentValue / 1000).toFixed(0)}K</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#6b7280]">Internal Rate of Return</p>
            <p className="text-2xl font-bold text-[#111827]">{keyMetrics.internalRateOfReturn}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#6b7280]">Cash-on-Cash Return</p>
            <p className="text-2xl font-bold text-[#111827]">{keyMetrics.cashOnCashReturn.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CashflowBarChart({ projections }: { projections: YearlyProjection[] }) {
  const maxCashflow = Math.max(...projections.map(p => Math.abs(p.net_cashflow)));
  const breakEvenYear = projections.find(p => p.cumulative_cashflow >= 0)?.year;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6b7280]">Annual Cashflow Projection (30 Years)</p>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Positive Cashflow</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Negative Cashflow</span>
          </div>
        </div>
      </div>
      
      <div className="relative h-64 overflow-x-auto">
        <div className="flex items-end gap-1 h-full min-w-max px-4">
          {projections.map((projection, index) => {
            const height = (Math.abs(projection.net_cashflow) / maxCashflow) * 100;
            const isPositive = projection.net_cashflow >= 0;
            const isBreakEven = projection.year === breakEvenYear;
            
            return (
              <div key={projection.year} className="flex flex-col items-center group">
                <div className="relative">
                  <div
                    className={`w-4 rounded-t transition-all duration-200 ${
                      isPositive ? 'bg-blue-500' : 'bg-red-500'
                    } ${isBreakEven ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                    style={{ height: `${height}%` }}
                  ></div>
                  {isBreakEven && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-green-600">
                      BE
                    </div>
                  )}
                </div>
                <div className="text-xs text-[#6b7280] mt-2 transform -rotate-45 origin-left">
                  {projection.year}
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#111827] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Year {projection.year}: ${(projection.net_cashflow / 1000).toFixed(1)}K
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="text-center text-sm text-[#6b7280]">
        Break-even achieved in {breakEvenYear} • 30-year projection shows {projections.filter(p => p.net_cashflow > 0).length} positive years
      </div>
    </div>
  );
}

function YearlyBreakdown({ projections }: { projections: YearlyProjection[] }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-[#e5e7eb]">
        <h3 className="text-lg font-semibold">Year-by-Year Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Rent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Expenses</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Loan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Tax</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Net CF</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Cumulative</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {projections.slice(0, 10).map((projection) => (
              <tr key={projection.year} className="hover:bg-[#f9fafb]">
                <td className="px-6 py-4 text-sm font-medium text-[#111827]">{projection.year}</td>
                <td className="px-6 py-4 text-sm text-[#111827]">${(projection.rent_income / 1000).toFixed(0)}K</td>
                <td className="px-6 py-4 text-sm text-[#111827]">${(projection.expenses / 1000).toFixed(0)}K</td>
                <td className="px-6 py-4 text-sm text-[#111827]">${(projection.loan_payment / 1000).toFixed(0)}K</td>
                <td className="px-6 py-4 text-sm text-[#111827]">${(projection.tax_liability / 1000).toFixed(0)}K</td>
                <td className={`px-6 py-4 text-sm font-medium ${projection.net_cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(projection.net_cashflow / 1000).toFixed(1)}K
                </td>
                <td className={`px-6 py-4 text-sm font-medium ${projection.cumulative_cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(projection.cumulative_cashflow / 1000).toFixed(1)}K
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Strategy Comparison</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-lg">
            <span className="font-medium">Buy & Hold</span>
            <span className="text-sm text-[#6b7280]">Break-even: 2028</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-lg">
            <span className="font-medium">Manufacture Equity</span>
            <span className="text-sm text-[#6b7280]">Break-even: 2026</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-lg">
            <span className="font-medium">Value-Add Commercial</span>
            <span className="text-sm text-[#6b7280]">Break-even: 2025</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Actions & Next Steps</h3>
        <div className="space-y-3">
          <button className="flex w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-3 text-left hover:shadow-sm">
            <IconCheck className="h-5 w-5 text-[#059669]" />
            <div>
              <div className="font-medium text-[#111827]">Save to Portfolio</div>
              <div className="text-sm text-[#6b7280]">Store modeling results</div>
            </div>
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-3 text-left hover:shadow-sm">
            <IconCompare className="h-5 w-5 text-[#7c3aed]" />
            <div>
              <div className="font-medium text-[#111827]">Compare Strategies</div>
              <div className="text-sm text-[#6b7280]">Side-by-side analysis</div>
            </div>
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-3 text-left hover:shadow-sm">
            <IconFileText className="h-5 w-5 text-[#d97706]" />
            <div>
              <div className="font-medium text-[#111827]">View Detailed Report</div>
              <div className="text-sm text-[#6b7280]">Export comprehensive analysis</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Icon components
function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function IconSave({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
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

function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconCompare({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
