"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { propertyService } from "@/lib/services/propertyService";
import { Property, Loan } from "@/types";
import LoanManagement from "./LoanManagement";

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

interface Milestone {
  name: string;
  year: number;
  achieved: boolean;
  target: number;
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
  const [isEditingLoan, setIsEditingLoan] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const propertyData = await propertyService.getPropertyById(propertyId);
        if (propertyData) {
          setProperty(propertyData);
          setSelectedStrategy(propertyData.strategy);
          
          // Auto-update status to 'modeling' when user visits the modeling page
          if (propertyData.cashflow_status === 'not_modeled') {
            try {
              await propertyService.updateCashflowStatus(propertyId, 'modeling');
              setProperty(prev => prev ? { ...prev, cashflow_status: 'modeling' } : null);
            } catch (err) {
              console.warn('Failed to update cashflow status to modeling:', err);
            }
          }
        } else {
          setError('Property not found');
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property data');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  // Convert Property to PropertyData for calculations
  const propertyData: PropertyData = useMemo(() => {
    if (!property) {
      return {
        id: propertyId,
        name: "Loading...",
        type: "Unknown",
        purchasePrice: 0,
        currentValue: 0,
        purchaseDate: "2024-01-01",
        address: "",
        strategy: "buy_hold",
      };
    }

    return {
      id: property.id,
      name: property.name,
      type: property.type,
      purchasePrice: property.purchase_price,
      currentValue: property.current_value,
      purchaseDate: property.purchase_date,
      address: property.address || "",
      strategy: property.strategy,
      annualRent: property.annual_rent,
      annualExpenses: property.annual_expenses,
    } as any;
  }, [property, propertyId]);

  // Multiple loans support - get all loans from property
  const loans = useMemo(() => {
    if (property?.loans && property.loans.length > 0) {
      return property.loans;
    } else if (property?.loan) {
      // Backward compatibility - convert single loan to array
      return [property.loan];
    }
    return [];
  }, [property]);

  // Aggregate loan data for calculations
  const aggregatedLoanData = useMemo(() => {
    if (loans.length === 0) {
      return {
        totalPrincipal: 0,
        totalMonthlyPayment: 0,
        hasLoans: false
      };
    }

    let totalPrincipal = 0;
    let totalMonthlyPayment = 0;

    loans.forEach(loan => {
      totalPrincipal += loan.principal_amount;
      
      // Calculate monthly payment for each loan
      if (loan.principal_amount > 0 && loan.interest_rate > 0) {
        const monthlyRate = loan.interest_rate / 100 / 12;
        const totalPayments = loan.term_years * 12;
        
        if (loan.type === 'interest_only') {
          totalMonthlyPayment += (loan.principal_amount * loan.interest_rate / 100) / 12;
        } else {
          const monthlyPayment = (loan.principal_amount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                               (Math.pow(1 + monthlyRate, totalPayments) - 1);
          totalMonthlyPayment += monthlyPayment;
        }
      }
    });

    return {
      totalPrincipal,
      totalMonthlyPayment,
      hasLoans: true
    };
  }, [loans]);

  // Calculate projections
  const projections = useMemo(() => {
    const data: YearlyProjection[] = [];
    let cumulativeCashflow = 0;
    let currentLoanBalance = aggregatedLoanData.totalPrincipal;
    // Get rent and expenses from property data or use defaults
    let currentRent = property?.annual_rent || 0; // Annual rent
    let currentExpenses = property?.annual_expenses || 0; // Annual expenses

    for (let year = 2024; year <= 2054; year++) {
      const yearIndex = year - 2024;
      
      // Calculate growing values
      const rentIncome = currentRent * Math.pow(1 + assumptions.rentGrowthRate / 100, yearIndex);
      const expenses = currentExpenses * Math.pow(1 + assumptions.expenseInflationRate / 100, yearIndex);
      const propertyValue = propertyData.currentValue * Math.pow(1 + assumptions.capitalGrowthRate / 100, yearIndex);
      
      // Calculate loan payment (simplified)
      let annualLoanPayment = 0;
      let annualInterest = 0;
      let annualPrincipal = 0;
      
      if (aggregatedLoanData.hasLoans) {
        // Use pre-calculated total monthly payment
        annualLoanPayment = aggregatedLoanData.totalMonthlyPayment * 12;
        
        // Simplified interest calculation (weighted average would be more accurate)
        const avgInterestRate = loans.length > 0 ? 
          loans.reduce((sum, loan) => sum + loan.interest_rate, 0) / loans.length : 0;
        
        annualInterest = currentLoanBalance * (avgInterestRate / 100);
        annualPrincipal = Math.max(0, annualLoanPayment - annualInterest);
        currentLoanBalance = Math.max(0, currentLoanBalance - annualPrincipal);
      }
      
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
  }, [assumptions, propertyData, aggregatedLoanData, loans]);

  // Calculate key metrics
  const breakEvenYear = projections.find(p => p.cumulativeCashflow >= 0)?.year || 2054;
  const netPresentValue = useMemo(() => {
    return projections.reduce((npv, projection) => {
      const discountFactor = Math.pow(1 + assumptions.discountRate / 100, projection.year - 2024);
      return npv + projection.netCashflow / discountFactor;
    }, 0);
  }, [projections, assumptions.discountRate]);

  // Calculate milestones based on actual projections
  const calculatedMilestones = useMemo(() => {
    const initialRent = property?.annual_rent || 45000;
    const milestoneTargets = [
      { name: 'Break-even', target: 0, type: 'cumulative' },
      { name: '25% of Rent', target: initialRent * 0.25, type: 'annual' },
      { name: '50% of Rent', target: initialRent * 0.5, type: 'annual' },
      { name: '75% of Rent', target: initialRent * 0.75, type: 'annual' },
      { name: '100% of Rent', target: initialRent, type: 'annual' }
    ];

    return milestoneTargets.map(milestone => {
      let achievedYear = 2054;
      let achieved = false;

      if (milestone.type === 'cumulative') {
        // For break-even, find when cumulative cashflow becomes positive
        const breakEvenProjection = projections.find(p => p.cumulativeCashflow >= milestone.target);
        if (breakEvenProjection) {
          achievedYear = breakEvenProjection.year;
          achieved = true;
        }
      } else {
        // For annual targets, find when annual cashflow reaches the target
        const targetProjection = projections.find(p => p.netCashflow >= milestone.target);
        if (targetProjection) {
          achievedYear = targetProjection.year;
          achieved = true;
        }
      }

      return {
        name: milestone.name,
        year: achievedYear,
        achieved,
        target: milestone.target
      };
    });
  }, [projections, property?.annual_rent]);

  // Debug: Log chart data
  console.log('Chart Debug:', {
    projectionsLength: projections.length,
    first10Years: projections.slice(0, 10).map(p => ({ year: p.year, cashflow: p.netCashflow })),
    maxCashflow: Math.max(...projections.slice(0, 10).map(p => Math.abs(p.netCashflow))),
    breakEvenYear,
    propertyData: {
      currentValue: propertyData.currentValue,
      annualRent: property?.annual_rent,
      annualExpenses: property?.annual_expenses
    },
    loanData: {
      totalPrincipal: aggregatedLoanData.totalPrincipal,
      totalMonthlyPayment: aggregatedLoanData.totalMonthlyPayment,
      loansCount: loans.length
    },
    assumptions
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

  // Helper function to check if property is fully modeled
  const isPropertyFullyModeled = useCallback((prop: any, loans?: any[]) => {
    return prop && 
           prop.annual_rent > 0 && 
           prop.annual_expenses >= 0 && 
           loans && 
           loans.length > 0 &&
           loans.some(loan => loan.principal_amount > 0 && loan.interest_rate > 0);
  }, []);

  const handlePropertySave = useCallback(async (updatedPropertyData: PropertyData) => {
    try {
      // Call API to update property
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedPropertyData.name,
          type: updatedPropertyData.type,
          address: updatedPropertyData.address,
          purchase_price: updatedPropertyData.purchasePrice,
          current_value: updatedPropertyData.currentValue,
          annual_rent: (updatedPropertyData as any).annualRent,
          annual_expenses: (updatedPropertyData as any).annualExpenses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update property');
      }

      const { property: updatedProperty } = await response.json();
      
      // Update local state
      setProperty(updatedProperty);
      setIsEditingProperty(false);
      
      // Check if property should be marked as fully modeled
      if (isPropertyFullyModeled(updatedProperty, updatedProperty.loans || [updatedProperty.loan].filter(Boolean))) {
        try {
          await propertyService.updateCashflowStatus(propertyId, 'modeled');
          setProperty(prev => prev ? { ...prev, cashflow_status: 'modeled' } : null);
        } catch (err) {
          console.warn('Failed to update cashflow status to modeled:', err);
        }
      }
      
      console.log('Property updated successfully');
    } catch (error) {
      console.error('Error updating property:', error);
      alert('Failed to update property. Please try again.');
    }
  }, [propertyId, isPropertyFullyModeled]);

  // Handle loan management changes
  const handleLoansChange = useCallback(async (updatedLoans: Loan[]) => {
    try {
      console.log('🏠 PropertyModelingPage: Received loan changes:', updatedLoans);
      
      // Update the property in the database
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loans: updatedLoans
        }),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error('Failed to update loans');
      }

      const { property: updatedProperty } = await response.json();
      console.log('✅ Updated property received:', updatedProperty);
      setProperty(updatedProperty);

      // Check if property should be marked as fully modeled
      if (isPropertyFullyModeled(updatedProperty, updatedLoans)) {
        try {
          await propertyService.updateCashflowStatus(propertyId, 'modeled');
          setProperty(prev => prev ? { ...prev, cashflow_status: 'modeled' } : null);
        } catch (err) {
          console.warn('Failed to update cashflow status to modeled:', err);
        }
      }
    } catch (error) {
      console.error('❌ Error updating loans:', error);
      alert('Failed to update loans. Please try again.');
    }
  }, [propertyId, property, isPropertyFullyModeled]);

  const handleLoanSave = useCallback(async (loanData: any) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/loan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update loan');
      }

      const { property: updatedProperty } = await response.json();
      
      // Update local state
      setProperty(updatedProperty);
      setIsEditingLoan(false);
      
      // Check if property should be marked as fully modeled
      if (isPropertyFullyModeled(updatedProperty, updatedProperty.loan)) {
        try {
          await propertyService.updateCashflowStatus(propertyId, 'modeled');
          setProperty(prev => prev ? { ...prev, cashflow_status: 'modeled' } : null);
        } catch (err) {
          console.warn('Failed to update cashflow status to modeled:', err);
        }
      }
      
      console.log('Loan updated successfully');
    } catch (error) {
      console.error('Error updating loan:', error);
      alert('Failed to update loan. Please try again.');
    }
  }, [propertyId, isPropertyFullyModeled]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading property data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-[#111827] mb-2">Error Loading Property</h2>
          <p className="text-[#6b7280] mb-4">{error}</p>
          <a 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8]"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

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
                  <span className="text-sm font-medium text-white">U</span>
                </div>
                <span className="hidden md:block text-sm font-medium text-[#111827]">User</span>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Property Details</h2>
                <button
                  onClick={() => setIsEditingProperty(!isEditingProperty)}
                  className="p-1.5 text-[#6b7280] hover:text-[#2563eb] hover:bg-[#eff6ff] rounded-lg transition-colors"
                  title={isEditingProperty ? 'Save changes' : 'Edit property'}
                >
                  <IconEdit className="h-4 w-4" />
                </button>
              </div>
              {isEditingProperty ? (
                <PropertyEditForm property={propertyData} onSave={handlePropertySave} />
              ) : (
                <PropertyInfoDisplay property={propertyData} />
              )}
            </section>

            {/* Loan Management */}
            <LoanManagement 
              loans={loans}
              onLoansChange={handleLoansChange}
              propertyId={propertyId}
            />

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

            {/* Key Milestones Timeline */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <MilestonesTimeline milestones={calculatedMilestones} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function CashflowBarChart({ projections, breakEvenYear, height = 300 }: { projections: YearlyProjection[]; breakEvenYear: number; height?: number }) {
  // Ensure we have data to display
  if (!projections || projections.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6b7280]">Annual Cashflow Projection (First 10 Years)</p>
        </div>
        <div className="flex items-center justify-center h-64 text-[#6b7280] border border-[#e5e7eb] rounded-lg">
          <p>No projection data available</p>
        </div>
      </div>
    );
  }

  // Get all 30 years of data
  const chartData = projections.slice(0, 30);
  const maxCashflow = Math.max(...chartData.map(p => Math.abs(p.netCashflow)));
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6b7280]">30-Year Cashflow Projection</p>
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
      
      {/* Chart */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <div className="flex items-center justify-between h-80 gap-1 relative overflow-x-auto pl-12">
          {/* Y-axis guides */}
          <div className="absolute left-12 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
            {[0, 25, 50, 75, 100].map((percent) => (
              <div key={percent} className="border-t border-gray-100" style={{ height: '1px' }}></div>
            ))}
          </div>
          
          {/* X-axis line */}
          <div className="absolute left-12 right-0 top-1/2 transform -translate-y-1/2 border-t border-gray-300"></div>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pointer-events-none w-12">
            <div className="text-right pr-2">${(maxCashflow / 1000).toFixed(0)}K</div>
            <div className="text-right pr-2">${((maxCashflow * 0.75) / 1000).toFixed(0)}K</div>
            <div className="text-right pr-2">${((maxCashflow * 0.5) / 1000).toFixed(0)}K</div>
            <div className="text-right pr-2">${((maxCashflow * 0.25) / 1000).toFixed(0)}K</div>
            <div className="text-right pr-2">$0</div>
            <div className="text-right pr-2">-${((maxCashflow * 0.25) / 1000).toFixed(0)}K</div>
            <div className="text-right pr-2">-${((maxCashflow * 0.5) / 1000).toFixed(0)}K</div>
            <div className="text-right pr-2">-${((maxCashflow * 0.75) / 1000).toFixed(0)}K</div>
            <div className="text-right pr-2">-${(maxCashflow / 1000).toFixed(0)}K</div>
          </div>
          
          {chartData.map((projection, index) => {
            const cashflow = projection.netCashflow;
            const isPositive = cashflow >= 0;
            const heightPercent = maxCashflow > 0 ? (Math.abs(cashflow) / maxCashflow) * 100 : 0;
            // Convert percentage to pixels and round to prevent hydration mismatch
            const barHeight = Math.max(Math.round((heightPercent / 100) * 120), 3); // Max 120px, min 3px
            
            // Show year labels for every 5th year to avoid clutter
            const showYearLabel = index % 5 === 0 || index === chartData.length - 1;
            
            return (
              <div key={projection.year} className="flex flex-col items-center flex-shrink-0 relative group" style={{ width: '20px' }}>
                {/* Bar positioned above or below x-axis */}
                <div 
                  className={`w-full rounded-t transition-all duration-200 cursor-pointer ${
                    isPositive ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                  style={{ 
                    height: `${barHeight}px`,
                    position: 'absolute',
                    bottom: isPositive ? '50%' : 'auto',
                    top: isPositive ? 'auto' : '50%',
                    transform: isPositive ? 'translateY(0)' : 'translateY(0)'
                  }}
                ></div>
                
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-medium">{projection.year}</div>
                  <div>${(cashflow / 1000).toFixed(1)}K</div>
                </div>
                
                {/* Year label - positioned below x-axis for negative, above for positive */}
                {showYearLabel && (
                  <div className={`text-xs text-[#6b7280] text-center absolute ${
                    isPositive ? 'top-0' : 'bottom-0'
                  }`}>
                    {projection.year}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Summary */}
      <div className="text-center text-sm text-[#6b7280]">
        Break-even achieved in {breakEvenYear} • 30-year projection shows {projections.filter(p => p.netCashflow > 0).length} positive years
      </div>
      
      {/* Modern Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Break-even Year */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Break-even</p>
              <p className="text-2xl font-bold text-blue-900">{breakEvenYear}</p>
              <p className="text-xs text-blue-600">Years to positive cashflow</p>
            </div>
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Years */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Timeline</p>
              <p className="text-2xl font-bold text-green-900">{projections.length}</p>
              <p className="text-xs text-green-600">Years (2024-2054)</p>
            </div>
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Positive Years */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Success Rate</p>
              <p className="text-2xl font-bold text-purple-900">{projections.filter(p => p.netCashflow > 0).length}/30</p>
              <p className="text-xs text-purple-600">Positive cashflow years</p>
            </div>
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Max Cashflow */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Peak Cashflow</p>
              <p className="text-2xl font-bold text-orange-900">${(maxCashflow / 1000).toFixed(0)}K</p>
              <p className="text-xs text-orange-600">Maximum annual cashflow</p>
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function MilestonesTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center">
        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Financial Milestones
      </h3>
      
      {/* Timeline with Perfect Alignment */}
      <div className="relative h-40">
        {/* Timeline line - positioned exactly in center */}
        <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-gray-200"></div>
        
        {/* Nodes positioned absolutely on the line */}
        <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 flex justify-between items-center">
          {milestones.map((milestone, index) => (
            <div 
              key={index}
              className={`w-4 h-4 rounded-full border-2 border-blue-600 shadow-md ${
                milestone.achieved ? 'bg-green-500' : 'bg-gray-400'
              }`}
            ></div>
          ))}
        </div>
        
        {/* Labels positioned below the line */}
        <div className="absolute left-0 right-0 top-1/2 transform translate-y-4 flex justify-between">
          {milestones.map((milestone, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium text-gray-700">{milestone.name}</div>
              <div className="text-xs text-gray-500">Year {milestone.year}</div>
            </div>
          ))}
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
          value={formData.name || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6b7280] mb-1">Type</label>
        <select
          value={formData.type || ''}
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
          value={formData.address || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1">Purchase Price</label>
          <input
            type="number"
            value={formData.purchasePrice || 0}
            onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1">Current Value</label>
          <input
            type="number"
            value={formData.currentValue || 0}
            onChange={(e) => setFormData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1">Annual Rent</label>
          <input
            type="number"
            value={(formData as any).annualRent || 0}
            onChange={(e) => setFormData(prev => ({ ...prev, annualRent: parseFloat(e.target.value) || 0 } as any))}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1">Annual Expenses</label>
          <input
            type="number"
            value={(formData as any).annualExpenses || 0}
            onChange={(e) => setFormData(prev => ({ ...prev, annualExpenses: parseFloat(e.target.value) || 0 } as any))}
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
          value={assumptions.rentGrowthRate || 0}
          onChange={(e) => onAssumptionChange('rentGrowthRate', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          step="0.1"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Capital Growth Rate (%)</label>
        <input
          type="number"
          value={assumptions.capitalGrowthRate || 0}
          onChange={(e) => onAssumptionChange('capitalGrowthRate', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          step="0.1"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Expense Inflation Rate (%)</label>
        <input
          type="number"
          value={assumptions.expenseInflationRate || 0}
          onChange={(e) => onAssumptionChange('expenseInflationRate', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          step="0.1"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Tax Rate (%)</label>
        <input
          type="number"
          value={assumptions.taxRate || 0}
          onChange={(e) => onAssumptionChange('taxRate', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          step="0.1"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Discount Rate (%)</label>
        <input
          type="number"
          value={assumptions.discountRate || 0}
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

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

// Loan Info Display Component
function LoanInfoDisplay({ loan, onEdit }: { loan?: any; onEdit: () => void }) {
  if (!loan) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6 text-[#6b7280]">
          <p className="text-sm mb-3">No loan configured</p>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            <IconPlus className="h-4 w-4" />
            Add Loan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[#6b7280]">Loan Type:</span>
          <span className="font-medium">{loan.type === 'principal_interest' ? 'P&I' : 'Interest Only'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6b7280]">Principal:</span>
          <span className="font-medium">${loan.principal_amount?.toLocaleString() || '0'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6b7280]">Interest Rate:</span>
          <span className="font-medium">{loan.interest_rate || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6b7280]">Term:</span>
          <span className="font-medium">{loan.term_years || 0} years</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6b7280]">Start Date:</span>
          <span className="font-medium">{loan.start_date || 'Not set'}</span>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:shadow-sm"
      >
        <IconEdit className="h-4 w-4" />
        Edit Loan
      </button>
    </div>
  );
}

// Loan Edit Form Component
function LoanEditForm({ loan, onSave, onCancel }: { 
  loan?: any; 
  onSave: (data: any) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    type: loan?.type || 'principal_interest',
    principal_amount: loan?.principal_amount || 0,
    interest_rate: loan?.interest_rate || 0,
    term_years: loan?.term_years || 30,
    start_date: loan?.start_date || new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Loan Type</label>
        <select
          value={formData.type || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        >
          <option value="principal_interest">Principal & Interest</option>
          <option value="interest_only">Interest Only</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Principal Amount</label>
        <input
          type="number"
          value={formData.principal_amount || 0}
          onChange={(e) => setFormData(prev => ({ ...prev, principal_amount: parseFloat(e.target.value) || 0 }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          placeholder="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Interest Rate (%)</label>
        <input
          type="number"
          value={formData.interest_rate || 0}
          onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          step="0.01"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Term (Years)</label>
        <input
          type="number"
          value={formData.term_years || 0}
          onChange={(e) => setFormData(prev => ({ ...prev, term_years: parseInt(e.target.value) || 0 }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          placeholder="30"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Start Date</label>
        <input
          type="date"
          value={formData.start_date || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
        >
          <IconCheck className="h-4 w-4" />
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:shadow-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
