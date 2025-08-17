"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { propertyService } from "@/lib/services/propertyService";
import { Property, Loan } from "@/types";
import LoanManagement from "./LoanManagement";
import IncomeModeling from "./IncomeModeling";
import OutgoingsModeling from "./OutgoingsModeling";
import GrowthAssumptions from "./GrowthAssumptions";
import DetailedProjections from "./DetailedProjections";
import CollapsibleSection from "../ui/CollapsibleSection";

// Safe number formatting to prevent hydration mismatches
const formatNumber = (num: number, decimals: number = 0): string => {
  if (typeof window === 'undefined') return '0'; // SSR fallback
  return num.toFixed(decimals);
};

const formatCurrency = (amount: number, showDecimals: boolean = false): string => {
  if (typeof window === 'undefined') return '$0'; // SSR fallback
  const decimals = showDecimals ? 1 : 0;
  return `$${(amount / 1000).toFixed(decimals)}K`;
};

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
  rentGrowth: number;
  capitalGrowth: number;
  inflationRate: number;
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

interface Milestone {
  year: number;
  label: string;
  achieved: boolean;
  target: number;
}

// Constants
const DEFAULT_ASSUMPTIONS: ModelingAssumptions = {
  rentGrowth: 3.5,
  capitalGrowth: 4.0,
  inflationRate: 2.5,
  taxRate: 30.0,
  discountRate: 8.0,
};

