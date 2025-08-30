"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { propertyService } from "@/lib/services/propertyService";
import { Property, Loan, PropertyType, InvestmentStrategy, PropertyStatus } from "@/types";

// New shadcn/ui components
import PropertyHeader from "./PropertyHeader";
import PropertyMetrics from "./PropertyMetrics";
import PropertyLayout, { NavigationSectionId } from "./PropertyLayout";
import PropertyAnalysis from "./PropertyAnalysis";

// Existing section components - these will be refactored next
import LoanManagement from "./LoanManagement";
import IncomeModeling from "./IncomeModeling";
import OutgoingsModeling from "./OutgoingsModeling";
import GrowthAssumptions from "./GrowthAssumptions";
import DetailedProjections from "./DetailedProjections";
import PurchaseSection from "./drawer-sections/PurchaseSection";

// Safe number formatting to prevent hydration mismatches
const formatNumber = (num: number, decimals: number = 0): string => {
  if (typeof window === 'undefined') return '0';
  return num.toFixed(decimals);
};

const formatCurrency = (amount: number, showDecimals: boolean = false): string => {
  if (typeof window === 'undefined') return '$0';
  const decimals = showDecimals ? 1 : 0;
  const value = Math.round((amount / 1000) * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `$${value.toFixed(decimals)}K`;
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
  status?: 'modelling' | 'shortlisted' | 'bought' | 'sold';
}

interface ModelingAssumptions {
  rentGrowth: number;
  capitalGrowth: number;
  inflationRate: number;
  taxRate: number;
  medicareLevy: number;
  vacancyRate: number;
  pmFeeRate: number;
  depreciationRate: number;
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

interface PurchaseItem {
  id: string;
  engagement: string;
  paymentTiming: string;
  due: string;
  amount: number;
  status: 'Paid' | 'Outstanding';
  isCustom?: boolean;
}

// Constants
const DEFAULT_ASSUMPTIONS: ModelingAssumptions = {
  rentGrowth: 3.5,
  capitalGrowth: 4.0,
  inflationRate: 2.5,
  taxRate: 30.0,
  medicareLevy: 2.0,
  vacancyRate: 5.0,
  pmFeeRate: 8.0,
  depreciationRate: 2.5,
  discountRate: 8.0,
};

interface PropertyModelingPageProps {
  propertyId: string;
}

export default function PropertyModelingPageRefactored({ propertyId }: PropertyModelingPageProps) {
  // State management
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [assumptions, setAssumptions] = useState<ModelingAssumptions>(DEFAULT_ASSUMPTIONS);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalOutgoings, setTotalOutgoings] = useState(0);
  
  // UI State
  const [activeDrawerSection, setActiveDrawerSection] = useState<NavigationSectionId | null>(null);
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const property = await propertyService.getPropertyById(propertyId);
        
        // Fetch loans from API
        const loansResponse = await fetch(`/api/properties/${propertyId}/loan`);
        const loans = loansResponse.ok ? await loansResponse.json() : [];

        setProperty(property);
        setLoans(loans || []);
        setTotalIncome(property?.annual_rent || 0);
        setTotalOutgoings(property?.annual_expenses || 0);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property data');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      loadData();
    }
  }, [propertyId]);

  // Event handlers
  const handleSectionSelect = useCallback((section: NavigationSectionId) => {
    setActiveDrawerSection(section);
  }, []);

  const handleNavigationToggle = useCallback(() => {
    setIsNavigationCollapsed(!isNavigationCollapsed);
  }, [isNavigationCollapsed]);

  const handleDrawerClose = useCallback(() => {
    setActiveDrawerSection(null);
  }, []);

  const handleLoansChange = useCallback((updatedLoans: Loan[]) => {
    setLoans(updatedLoans);
  }, []);

  const handleAssumptionsChange = useCallback((updatedAssumptions: ModelingAssumptions) => {
    setAssumptions(updatedAssumptions);
  }, []);

  const handleIncomeChange = useCallback((income: number) => {
    setTotalIncome(income);
  }, []);

  const handleOutgoingsChange = useCallback((outgoings: number) => {
    setTotalOutgoings(outgoings);
  }, []);

  const handlePurchaseDataChange = useCallback((data: any) => {
    // Handle purchase data changes
    console.log('Purchase data changed:', data);
  }, []);

  // Create property data object
  const propertyData: PropertyData | null = useMemo(() => {
    if (!property) return null;
    
    return {
      id: property.id,
      name: property.name,
      type: property.type,
      purchasePrice: property.purchase_price,
      currentValue: property.current_value,
      purchaseDate: property.purchase_date,
      address: property.address || '',
      strategy: property.strategy,
      status: property.status as 'modelling' | 'shortlisted' | 'bought' | 'sold'
    };
  }, [property]);

  // Calculate projections
  const projections = useMemo((): YearlyProjection[] => {
    if (!propertyData || !mounted) return [];
    
    const projections: YearlyProjection[] = [];
    const startYear = new Date().getFullYear();
    const propertyValue = propertyData.currentValue;
    let cumulativeCashflow = 0;

    for (let i = 0; i < 30; i++) {
      const year = startYear + i;
      
      // Calculate growth rates
      const rentGrowthFactor = Math.pow(1 + assumptions.rentGrowth / 100, i);
      const capitalGrowthFactor = Math.pow(1 + assumptions.capitalGrowth / 100, i);
      const expenseGrowthFactor = Math.pow(1 + assumptions.inflationRate / 100, i);
      
      // Calculate yearly values
      const rentIncome = totalIncome * rentGrowthFactor * (1 - assumptions.vacancyRate / 100);
      const expenses = totalOutgoings * expenseGrowthFactor;
      
      // Simple loan calculation (could be enhanced with actual loan data)
      const loanBalance = loans.length > 0 ? 
        Math.max(0, loans[0].principal_amount - (i * loans[0].principal_amount / 30)) : 0;
      const loanPayment = loans.length > 0 ? 
        (loans[0].principal_amount * loans[0].interest_rate / 100) / 12 * 12 : 0;
      
      const taxableIncome = rentIncome - expenses - (propertyValue * assumptions.depreciationRate / 100);
      const taxLiability = Math.max(0, taxableIncome * (assumptions.taxRate + assumptions.medicareLevy) / 100);
      
      const netCashflow = rentIncome - expenses - loanPayment - taxLiability;
      cumulativeCashflow += netCashflow;
      
      const currentPropertyValue = propertyValue * capitalGrowthFactor;
      
      projections.push({
        year,
        rentIncome,
        expenses,
        loanPayment,
        taxLiability,
        netCashflow,
        cumulativeCashflow,
        propertyValue: currentPropertyValue,
        loanBalance
      });
    }

    return projections;
  }, [propertyData, assumptions, totalIncome, totalOutgoings, loans, mounted]);

  // Calculate metrics
  const breakEvenYear = useMemo(() => {
    const breakEvenProjection = projections.find(p => p.netCashflow >= 0);
    return breakEvenProjection ? breakEvenProjection.year : projections[projections.length - 1]?.year || 2054;
  }, [projections]);

  const netPresentValue = useMemo(() => {
    return projections.reduce((npv, projection, index) => {
      const discountFactor = Math.pow(1 + assumptions.discountRate / 100, index + 1);
      return npv + (projection.netCashflow / discountFactor);
    }, 0);
  }, [projections, assumptions.discountRate]);

  const milestones = useMemo(() => {
    if (!mounted || !property?.annual_rent || property.annual_rent === 0) return [];
    
    const rentalIncome = property.annual_rent;
    const currentYear = new Date().getFullYear();
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
      const achievedYear = achievedProjection ? achievedProjection.year : null;
      const isAchieved = achievedYear !== null && achievedYear <= currentYear;
      
      return {
        year: achievedYear || projections[projections.length - 1]?.year || 2054,
        label: target.label,
        achieved: isAchieved,
        target: targetAmount
      };
    });
  }, [projections, property, mounted]);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    if (!property) return { monthlyRent: 0, weeklyRent: 0, grossYield: 0, netYield: 0 };
    
    const annualRent = property.annual_rent || 0;
    const monthlyRent = annualRent / 12;
    const weeklyRent = annualRent / 52;
    const propertyValue = property.current_value || property.purchase_price || 0;
    const grossYield = propertyValue > 0 ? (annualRent / propertyValue) * 100 : 0;
    const netYield = propertyValue > 0 ? ((annualRent - totalOutgoings) / propertyValue) * 100 : 0;
    
    return { monthlyRent, weeklyRent, grossYield, netYield };
  }, [property, totalOutgoings]);

  const totalCashOutlay = useMemo(() => {
    if (!propertyData || loans.length === 0) return propertyData?.purchasePrice || 0;
    return propertyData.purchasePrice - (loans[0]?.principal_amount || 0);
  }, [propertyData, loans]);

  // Get current year cashflow from projections
  const currentYearCashflow = useMemo(() => {
    return projections.length > 0 ? projections[0].netCashflow : 0;
  }, [projections]);

  // Render drawer content based on active section
  const renderDrawerContent = useMemo(() => {
    switch (activeDrawerSection) {
      case 'purchase-details':
        return (
          <PurchaseSection
            data={{
              inputs: {
                propertyName: property?.name || '',
                propertyType: property?.type || 'residential_unit',
                investmentStrategy: property?.strategy || 'buy_hold',
                status: property?.status || 'modelling',
                propertyAddress: property?.address || '',
                state: '',
                purchasers: '',
                purchasePrice: property?.purchase_price || 0,
                valuationAtPurchase: property?.current_value || property?.purchase_price || 0,
                rentPerWeek: (property?.annual_rent || 0) / 52,
                numberOfUnits: 1,
                engagementDate: new Date().toISOString().split('T')[0],
                contractDate: property?.purchase_date || '',
                daysToUnconditional: 14,
                daysForSettlement: 42,
                lvr: loans.length > 0 && property?.purchase_price 
                  ? (loans[0].principal_amount / property.purchase_price) 
                  : 0.80,
                loanProduct: loans.length > 0 && loans[0].type === 'interest_only' ? 'I/O' : 'P&I',
                interestRate: loans.length > 0 ? loans[0].interest_rate / 100 : 0.065,
                loanTermYears: loans.length > 0 ? loans[0].term_years : 30,
                loanPreApproval: 0,
                fundsAvailable: 0,
                depositPaidAtConditional: 0.05,
                depositPaidAtUnconditional: 0.05,
              },
              paymentItems: []
            }}
            onChange={handlePurchaseDataChange}
          />
        );
      
      case 'loan-details':
        return (
          <LoanManagement 
            loans={loans}
            onLoansChange={handleLoansChange}
            propertyId={propertyId}
          />
        );
      
      case 'growth-assumptions':
        return (
          <GrowthAssumptions 
            assumptions={assumptions}
            onAssumptionsChange={handleAssumptionsChange}
          />
        );
      
      case 'income-modeling':
        return (
          <IncomeModeling 
            onIncomeChange={handleIncomeChange}
            initialIncome={property?.annual_rent || 0}
          />
        );
      
      case 'outgoings-modeling':
        return (
          <OutgoingsModeling 
            onOutgoingsChange={handleOutgoingsChange}
            initialExpenses={property?.annual_expenses || 0}
          />
        );
      
      default:
        return null;
    }
  }, [activeDrawerSection, property, loans, assumptions, propertyId, handlePurchaseDataChange, handleLoansChange, handleAssumptionsChange, handleIncomeChange, handleOutgoingsChange]);

  const getDrawerTitle = () => {
    switch (activeDrawerSection) {
      case 'purchase-details': return 'Purchase Details';
      case 'loan-details': return 'Loan Details';
      case 'growth-assumptions': return 'Growth Assumptions';
      case 'income-modeling': return 'Income Modeling';
      case 'outgoings-modeling': return 'Outgoings Modeling';
      default: return '';
    }
  };

  // Loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Property</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a 
            href="/dashboard" 
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!propertyData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Property not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PropertyHeader 
        propertyName={propertyData.name}
        address={propertyData.address}
        status={propertyData.status || 'modelling'}
      />
      
      {/* Main Layout */}
      <main className="h-[calc(100vh-140px)]">
        <PropertyLayout
          activeDrawerSection={activeDrawerSection}
          isNavigationCollapsed={isNavigationCollapsed}
          drawerContent={renderDrawerContent}
          drawerTitle={getDrawerTitle()}
          validationErrors={validationErrors}
          onSectionSelect={handleSectionSelect}
          onNavigationToggle={handleNavigationToggle}
          onDrawerClose={handleDrawerClose}
        >
          {/* Main Content with Height Constraints */}
          <div className="h-full flex flex-col">
            {/* Compact Header Area */}
            <div className="flex-shrink-0 p-3 pb-1">
              {/* Property Metrics - Compact */}
              <PropertyMetrics
                breakEvenYear={breakEvenYear}
                netPresentValue={netPresentValue}
                currentYear={new Date().getFullYear()}
                milestones={milestones}
                totalCashOutlay={totalCashOutlay}
                keyMetrics={keyMetrics}
                currentYearCashflow={currentYearCashflow}
                annualRent={property?.annual_rent || 0}
              />
            </div>
            
            {/* Flexible Analysis Section */}
            <div className="flex-1 min-h-0 px-3 pb-3">
              <PropertyAnalysis 
                projections={projections}
                loans={loans}
                initialInvestment={totalCashOutlay}
                propertyValue={propertyData.currentValue}
                totalIncome={totalIncome}
                totalOutgoings={totalOutgoings}
                loanAmount={loans[0]?.principal_amount}
                interestRate={loans[0]?.interest_rate}
                loanType={loans[0]?.type}
                ioYears={loans[0]?.io_years}
                assumptions={assumptions}
              />
            </div>
          </div>
        </PropertyLayout>
      </main>
    </div>
  );
}