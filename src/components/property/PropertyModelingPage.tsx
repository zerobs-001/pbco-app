"use client";

import React, { useState, useMemo } from "react";

export default function PropertyModelingPage({ propertyId }: { propertyId: string }) {
  const [assumptions, setAssumptions] = useState({
    rentGrowth: 3.5,
    capitalGrowth: 4.0,
    expenseInflation: 2.5,
    taxRate: 30.0,
  });

  // Mock property data
  const property = {
    name: "Sydney House",
    value: 850000,
    loanBalance: 578000,
    currentRent: 45000,
    currentExpenses: 12000,
    loanPayment: 32000,
  };

  // Generate 30-year projections
  const projections = useMemo(() => {
    const data = [];
    let cumulative = 0;
    
    for (let year = 2024; year <= 2054; year++) {
      const yearIndex = year - 2024;
      const rentIncome = property.currentRent * Math.pow(1 + assumptions.rentGrowth / 100, yearIndex);
      const expenses = property.currentExpenses * Math.pow(1 + assumptions.expenseInflation / 100, yearIndex);
      const netCashflow = rentIncome - expenses - property.loanPayment;
      cumulative += netCashflow;
      
      data.push({
        year,
        rentIncome,
        expenses,
        netCashflow,
        cumulative,
      });
    }
    
    return data;
  }, [property, assumptions]);

  const breakEvenYear = projections.find(p => p.cumulative >= 0)?.year || 2054;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827]">
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
        <div className="mb-5">
          <div className="flex items-center gap-2 text-sm text-[#6b7280] mb-1">
            <a href="/dashboard" className="hover:text-[#2563eb]">Dashboard</a>
            <span>/</span>
            <a href="#" className="hover:text-[#2563eb]">Properties</a>
            <span>/</span>
            <span className="text-[#111827]">{property.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Property Modeling</h1>
          <p className="text-sm text-[#6b7280]">Adjust assumptions and model 30-year projections</p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Left: Controls */}
          <section className="xl:col-span-1 space-y-5 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Assumptions</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Rent Growth (%)</label>
                <input
                  type="number"
                  value={assumptions.rentGrowth}
                  onChange={(e) => setAssumptions(prev => ({ ...prev, rentGrowth: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Capital Growth (%)</label>
                <input
                  type="number"
                  value={assumptions.capitalGrowth}
                  onChange={(e) => setAssumptions(prev => ({ ...prev, capitalGrowth: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Expense Inflation (%)</label>
                <input
                  type="number"
                  value={assumptions.expenseInflation}
                  onChange={(e) => setAssumptions(prev => ({ ...prev, expenseInflation: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  value={assumptions.taxRate}
                  onChange={(e) => setAssumptions(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  step="0.1"
                />
              </div>
            </div>
          </section>

          {/* Right: Results */}
          <section className="xl:col-span-2 space-y-5">
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Cashflow Projection (30 years)</h2>
              <CashflowBarChart projections={projections} breakEvenYear={breakEvenYear} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <MetricCard label="Break-even Year" value={breakEvenYear.toString()} />
              <MetricCard label="Property Value" value={`$${(property.value / 1000).toFixed(0)}K`} />
              <MetricCard label="Loan Balance" value={`$${(property.loanBalance / 1000).toFixed(0)}K`} />
              <MetricCard label="Current Cashflow" value={`$${((property.currentRent - property.currentExpenses - property.loanPayment) / 1000).toFixed(1)}K/yr`} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function CashflowBarChart({ projections, breakEvenYear }: { projections: any[], breakEvenYear: number }) {
  const maxCashflow = Math.max(...projections.map(p => Math.abs(p.netCashflow)));
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6b7280]">Annual Cashflow Projection</p>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Positive Cashflow</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Negative Cashflow</span>
          </div>
        </div>
      </div>
      
      <div className="relative h-64 overflow-x-auto">
        <div className="flex items-end gap-1 h-full min-w-max px-4">
          {projections.map((projection) => {
            const height = (Math.abs(projection.netCashflow) / maxCashflow) * 100;
            const isPositive = projection.netCashflow >= 0;
            const isBreakEven = projection.year === breakEvenYear;
            
            return (
              <div key={projection.year} className="flex flex-col items-center group">
                <div className="relative">
                  <div
                    className={`w-4 rounded-t transition-all duration-200 ${
                      isPositive ? 'bg-blue-500' : 'bg-gray-400'
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
                  Year {projection.year}: ${(projection.netCashflow / 1000).toFixed(1)}K
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="text-center text-sm text-[#6b7280]">
        Break-even achieved in {breakEvenYear} • 30-year projection shows {projections.filter(p => p.netCashflow > 0).length} positive years
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
      <p className="text-xs text-[#6b7280]">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
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