export default function PropertyModelingPage({ propertyId }: { propertyId: string }) {
  const [assumptions, setAssumptions] = useState<ModelingAssumptions>(DEFAULT_ASSUMPTIONS);
  const [isEditingProperty, setIsEditingProperty] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // New state for income and outgoings modeling
  const [totalIncome, setTotalIncome] = useState(0);
  const [incomeItems, setIncomeItems] = useState<any[]>([]);
  const [totalOutgoings, setTotalOutgoings] = useState(0);
  const [outgoingItems, setOutgoingItems] = useState<any[]>([]);

  // Client-side mount detection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const propertyData = await propertyService.getPropertyById(propertyId);
        if (propertyData) {
          setProperty(propertyData);
          
          // Set initial income if available
          if (propertyData.annual_rent && propertyData.annual_rent > 0) {
            setTotalIncome(propertyData.annual_rent);
          }
          
          // Set initial expenses if available
          if (propertyData.annual_expenses && propertyData.annual_expenses > 0) {
            setTotalOutgoings(propertyData.annual_expenses);
          }

          // Update cashflow status to modeling if not already modeled
          if (propertyData.cashflow_status === 'not_modeled') {
            try {
              await propertyService.updateCashflowStatus(propertyId, 'modeling');
              setProperty(prev => prev ? { ...prev, cashflow_status: 'modeling' } : null);
            } catch (err) {
              console.warn('Failed to update cashflow status to modeling:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Failed to load property data');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  // Property data for display
  const propertyData = useMemo(() => {
    if (!property) return null;
    return {
      id: property.id,
      name: property.name,
      type: property.type,
      purchasePrice: property.purchase_price,
      currentValue: property.current_value,
      purchaseDate: property.purchase_date,
      address: property.address || '',
      strategy: property.strategy || 'buy_hold'
    };
  }, [property]);

  // Loans data
  const loans = useMemo(() => {
    if (property?.loans && property.loans.length > 0) {
      return property.loans;
    } else if (property?.loan) {
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

  // Calculate projections based on current data
  const projections = useMemo(() => {
    if (!propertyData) return [];
    
    const currentYear = new Date().getFullYear();
    const projections: YearlyProjection[] = [];
    
    // Use totalIncome/totalOutgoings if available, otherwise fall back to property data
    const currentRent = totalIncome || property?.annual_rent || 0;
    const currentExpenses = totalOutgoings || property?.annual_expenses || 0;
    const currentLoanBalance = aggregatedLoanData.totalPrincipal;
    const monthlyLoanPayment = aggregatedLoanData.totalMonthlyPayment;

    for (let i = 0; i < 30; i++) {
      const year = currentYear + i;
      
      // Apply growth rates
      const rentIncome = currentRent * Math.pow(1 + assumptions.rentGrowth / 100, i);
      const expenses = currentExpenses * Math.pow(1 + assumptions.inflationRate / 100, i);
      const loanPayment = monthlyLoanPayment * 12;
      
      // Simple tax calculation
      const grossIncome = rentIncome - expenses - loanPayment;
      const taxLiability = grossIncome > 0 ? grossIncome * (assumptions.taxRate / 100) : 0;
      const netCashflow = grossIncome - taxLiability;
      
      // Property value growth
      const propertyValue = propertyData.currentValue * Math.pow(1 + assumptions.capitalGrowth / 100, i);
      
      // Simplified loan balance (assuming P&I loan)
      const remainingYears = Math.max(0, 30 - i);
      const loanBalance = currentLoanBalance > 0 ? 
        currentLoanBalance * (remainingYears / 30) : 0;

      projections.push({
        year,
        rentIncome,
        expenses,
        loanPayment,
        taxLiability,
        netCashflow,
        cumulativeCashflow: projections.reduce((sum, p) => sum + p.netCashflow, 0) + netCashflow,
        propertyValue,
        loanBalance: Math.max(0, loanBalance)
      });
    }

    return projections;
  }, [propertyData, assumptions, totalIncome, totalOutgoings, aggregatedLoanData, property]);

  // Calculate break-even year
  const breakEvenYear = useMemo(() => {
    const breakEvenProjection = projections.find(p => p.netCashflow >= 0);
    return breakEvenProjection ? breakEvenProjection.year : projections[projections.length - 1]?.year || 2054;
  }, [projections]);

  // Calculate NPV
  const netPresentValue = useMemo(() => {
    return projections.reduce((npv, projection, index) => {
      const discountFactor = Math.pow(1 + assumptions.discountRate / 100, index + 1);
      return npv + (projection.netCashflow / discountFactor);
    }, 0);
  }, [projections, assumptions.discountRate]);

  // Calculate milestones
  const calculatedMilestones = useMemo(() => {
    if (!property?.annual_rent || property.annual_rent === 0) {
      return [];
    }

    const rentalIncome = property.annual_rent;
    const targets = [
      { percentage: 0, label: "Break-even" },
      { percentage: 25, label: "25% of rental income" },
      { percentage: 50, label: "50% of rental income" },
      { percentage: 75, label: "75% of rental income" },
      { percentage: 100, label: "100% of rental income" }
    ];

    return targets.map(target => {
      const targetAmount = (rentalIncome * target.percentage) / 100;
      const achievedProjection = projections.find(p => p.netCashflow >= targetAmount);
      
      return {
        year: achievedProjection ? achievedProjection.year : projections[projections.length - 1]?.year || 2054,
        label: target.label,
        achieved: !!achievedProjection,
        target: targetAmount
      };
    });
  }, [projections, property]);

  // Check if property is fully modeled
  const isPropertyFullyModeled = useCallback((prop: any, loans?: any[]) => {
    const hasBasicData = prop && 
      prop.annual_rent && prop.annual_rent > 0 &&
      prop.annual_expenses !== undefined && prop.annual_expenses >= 0;
    
    const hasLoanData = loans && loans.length > 0 && 
      loans.some(loan => loan.principal_amount > 0 && loan.interest_rate > 0);
    
    return hasBasicData && hasLoanData;
  }, []);

  // Handle property save
  const handlePropertySave = useCallback(async (updatedPropertyData: PropertyData) => {
    try {
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
          annual_rent: property?.annual_rent,
          annual_expenses: property?.annual_expenses
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update property');
      }

      const { property: updatedProperty } = await response.json();
      setProperty(updatedProperty);
      setIsEditingProperty(false);

      // Check if property should be marked as fully modeled
      if (isPropertyFullyModeled(updatedProperty, loans)) {
        try {
          await propertyService.updateCashflowStatus(propertyId, 'modeled');
          setProperty(prev => prev ? { ...prev, cashflow_status: 'modeled' } : null);
        } catch (err) {
          console.warn('Failed to update cashflow status to modeled:', err);
        }
      }
    } catch (error) {
      console.error('Error updating property:', error);
      alert('Failed to update property. Please try again.');
    }
  }, [propertyId, isPropertyFullyModeled, loans, property]);

  // Handle loan management changes
  const handleLoansChange = useCallback(async (updatedLoans: Loan[]) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loans: updatedLoans
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update loans: ${errorData.error || response.statusText}`);
      }

      const responseData = await response.json();
      const updatedProperty = responseData.property || responseData;
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
      console.error('❌ PropertyModelingPage: Error in handleLoansChange:', error);
      alert(`Failed to update loans: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [propertyId, property, isPropertyFullyModeled]);

  // Callback for income changes
  const handleIncomeChange = useCallback((total: number, items: any[]) => {
    setTotalIncome(total);
    setIncomeItems(items);
  }, []);

  // Callback for outgoings changes
  const handleOutgoingsChange = useCallback((total: number, items: any[]) => {
    setTotalOutgoings(total);
    setOutgoingItems(items);
  }, []);

  // Callback for assumptions changes
  const handleAssumptionsChange = useCallback((newAssumptions: ModelingAssumptions) => {
    setAssumptions(newAssumptions);
  }, []);

  // Show loading state
  if (!mounted || loading) {
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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8]"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!propertyData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6b7280]">Property not found</p>
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

        {/* Main Content - Sidebar + Main Layout - Mobile Responsive */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Property Details */}
            <CollapsibleSection title="Property Details" defaultExpanded={true}>
              <div className="flex items-center justify-between mb-4">
                <div></div>
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
            </CollapsibleSection>

            {/* Loan Management */}
            <LoanManagement 
              loans={loans}
              onLoansChange={handleLoansChange}
              propertyId={propertyId}
            />

            {/* Growth & Cashflow Assumptions */}
            <GrowthAssumptions 
              assumptions={assumptions}
              onAssumptionsChange={handleAssumptionsChange}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* KPI Cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard 
                label="Break-even Year" 
                value={`${breakEvenYear}`}
                accent="blue"
                helper={`${breakEvenYear - 2024} years to positive cashflow`}
              />
              <MetricCard 
                label="Net Present Value" 
                value={formatCurrency(netPresentValue)} 
                accent="green"
                helper={`${assumptions.discountRate}% discount rate`}
              />
              <MetricCard 
                label="Annual Cashflow" 
                value={formatCurrency(projections[0]?.netCashflow || 0, true)} 
                accent="orange"
                helper="Year 1 projection"
              />
              <MetricCard 
                label="Property Value" 
                value={formatCurrency(propertyData.currentValue)} 
                accent="purple"
                helper="Current market value"
              />
            </section>

            {/* Cashflow Chart */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">30-Year Cashflow Projection</h2>
              <CashflowBarChart projections={projections} breakEvenYear={breakEvenYear} />
            </section>

            {/* Milestones Timeline */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Key Milestones</h2>
              <MilestonesTimeline milestones={calculatedMilestones} />
            </section>

            {/* Income Modeling */}
            <IncomeModeling 
              onIncomeChange={handleIncomeChange}
              initialIncome={property?.annual_rent || 0}
            />

            {/* Outgoings Modeling */}
            <OutgoingsModeling 
              onOutgoingsChange={handleOutgoingsChange}
              initialExpenses={property?.annual_expenses || 0}
            />

            {/* Detailed Projections - Bottom, Collapsible */}
            <DetailedProjections 
              propertyValue={propertyData.currentValue}
              totalIncome={totalIncome || property?.annual_rent || 0}
              totalOutgoings={totalOutgoings || property?.annual_expenses || 0}
              loanAmount={aggregatedLoanData.totalPrincipal}
              interestRate={loans.length > 0 ? loans[0].interest_rate : 0}
              assumptions={assumptions}
              totalCashInvested={propertyData.currentValue - aggregatedLoanData.totalPrincipal}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// Keep the existing helper components that are still needed
function CashflowBarChart({ projections, breakEvenYear, height = 300 }: { projections: YearlyProjection[]; breakEvenYear: number; height?: number }) {
  // Simplified chart for now - you can copy the full implementation from the backup
  return (
    <div className="space-y-4">
      <div className="text-center text-[#6b7280]">
        <p>Chart will be updated to use new income/outgoings data</p>
        <p className="text-sm">Break-even year: {breakEvenYear}</p>
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
              <div className="text-sm font-medium text-gray-700">{milestone.label}</div>
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
        <h3 className="font-medium text-[#111827]">{property.name}</h3>
        <p className="text-sm text-[#111827]">{property.address}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6b7280]">Purchase Price</label>
          <p className="text-sm font-medium text-[#111827]">{formatCurrency(property.purchasePrice)}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b7280]">Current Value</label>
          <p className="text-sm font-medium text-[#111827]">{formatCurrency(property.currentValue)}</p>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">Property Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">Purchase Price</label>
          <input
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">Current Value</label>
          <input
            type="number"
            value={formData.currentValue}
            onChange={(e) => setFormData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8]"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

function MetricCard({ label, value, accent, helper }: { label: string; value: string; accent: string; helper: string }) {
  const accentClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50', 
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  return (
    <div className={`rounded-xl border p-4 ${accentClasses[accent as keyof typeof accentClasses] || 'border-gray-200 bg-gray-50'}`}>
      <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-[#111827] mt-1">{value}</div>
      <div className="text-xs text-[#6b7280] mt-1">{helper}</div>
    </div>
  );
}

// Icon components
function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9.5a6.5 6.5 0 1 0-13 0V12l-5 5h5m13 0v1a3 3 0 0 1-6 0v-1m6 0H9" />
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
