"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { propertyService } from "@/lib/services/propertyService";
import { Property, Loan, PropertyType, InvestmentStrategy, PropertyStatus } from "@/types";
import LoanManagement from "./LoanManagement";
import IncomeModeling from "./IncomeModeling";
import OutgoingsModeling from "./OutgoingsModeling";
import GrowthAssumptions from "./GrowthAssumptions";
import DetailedProjections from "./DetailedProjections";
import CollapsibleSection from "../ui/CollapsibleSection";
import NavigationPanel, { NavigationSectionId } from "./NavigationPanel";
import RightPanel from "./RightPanel";
import PropertyDetailsSection from "./drawer-sections/PropertyDetailsSection";
import PurchaseSection from "./drawer-sections/PurchaseSection";

// Safe number formatting to prevent hydration mismatches
const formatNumber = (num: number, decimals: number = 0): string => {
  if (typeof window === 'undefined') return '0'; // SSR fallback
  return num.toFixed(decimals);
};

const formatCurrency = (amount: number, showDecimals: boolean = false): string => {
  if (typeof window === 'undefined') return '$0'; // SSR fallback
  // Ensure consistent rounding to avoid hydration mismatches
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
  isCustom?: boolean; // For user-added items
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

const DEFAULT_PURCHASE_ITEMS: PurchaseItem[] = [
  // Engagement
  {
    id: '1',
    engagement: 'Dadidot - Engagement Fee',
    paymentTiming: 'Engagement',
    due: '2025-08-25',
    amount: 500,
    status: 'Paid'
  },
  
  // Conditional Exchange of Contract
  {
    id: '2',
    engagement: 'Conditional Holding Deposit',
    paymentTiming: 'Conditional Exchange of Contract',
    due: '2025-10-25',
    amount: 8000,
    status: 'Outstanding'
  },
  {
    id: '3',
    engagement: 'Building & Landlord Insurance',
    paymentTiming: 'Conditional Exchange of Contract',
    due: '2025-10-25',
    amount: 1200,
    status: 'Outstanding'
  },
  {
    id: '4',
    engagement: 'Building & Pest Inspection',
    paymentTiming: 'Conditional Exchange of Contract',
    due: '2025-10-25',
    amount: 800,
    status: 'Outstanding'
  },
  {
    id: '5',
    engagement: 'Plumbing & Electrical Inspections',
    paymentTiming: 'Conditional Exchange of Contract',
    due: '2025-10-25',
    amount: 600,
    status: 'Outstanding'
  },
  {
    id: '6',
    engagement: 'Independent Property Valuation (optional)',
    paymentTiming: 'Conditional Exchange of Contract',
    due: '2025-10-25',
    amount: 0,
    status: 'Outstanding'
  },
  
  // Unconditional Exchange of Contract
  {
    id: '7',
    engagement: 'Unconditional Holding Deposit (if any)',
    paymentTiming: 'Unconditional Exchange of Contract',
    due: '2025-10-25',
    amount: 0,
    status: 'Outstanding'
  },
  
  // Settlement
  {
    id: '8',
    engagement: 'Deposit Balance Paid at:',
    paymentTiming: 'Settlement',
    due: '2025-11-13',
    amount: 72000,
    status: 'Outstanding'
  },
  {
    id: '9',
    engagement: 'Stamp Duty Estimate: (Check By Clicking here)',
    paymentTiming: 'Settlement',
    due: '2025-11-13',
    amount: 16330,
    status: 'Outstanding'
  },
  {
    id: '10',
    engagement: 'Lenders Mortgage Insurance',
    paymentTiming: 'Settlement',
    due: '2025-11-13',
    amount: 0,
    status: 'Outstanding'
  },
  {
    id: '11',
    engagement: 'Mortgage Fees Paid at:',
    paymentTiming: 'Settlement',
    due: '2025-11-13',
    amount: 750,
    status: 'Outstanding'
  },
  {
    id: '12',
    engagement: 'Conveyancing (Fees + Searches estimated Paid at:',
    paymentTiming: 'Settlement',
    due: '2025-11-13',
    amount: 1200,
    status: 'Outstanding'
  },
  {
    id: '13',
    engagement: 'Rates Adjustment - current period',
    paymentTiming: 'Settlement',
    due: '2025-11-13',
    amount: 2000,
    status: 'Outstanding'
  },
  {
    id: '14',
    engagement: 'Dadidot - Balance (if applicable)',
    paymentTiming: 'Settlement',
    due: '2025-11-13',
    amount: 0,
    status: 'Outstanding'
  },
  
  // Post Settlement
  {
    id: '15',
    engagement: 'Maintenance Allowance',
    paymentTiming: 'Post Settlement',
    due: '2025-12-25',
    amount: 2000,
    status: 'Outstanding'
  }
];

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

  // Navigation state
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [activeDrawerSection, setActiveDrawerSection] = useState<NavigationSectionId | null>(null);
  const [panelWidth, setPanelWidth] = useState(400);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Helper function for status accent colors
  const getStatusAccent = (status?: string) => {
    switch (status) {
      case 'modelling': return 'gray';
      case 'shortlisted': return 'yellow';
      case 'bought': return 'green';
      case 'sold': return 'blue';
      default: return 'gray';
    }
  };

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
      strategy: property.strategy || 'buy_hold',
      status: property.status || 'modelling'
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
    
    // Use consistent year calculation that works on both server and client
    const currentYear = mounted ? new Date().getFullYear() : 2025;
    const projections: YearlyProjection[] = [];
    
    // Use totalIncome/totalOutgoings if available, otherwise fall back to property data
    const currentRent = totalIncome || property?.annual_rent || 0;
    const currentExpenses = totalOutgoings || property?.annual_expenses || 0;
    const initialLoanBalance = aggregatedLoanData.totalPrincipal;
    const interestRate = loans.length > 0 ? loans[0].interest_rate / 100 : 0.05; // Default 5% if no rate
    const loanType = loans.length > 0 ? loans[0].type : 'principal_interest';
    const ioYears = loans.length > 0 ? (loans[0].io_years || 0) : 0;
    
    let previousLoanBalance = initialLoanBalance;

    for (let i = 0; i < 30; i++) {
      const year = currentYear + i;
      const yearIndex = i;
      
      // Apply growth rates
      const rentIncome = currentRent * Math.pow(1 + assumptions.rentGrowth / 100, i);
      const expenses = currentExpenses * Math.pow(1 + assumptions.inflationRate / 100, i);
      
      // === INDUSTRY-STANDARD LOAN AMORTIZATION ===
      // Pre-calculate PMT for different loan scenarios (done once, outside loop would be better)
      let monthlyPMT = 0;
      let piStartYear = 0;
      
      if (loanType === 'interest_only' && ioYears > 0 && ioYears < 30) {
        // IO→P&I: Calculate PMT for P&I period
        piStartYear = ioYears;
        const piYears = 30 - ioYears;
        const monthlyRate = interestRate / 12;
        const piMonths = piYears * 12;
        if (monthlyRate > 0 && piMonths > 0) {
          monthlyPMT = (initialLoanBalance * monthlyRate * Math.pow(1 + monthlyRate, piMonths)) / 
                      (Math.pow(1 + monthlyRate, piMonths) - 1);
        }
      } else if (loanType === 'principal_interest') {
        if (ioYears > 0) {
          // P&I with IO period
          piStartYear = ioYears;
          const piYears = 30 - ioYears;
          const monthlyRate = interestRate / 12;
          const piMonths = piYears * 12;
          if (monthlyRate > 0 && piMonths > 0) {
            monthlyPMT = (initialLoanBalance * monthlyRate * Math.pow(1 + monthlyRate, piMonths)) / 
                        (Math.pow(1 + monthlyRate, piMonths) - 1);
          }
        } else {
          // Standard P&I
          const monthlyRate = interestRate / 12;
          const totalMonths = 30 * 12;
          if (monthlyRate > 0) {
            monthlyPMT = (initialLoanBalance * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                        (Math.pow(1 + monthlyRate, totalMonths) - 1);
          }
        }
      }
      
      // Calculate this year's loan payments
      const openingBalance = yearIndex === 0 ? initialLoanBalance : previousLoanBalance;
      let interestPayment = 0;
      let principalPayment = 0;
      
      if (openingBalance > 0) {
        if (loanType === 'interest_only' && (ioYears === 0 || ioYears >= 30)) {
          // Pure Interest-Only: Balloon payment in final year
          interestPayment = openingBalance * interestRate;
          if (yearIndex === 29) { // Final year
            principalPayment = openingBalance;
          } else {
            principalPayment = 0;
          }
        } else if (yearIndex < piStartYear) {
          // Interest-Only period (for both IO→P&I and P&I with IO)
          interestPayment = openingBalance * interestRate;
          principalPayment = 0;
        } else {
          // Principal & Interest period - calculate month by month for accuracy
          if (yearIndex === 29) {
            // Final year: pay all remaining principal + interest for the year
            interestPayment = openingBalance * interestRate;
            principalPayment = openingBalance;
          } else {
            // Regular P&I year: use month-by-month calculation
            let yearInterest = 0;
            let yearPrincipal = 0;
            let monthlyBalance = openingBalance;
            const monthlyRate = interestRate / 12;
            
            for (let month = 0; month < 12; month++) {
              if (monthlyBalance <= 0) break;
              
              const monthlyInterest = monthlyBalance * monthlyRate;
              const monthlyPrincipalPmt = Math.min(monthlyPMT - monthlyInterest, monthlyBalance);
              
              yearInterest += monthlyInterest;
              yearPrincipal += Math.max(0, monthlyPrincipalPmt);
              monthlyBalance -= Math.max(0, monthlyPrincipalPmt);
            }
            
            interestPayment = yearInterest;
            principalPayment = yearPrincipal;
          }
        }
      }
      
      const closingBalance = Math.max(0, openingBalance - principalPayment);
      const totalLoanPayment = interestPayment + principalPayment;
      
      // Update for next iteration
      previousLoanBalance = closingBalance;
      
      // Tax calculation
      const grossIncome = rentIncome - expenses - totalLoanPayment;
      const taxLiability = grossIncome > 0 ? grossIncome * (assumptions.taxRate / 100) : 0;
      const netCashflow = grossIncome - taxLiability;
      
      // Property value growth
      const propertyValue = propertyData.currentValue * Math.pow(1 + assumptions.capitalGrowth / 100, i);
      
      const loanBalance = closingBalance;

      projections.push({
        year,
        rentIncome,
        expenses,
        loanPayment: totalLoanPayment,
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

  // Calculate milestones (client-side only to avoid hydration mismatch)
  const calculatedMilestones = useMemo(() => {
    if (typeof window === 'undefined') return []; // SSR fallback - no milestones on server
    
    if (!property?.annual_rent || property.annual_rent === 0) {
      return [];
    }

    const rentalIncome = property.annual_rent;
    const currentYear = mounted ? new Date().getFullYear() : 2025; // Consistent year calculation
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
      
      // FIXED LOGIC: Milestone is achieved ONLY if target is met by current year or earlier
      const achievedYear = achievedProjection ? achievedProjection.year : null;
      const isAchieved = achievedYear !== null && achievedYear <= currentYear;
      
      return {
        year: achievedYear || projections[projections.length - 1]?.year || 2054,
        label: target.label,
        achieved: isAchieved, // TRUE only if achieved by current year (2025)
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
          purchase_date: updatedPropertyData.purchaseDate,
          status: updatedPropertyData.status,
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

  // Navigation handlers
  const handleSectionSelect = useCallback((sectionId: NavigationSectionId) => {
    if (activeDrawerSection === sectionId) {
      // Clicking same section closes drawer
      setActiveDrawerSection(null);
    } else {
      // Clicking different section opens that section
      setActiveDrawerSection(sectionId);
    }
  }, [activeDrawerSection]);

  const handleDrawerClose = useCallback(() => {
    setActiveDrawerSection(null);
  }, []);

  const handleNavigationToggle = useCallback(() => {
    setIsNavigationCollapsed(!isNavigationCollapsed);
  }, [isNavigationCollapsed]);

  const handlePanelWidthChange = useCallback((width: number) => {
    setPanelWidth(width);
  }, []);

  // Property data handlers for drawer sections
  const handlePropertyDetailsChange = useCallback((updates: Partial<PropertyData>) => {
    if (property) {
      const updatedProperty = { 
        ...property, 
        name: updates.name || property.name,
        type: (updates.type as PropertyType) || property.type,
        address: updates.address || property.address,
        strategy: (updates.strategy as InvestmentStrategy) || property.strategy,
        status: (updates.status as PropertyStatus) || property.status
      };
      setProperty(updatedProperty);
      // Auto-save could go here
    }
  }, [property]);

  const handlePurchaseDataChange = useCallback((updates: any) => {
    if (property) {
      const updatedProperty = { ...property, ...updates };
      setProperty(updatedProperty);
      // Auto-save could go here  
    }
  }, [property]);

  // Callback for assumptions changes
  const handleAssumptionsChange = useCallback((newAssumptions: ModelingAssumptions) => {
    setAssumptions(newAssumptions);
  }, []);

  // Render drawer content based on active section
  const renderDrawerContent = useCallback(() => {
    if (!activeDrawerSection || !property) return null;

    switch (activeDrawerSection) {
      case 'property-details':
        return (
          <PropertyDetailsSection
            data={{
              id: property.id,
              name: property.name || '',
              type: property.type || '',
              address: property.address || '',
              strategy: property.strategy || '',
              status: property.status
            }}
            onChange={handlePropertyDetailsChange}
          />
        );
      
      case 'the-purchase':
        return (
          <PurchaseSection
            data={{
              inputs: {
                // A.1 Core property & buyer
                propertyAddress: property.address || '',
                state: '',
                purchasers: '',
                
                // A.2 Price, valuation, rent, units
                purchasePrice: property.purchase_price || 0,
                valuationAtPurchase: property.current_value || property.purchase_price || 0,
                rentPerWeek: (property.annual_rent || 0) / 52,
                numberOfUnits: 1,
                
                // A.3 Dates & durations
                engagementDate: new Date().toISOString().split('T')[0],
                contractDate: property.purchase_date || '',
                daysToUnconditional: 14,
                daysForSettlement: 42,
                
                // A.4 Lending parameters
                lvr: loans && loans.length > 0 && property.purchase_price > 0
                  ? (loans[0].principal_amount / property.purchase_price)
                  : 0.80,
                loanProduct: loans && loans.length > 0 && loans[0].type === 'interest_only' ? 'I/O' : 'P&I',
                interestRate: loans && loans.length > 0 ? loans[0].interest_rate / 100 : 0.065,
                loanTermYears: loans && loans.length > 0 ? loans[0].term_years : 30,
                loanPreApproval: 0,
                
                // A.5 Cash position
                fundsAvailable: 0,
                
                // B.0 Purchase Summary percentages
                depositPaidAtConditional: 0.05,
                depositPaidAtUnconditional: 0.05,
              },
              paymentItems: [] // Will be initialized with defaults in the component
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
  }, [activeDrawerSection, property, loans, assumptions, propertyId, handlePropertyDetailsChange, handlePurchaseDataChange, handleLoansChange, handleAssumptionsChange, handleIncomeChange, handleOutgoingsChange]);

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
                <a href="#" className="text-[#111827] font-medium">Model Property</a>
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

      <main className="h-[calc(100vh-80px)]">

        {/* Full Height Layout with Navigation Panel */}
        <div className="flex h-full relative">
          {/* Left Navigation Panel */}
          <NavigationPanel
            isCollapsed={isNavigationCollapsed}
            activeSection={activeDrawerSection}
            onSectionSelect={handleSectionSelect}
            onToggleCollapse={handleNavigationToggle}
            validationErrors={validationErrors}
          />

          {/* Main Content Area */}
          <div 
            className="flex-1 overflow-y-auto transition-all duration-300"
            style={{ 
              marginRight: activeDrawerSection ? `${panelWidth}px` : '0px'
            }}
          >
            <div className="p-6 space-y-6">
            {/* KPI Cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard 
                label="Property Status" 
                value={propertyData.status ? propertyData.status.charAt(0).toUpperCase() + propertyData.status.slice(1) : 'Modelling'}
                accent={getStatusAccent(propertyData.status)}
                helper="Current property status"
              />
              <MetricCard 
                label="Break-even Year" 
                value={`${breakEvenYear}`}
                accent="blue"
                helper={`${breakEvenYear - 2024} years to positive cashflow`}
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

            {/* Visual Projections */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <VisualProjections projections={projections} breakEvenYear={breakEvenYear} loans={loans} />
            </section>

            {/* Detailed Projections - Moved below Cashflow Chart */}
            <DetailedProjections 
              propertyValue={propertyData.currentValue}
              totalIncome={totalIncome || property?.annual_rent || 0}
              totalOutgoings={totalOutgoings || property?.annual_expenses || 0}
              loanAmount={aggregatedLoanData.totalPrincipal}
              interestRate={loans.length > 0 ? loans[0].interest_rate : 0}
              loanType={loans.length > 0 ? loans[0].type : 'principal_interest'}
              ioYears={loans.length > 0 ? (loans[0].io_years || 0) : 0}
              assumptions={assumptions}
              totalCashInvested={propertyData.currentValue - aggregatedLoanData.totalPrincipal}
            />

            {/* Milestones Timeline - Horizontal Mode */}
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Key Milestones</h2>
              <MilestonesTimeline milestones={calculatedMilestones} />
            </section>
          </div>
        </div>
          {/* Right Panel - Positioned absolutely to slide from navigation */}
          <div className="absolute top-0 right-0 h-full">
            <RightPanel
              isOpen={!!activeDrawerSection}
              activeSection={activeDrawerSection}
              width={panelWidth}
              onClose={handleDrawerClose}
              onWidthChange={handlePanelWidthChange}
            >
              {renderDrawerContent()}
            </RightPanel>
          </div>
        </div>
      </main>
    </div>
  );
}

// Visual Projections Component with Chart Toggle
function VisualProjections({ projections, breakEvenYear, loans }: { projections: YearlyProjection[]; breakEvenYear: number; loans: any[] }) {
  const [activeChart, setActiveChart] = useState<'cashflow' | 'performance' | 'loans'>('cashflow');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Visual Projections</h2>
        
        {/* Chart Toggle */}
        <div className="flex rounded-lg border border-[#e5e7eb] p-1">
          <button
            onClick={() => setActiveChart('cashflow')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              activeChart === 'cashflow'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-[#6b7280] hover:text-[#374151]'
            }`}
          >
            Cashflow
          </button>
          <button
            onClick={() => setActiveChart('performance')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              activeChart === 'performance'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-[#6b7280] hover:text-[#374151]'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveChart('loans')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              activeChart === 'loans'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-[#6b7280] hover:text-[#374151]'
            }`}
          >
            Loan Analysis
          </button>
        </div>
      </div>

      {/* Chart Content */}
      {activeChart === 'cashflow' && (
        <CashflowBarChart projections={projections} breakEvenYear={breakEvenYear} />
      )}
      {activeChart === 'performance' && (
        <PerformanceChart projections={projections} />
      )}
      {activeChart === 'loans' && (
        <LoanAnalysisChart projections={projections} loans={loans} />
      )}

      {/* Collapsible Data Section */}
      <CollapsibleSection title="Chart Data" defaultExpanded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-700">Year</th>
                {activeChart === 'cashflow' && (
                  <>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">Net Cashflow</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">Cumulative Cashflow</th>
                  </>
                )}
                {activeChart === 'performance' && (
                  <>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">Property Value</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">Return on Invested Capital (%)</th>
                  </>
                )}
                {activeChart === 'loans' && (
                  <>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">Remaining Principal</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">Interest Balance</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {projections.slice(0, 30).map((projection, index) => {
                // Calculate values based on active chart
                const roic = projection.propertyValue > 0 
                  ? ((projection.cumulativeCashflow + (projection.propertyValue - (projections[0]?.propertyValue || 0))) / (projections[0]?.propertyValue || 1)) * 100 
                  : 0;

                // Calculate loan analysis data using same logic as chart
                const originalLoanAmount = projections[0]?.loanBalance || 0;
                const loanType = loans.length > 0 ? loans[0].type : 'principal_interest';
                const ioYears = loans.length > 0 ? (loans[0].io_years || 0) : 0;
                const annualRate = loans.length > 0 ? (loans[0].interest_rate / 100) : 0.05;
                
                // Pre-calculate PMT for P&I period (matching chart logic)
                let monthlyPMT = 0;
                let piStartYear = 0;
                
                if (loanType === 'interest_only' && ioYears > 0 && ioYears < 30) {
                  piStartYear = ioYears;
                  const piYears = 30 - ioYears;
                  const monthlyRate = annualRate / 12;
                  const piMonths = piYears * 12;
                  if (monthlyRate > 0 && piMonths > 0) {
                    monthlyPMT = (originalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, piMonths)) / 
                                (Math.pow(1 + monthlyRate, piMonths) - 1);
                  }
                } else if (loanType === 'principal_interest') {
                  if (ioYears > 0) {
                    piStartYear = ioYears;
                    const piYears = 30 - ioYears;
                    const monthlyRate = annualRate / 12;
                    const piMonths = piYears * 12;
                    if (monthlyRate > 0 && piMonths > 0) {
                      monthlyPMT = (originalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, piMonths)) / 
                                  (Math.pow(1 + monthlyRate, piMonths) - 1);
                    }
                  } else {
                    const monthlyRate = annualRate / 12;
                    const totalMonths = 30 * 12;
                    if (monthlyRate > 0) {
                      monthlyPMT = (originalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                                  (Math.pow(1 + monthlyRate, totalMonths) - 1);
                    }
                  }
                }
                
                // Calculate remaining interest balance correctly
                let remainingInterestBalance = 0;
                const yearIndex = index;
                
                if (loanType === 'interest_only' && (ioYears === 0 || ioYears >= 29)) {
                  // Pure Interest-Only or Nearly Pure Interest-Only (29+ year IO)
                  if (yearIndex < 29) {
                    remainingInterestBalance = originalLoanAmount * annualRate * (30 - yearIndex);
                  } else {
                    // Final year: only the current year's interest remains
                    remainingInterestBalance = originalLoanAmount * annualRate;
                  }
                } else if (yearIndex < piStartYear) {
                  // Interest-Only period
                  const remainingIOYears = piStartYear - yearIndex;
                  const ioInterestRemaining = remainingIOYears * (originalLoanAmount * annualRate);
                  
                  const piYears = 30 - piStartYear;
                  const totalPIPayments = monthlyPMT * 12 * piYears;
                  const piInterestEstimate = totalPIPayments - originalLoanAmount;
                  
                  remainingInterestBalance = ioInterestRemaining + piInterestEstimate;
                } else {
                  // P&I period
                  const remainingPIYears = 30 - yearIndex;
                  const totalRemainingPayments = monthlyPMT * 12 * remainingPIYears;
                  remainingInterestBalance = Math.max(0, totalRemainingPayments - (projection.loanBalance || 0));
                }
                remainingInterestBalance = Math.max(0, remainingInterestBalance);

                return (
                  <tr key={projection.year} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{projection.year}</td>
                    {activeChart === 'cashflow' && (
                      <>
                        <td className="py-2 px-3 text-right">
                          <span className={projection.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(projection.netCashflow)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className={projection.cumulativeCashflow >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(projection.cumulativeCashflow)}
                          </span>
                        </td>
                      </>
                    )}
                    {activeChart === 'performance' && (
                      <>
                        <td className="py-2 px-3 text-right text-blue-600">
                          {formatCurrency(projection.propertyValue, true)}
                        </td>
                        <td className="py-2 px-3 text-right text-green-600">
                          {roic.toFixed(2)}%
                        </td>
                      </>
                    )}
                    {activeChart === 'loans' && (
                      <>
                        <td className="py-2 px-3 text-right text-blue-600">
                          {formatCurrency(projection.loanBalance, true)}
                        </td>
                        <td className="py-2 px-3 text-right text-orange-600">
                          {formatCurrency(remainingInterestBalance, true)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}

// Performance Chart Component (Property Value Bars + ROIC Line)
function PerformanceChart({ projections }: { projections: YearlyProjection[] }) {
  // Ensure we have data to display
  if (!projections || projections.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#6b7280] border border-[#e5e7eb] rounded-lg">
        <p>No projection data available</p>
      </div>
    );
  }

  // Get first 30 years of data and calculate performance metrics
  const chartData = projections.slice(0, 30).map((projection, index) => {
    // Calculate Return on Invested Capital (total return / initial cash invested)
    const propertyGrowth = projection.propertyValue - projections[0].propertyValue;
    const cumulativeCashflow = projection.cumulativeCashflow;
    const totalPerformance = propertyGrowth + cumulativeCashflow;
    const initialCashInvested = projections[0].propertyValue - projections[0].loanBalance;
    const roic = initialCashInvested > 0 ? (totalPerformance / initialCashInvested) * 100 : 0;
    
    return {
      year: projection.year,
      propertyValue: projection.propertyValue,
      roic
    };
  });

  // Separate scaling for property values (bars) and ROIC (line)
  const propertyValues = chartData.map(d => d.propertyValue);
  const roicValues = chartData.map(d => d.roic);
  
  const maxPropertyValue = Math.max(...propertyValues, 0);
  const minPropertyValue = Math.min(...propertyValues, 0);
  const propertyRange = maxPropertyValue - minPropertyValue;
  
  const maxROIC = Math.max(...roicValues, 0);
  const minROIC = Math.min(...roicValues, 0);
  const roicRange = maxROIC - minROIC;
  
  const chartHeight = 300;
  const barWidth = 800 / chartData.length * 0.6; // 60% of available space for bars

  // Helper functions to calculate Y position for different scales with bounds checking
  const getPropertyYPosition = (value: number) => {
    if (propertyRange === 0) return chartHeight / 2;
    const position = chartHeight - ((value - minPropertyValue) / propertyRange) * chartHeight;
    return Math.max(0, Math.min(chartHeight, position)); // Clamp between 0 and chartHeight
  };

  const getROICYPosition = (value: number) => {
    if (roicRange === 0) return chartHeight / 2;
    const position = chartHeight - ((value - minROIC) / roicRange) * chartHeight;
    return Math.max(0, Math.min(chartHeight, position)); // Clamp between 0 and chartHeight
  };

  // Create SVG path for ROIC line
  const createROICPath = () => {
    if (chartData.length === 0) return '';
    
    const stepX = 800 / Math.max(chartData.length - 1, 1);
    let path = `M 0 ${getROICYPosition(chartData[0].roic)}`;
    
    for (let i = 1; i < chartData.length; i++) {
      path += ` L ${i * stepX} ${getROICYPosition(chartData[i].roic)}`;
    }
    
    return path;
  };

  const roicPath = createROICPath();

    return (
      <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Property Value</span>
          <span className="text-xs text-blue-600 font-medium">(Left Axis)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Return on Invested Capital (%)</span>
          <span className="text-xs text-green-600 font-medium">(Right Axis)</span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <div className="relative" style={{ height: `${chartHeight + 60}px`, marginLeft: '80px', marginRight: '80px' }}>
          <svg
            width="100%"
            height={chartHeight + 40}
            viewBox={`0 0 800 ${chartHeight + 40}`}
            className="overflow-visible"
          >
            {/* Grid lines */}
            <defs>
              <pattern id="propertyGrid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="800" height={chartHeight} fill="url(#propertyGrid)" />
            
            {/* Property Value Bars */}
            {chartData.map((data, index) => {
              const x = (index / Math.max(chartData.length - 1, 1)) * 800;
              const barHeight = Math.max(chartHeight - getPropertyYPosition(data.propertyValue), 3);
              const barY = getPropertyYPosition(data.propertyValue);
              
              return (
                <g key={`bar-${data.year}`}>
                  <rect
                    x={x - barWidth / 2}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill="#3b82f6"
                    opacity="0.7"
                    className="hover:opacity-1 transition-opacity cursor-pointer"
                  />
                  {/* Hover tooltip for bars */}
                  <title>{`${data.year}: ${formatCurrency(data.propertyValue, true)}`}</title>
                </g>
              );
            })}
            
            {/* ROIC Line */}
            <path
              d={roicPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* ROIC Data points */}
            {chartData.map((data, index) => {
              const x = (index / Math.max(chartData.length - 1, 1)) * 800;
              return (
                <g key={`point-${data.year}`}>
                  <circle cx={x} cy={getROICYPosition(data.roic)} r="4" fill="#10b981" />
                  {/* Hover tooltip for points */}
                  <title>{`${data.year}: ${data.roic.toFixed(1)}%`}</title>
                </g>
              );
            })}
            
            {/* X-axis labels */}
            {chartData.filter((_, index) => index % 5 === 0 || index === chartData.length - 1).map((data, index, filtered) => {
              const originalIndex = chartData.findIndex(d => d.year === data.year);
              const x = (originalIndex / Math.max(chartData.length - 1, 1)) * 800;
              return (
                <text
                  key={data.year}
                  x={x}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {data.year}
                </text>
              );
            })}
          </svg>
          
          {/* Left Y-axis labels (Property Values) */}
          <div className="absolute -left-20 top-0 bottom-0 flex flex-col justify-between text-xs text-blue-600 w-16">
            <div className="text-right pr-2 font-medium">{formatCurrency(maxPropertyValue, true)}</div>
            <div className="text-right pr-2">{formatCurrency(maxPropertyValue * 0.75, true)}</div>
            <div className="text-right pr-2">{formatCurrency(maxPropertyValue * 0.5, true)}</div>
            <div className="text-right pr-2">{formatCurrency(maxPropertyValue * 0.25, true)}</div>
            <div className="text-right pr-2">{formatCurrency(minPropertyValue, true)}</div>
          </div>

          {/* Right Y-axis labels (ROIC Percentages) */}
          <div className="absolute -right-20 top-0 bottom-0 flex flex-col justify-between text-xs text-green-600 w-16">
            <div className="text-left pl-2 font-medium">{maxROIC.toFixed(1)}%</div>
            <div className="text-left pl-2">{(maxROIC * 0.75).toFixed(1)}%</div>
            <div className="text-left pl-2">{(maxROIC * 0.5).toFixed(1)}%</div>
            <div className="text-left pl-2">{(maxROIC * 0.25).toFixed(1)}%</div>
            <div className="text-left pl-2">{minROIC.toFixed(1)}%</div>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      <div className="text-center text-sm text-[#6b7280]">
        Property value growth with return on invested capital over 30 years
      </div>
    </div>
  );
}

// Loan Analysis Chart Component (Stacked Bars: Principal vs Interest)
function LoanAnalysisChart({ projections, loans }: { projections: YearlyProjection[]; loans: any[] }) {
  // Ensure we have data to display
  if (!projections || projections.length === 0) {
    return (
        <div className="flex items-center justify-center h-64 text-[#6b7280] border border-[#e5e7eb] rounded-lg">
          <p>No projection data available</p>
        </div>
    );
  }

  // Get loan parameters for proper calculation
  const originalLoanAmount = projections[0]?.loanBalance || 0;
  const loanType = loans.length > 0 ? loans[0].type : 'principal_interest';
  const ioYears = loans.length > 0 ? (loans[0].io_years || 0) : 0;
  const annualRate = loans.length > 0 ? (loans[0].interest_rate / 100) : 0.05;
  
  // Pre-calculate PMT for P&I period (if applicable)
  let monthlyPMT = 0;
  let piStartYear = 0;
  
  if (loanType === 'interest_only' && ioYears > 0 && ioYears < 30) {
    // IO→P&I: Calculate PMT for P&I period
    piStartYear = ioYears;
    const piYears = 30 - ioYears;
    const monthlyRate = annualRate / 12;
    const piMonths = piYears * 12;
    if (monthlyRate > 0 && piMonths > 0) {
      monthlyPMT = (originalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, piMonths)) / 
                  (Math.pow(1 + monthlyRate, piMonths) - 1);
    }
  } else if (loanType === 'principal_interest') {
    if (ioYears > 0) {
      // P&I with IO period
      piStartYear = ioYears;
      const piYears = 30 - ioYears;
      const monthlyRate = annualRate / 12;
      const piMonths = piYears * 12;
      if (monthlyRate > 0 && piMonths > 0) {
        monthlyPMT = (originalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, piMonths)) / 
                    (Math.pow(1 + monthlyRate, piMonths) - 1);
      }
    } else {
      // Standard P&I
      const monthlyRate = annualRate / 12;
      const totalMonths = 30 * 12;
      if (monthlyRate > 0) {
        monthlyPMT = (originalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                    (Math.pow(1 + monthlyRate, totalMonths) - 1);
      }
    }
  }
  
  const chartData = projections.slice(0, 30).map((projection, index) => {
    const principalBalance = projection.loanBalance || 0;
    
    // Calculate remaining interest balance correctly based on loan type
    let remainingInterestBalance = 0;
    const yearIndex = index;
    
    if (loanType === 'interest_only' && (ioYears === 0 || ioYears >= 29)) {
      // Pure Interest-Only or Nearly Pure Interest-Only (29+ year IO)
      if (yearIndex < 29) {
        remainingInterestBalance = originalLoanAmount * annualRate * (30 - yearIndex);
      } else {
        // Final year: only the current year's interest remains
        remainingInterestBalance = originalLoanAmount * annualRate;
      }
    } else if (yearIndex < piStartYear) {
      // Interest-Only period: Remaining interest = IO interest for remaining IO years + P&I interest
      const remainingIOYears = piStartYear - yearIndex;
      const ioInterestRemaining = remainingIOYears * (originalLoanAmount * annualRate);
      
      // Estimate total P&I interest (total payments - principal)
      const piYears = 30 - piStartYear;
      const totalPIPayments = monthlyPMT * 12 * piYears;
      const piInterestEstimate = totalPIPayments - originalLoanAmount;
      
      remainingInterestBalance = ioInterestRemaining + piInterestEstimate;
    } else {
      // P&I period: Remaining interest = interest in remaining P&I payments
      const remainingPIYears = 30 - yearIndex;
      const totalRemainingPayments = monthlyPMT * 12 * remainingPIYears;
      remainingInterestBalance = Math.max(0, totalRemainingPayments - principalBalance);
    }
    
    return {
      year: projection.year,
      principalBalance: principalBalance,
      interestBalance: Math.max(0, remainingInterestBalance),
      totalLoan: originalLoanAmount
    };
  });

  // Calculate proper max values for dynamic scaling (sum of stacked values)
  const maxStackedValue = Math.max(...chartData.map(d => d.principalBalance + d.interestBalance), 1); // Ensure minimum of 1 to avoid division by zero
  
  const chartHeight = 300;
  const barWidth = 800 / chartData.length * 0.8; // 80% of available space for bars

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Remaining Principal Balance</span>
      </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Loan Interest Balance</span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <div className="relative" style={{ height: `${chartHeight + 60}px`, marginLeft: '80px', marginRight: '80px' }}>
          <svg
            width="100%"
            height={chartHeight + 40}
            viewBox={`0 0 800 ${chartHeight + 40}`}
            className="overflow-visible"
          >
            {/* Grid lines */}
            <defs>
              <pattern id="loanGrid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="800" height={chartHeight} fill="url(#loanGrid)" />
            
            {/* Stacked Bars */}
            {chartData.map((data, index) => {
              const x = (index / Math.max(chartData.length - 1, 1)) * 800;
              
              // Calculate bar heights as percentages of chart height with proper stacked scaling
              const interestHeight = maxStackedValue > 0 ? (data.interestBalance / maxStackedValue) * chartHeight : 0;
              const principalHeight = maxStackedValue > 0 ? (data.principalBalance / maxStackedValue) * chartHeight : 0;
              
              return (
                <g key={`loan-${data.year}`}>
                  {/* Loan Interest Balance bar (bottom) */}
                  <rect
                    x={x - barWidth / 2}
                    y={chartHeight - interestHeight}
                    width={barWidth}
                    height={interestHeight}
                    fill="#f97316"
                    opacity="0.8"
                    className="hover:opacity-1 transition-opacity cursor-pointer"
                  >
                    <title>{`${data.year} Remaining Interest Balance: ${formatCurrency(data.interestBalance, true)}`}</title>
                  </rect>
                  
                  {/* Remaining Principal Balance bar (top) */}
                  <rect
                    x={x - barWidth / 2}
                    y={chartHeight - interestHeight - principalHeight}
                    width={barWidth}
                    height={principalHeight}
                    fill="#3b82f6"
                    opacity="0.8"
                    className="hover:opacity-1 transition-opacity cursor-pointer"
                  >
                    <title>{`${data.year} Remaining Principal: ${formatCurrency(data.principalBalance, true)}`}</title>
                  </rect>
                </g>
              );
            })}
            
            {/* X-axis labels */}
            {chartData.filter((_, index) => index % 5 === 0 || index === chartData.length - 1).map((data, index, filtered) => {
              const originalIndex = chartData.findIndex(d => d.year === data.year);
              const x = (originalIndex / Math.max(chartData.length - 1, 1)) * 800;
              return (
                <text
                  key={data.year}
                  x={x}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {data.year}
                </text>
              );
            })}
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute -left-20 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 w-16">
            <div className="text-right pr-2">{formatCurrency(maxStackedValue, true)}</div>
            <div className="text-right pr-2">{formatCurrency(maxStackedValue * 0.75, true)}</div>
            <div className="text-right pr-2">{formatCurrency(maxStackedValue * 0.5, true)}</div>
            <div className="text-right pr-2">{formatCurrency(maxStackedValue * 0.25, true)}</div>
            <div className="text-right pr-2">$0</div>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      <div className="text-center text-sm text-[#6b7280]">
        {loans.length > 0 && loans[0].type === 'interest_only' 
          ? (loans[0].io_years && loans[0].io_years > 0 && loans[0].io_years < 30
              ? `IO→P&I loan analysis: interest-only for ${loans[0].io_years} years, then principal & interest payments`
              : "Interest-Only loan analysis: principal balance remains constant until final year, interest balance decreases as interest is paid")
          : "Loan analysis: remaining principal balance and interest balance both decrease as loan is paid down over 30 years"
        }
      </div>
    </div>
  );
}

// Keep the existing helper components that are still needed
function CashflowBarChart({ projections, breakEvenYear, height = 300 }: { projections: YearlyProjection[]; breakEvenYear: number; height?: number }) {
  // Ensure we have data to display
  if (!projections || projections.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#6b7280] border border-[#e5e7eb] rounded-lg">
        <p>No projection data available</p>
      </div>
    );
  }

  // Get all 30 years of data
  const chartData = projections.slice(0, 30);
  const maxCashflow = Math.max(...chartData.map(p => Math.abs(p.netCashflow)));
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
            <div className="text-right pr-2">{formatCurrency(maxCashflow)}</div>
            <div className="text-right pr-2">{formatCurrency(maxCashflow * 0.75)}</div>
            <div className="text-right pr-2">{formatCurrency(maxCashflow * 0.5)}</div>
            <div className="text-right pr-2">{formatCurrency(maxCashflow * 0.25)}</div>
            <div className="text-right pr-2">$0</div>
            <div className="text-right pr-2">-{formatCurrency(maxCashflow * 0.25).substring(1)}</div>
            <div className="text-right pr-2">-{formatCurrency(maxCashflow * 0.5).substring(1)}</div>
            <div className="text-right pr-2">-{formatCurrency(maxCashflow * 0.75).substring(1)}</div>
            <div className="text-right pr-2">-{formatCurrency(maxCashflow).substring(1)}</div>
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
                  <div>{formatCurrency(cashflow, true)}</div>
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
    </div>
  );
}

function MilestonesTimeline({ milestones }: { milestones: Milestone[] }) {
  // Show loading state during SSR and initial client render
  if (typeof window === 'undefined' || !milestones || milestones.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Financial Milestones
        </h3>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">
            {typeof window === 'undefined' ? 'Loading milestones...' : 'No milestones available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Vertical Timeline - Always shown for all screen sizes */}
      <div className="space-y-4">
          {milestones.map((milestone, index) => (
          <div key={index} className="relative flex items-start space-x-4">
            {/* Vertical timeline line - only show if not the last item */}
            {index < milestones.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
            )}
            
            {/* Milestone node */}
            <div className="flex-shrink-0">
              <div 
                className={`w-12 h-12 rounded-full border-2 shadow-md flex items-center justify-center relative z-10 transition-colors duration-200 ${
                  milestone.achieved 
                    ? 'bg-green-500 border-green-600' 
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                {milestone.achieved ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                )}
              </div>
            </div>
            
            {/* Milestone content */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-900 leading-tight">
                  {milestone.label}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Target Year: {milestone.year}
                  </p>
                  {milestone.achieved && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Achieved
                </div>
                  )}
                </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function PropertyInfoDisplay({ property }: { property: PropertyData }) {
  const formatDate = (dateString: string) => {
    if (typeof window === 'undefined') return dateString; // SSR fallback
    try {
      // Simple, consistent date formatting that works the same on server and client
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day}/${year}`;
    } catch (error) {
      return dateString; // Fallback to original string if parsing fails
    }
  };



  return (
    <div className="space-y-2">
      <div>
        <h3 className="font-medium text-[#111827] text-base">{property.name}</h3>
        <p className="text-sm text-[#6b7280] mt-1">{property.address}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-xs font-medium text-[#6b7280]">Purchase Price</label>
          <p className="text-sm font-medium text-[#111827]">{formatCurrency(property.purchasePrice)}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b7280]">Current Value</label>
          <p className="text-sm font-medium text-[#111827]">{formatCurrency(property.currentValue)}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b7280]">Purchase Date</label>
          <p className="text-sm font-medium text-[#111827]">{formatDate(property.purchaseDate)}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b7280]">Property Type</label>
          <p className="text-sm font-medium text-[#111827]">{property.type}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b7280]">Status</label>
          <p className="text-sm font-medium text-[#111827] capitalize">{property.status || 'modelling'}</p>
        </div>
      </div>
    </div>
  );
}



function MetricCard({ label, value, accent, helper }: { label: string; value: string; accent: string; helper: string }) {
  const accentClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50', 
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50',
    gray: 'border-gray-200 bg-gray-50',
    yellow: 'border-yellow-200 bg-yellow-50'
  };

  return (
    <div className={`rounded-xl border p-4 ${accentClasses[accent as keyof typeof accentClasses] || 'border-gray-200 bg-gray-50'}`}>
      <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-[#111827] mt-1">{value}</div>
      <div className="text-xs text-[#6b7280] mt-1">{helper}</div>
    </div>
  );
}

// Purchase Costs Component
function PurchaseCosts({ mounted }: { mounted: boolean }) {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>(DEFAULT_PURCHASE_ITEMS);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Calculate KPIs
  const totalRemaining = useMemo(() => {
    return purchaseItems
      .filter(item => item.status === 'Outstanding')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [purchaseItems]);

  const totalCashRequired = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + item.amount, 0);
  }, [purchaseItems]);

  const handleItemChange = (id: string, field: keyof PurchaseItem, value: string | number) => {
    setPurchaseItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, [field]: field === 'amount' ? Number(value) : value }
        : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddCustomItem = (paymentTiming: string) => {
    // Generate consistent ID using a simple counter approach
    const timestamp = mounted ? Date.now() : 0;
    const randomId = mounted ? Math.random().toString(36).substr(2, 9) : 'temp';
    const todayDate = mounted ? new Date().toISOString().split('T')[0] : '2025-01-01';
    
    const newItem: PurchaseItem = {
      id: `custom-${timestamp}-${randomId}`,
      engagement: 'New Cost Item',
      paymentTiming,
      due: todayDate,
      amount: 0,
      status: 'Outstanding',
      isCustom: true
    };
    setPurchaseItems(prev => [...prev, newItem]);
  };

  const toggleSection = (paymentTiming: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [paymentTiming]: !prev[paymentTiming]
    }));
  };

  // Group items by payment timing with preserved order
  const groupedItems = useMemo(() => {
    const paymentTimingOrder = [
      'Engagement',
      'Conditional Exchange of Contract',
      'Unconditional Exchange of Contract',
      'Settlement',
      'Post Settlement'
    ];
    
    const groups: Record<string, PurchaseItem[]> = {};
    
    // Initialize groups in order
    paymentTimingOrder.forEach(timing => {
      groups[timing] = [];
    });
    
    // Populate groups
    purchaseItems.forEach(item => {
      if (!groups[item.paymentTiming]) {
        groups[item.paymentTiming] = [];
      }
      groups[item.paymentTiming].push(item);
    });
    
    // Filter out empty groups
    const filteredGroups: Record<string, PurchaseItem[]> = {};
    Object.entries(groups).forEach(([timing, items]) => {
      if (items.length > 0) {
        filteredGroups[timing] = items;
      }
    });
    
    return filteredGroups;
  }, [purchaseItems]);

  return (
    <div className="space-y-6">
      {/* KPI Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="text-sm font-medium text-red-700 uppercase tracking-wide">
            Total Remaining to Settle
          </div>
          <div className="text-2xl font-bold text-red-800 mt-1">
            {formatCurrency(totalRemaining, true)}
          </div>
          <div className="text-xs text-red-600 mt-1">
            Outstanding payments
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="text-sm font-medium text-blue-700 uppercase tracking-wide">
            Total Cash Required for Deal
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1">
            {formatCurrency(totalCashRequired, true)}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            All purchase costs
          </div>
        </div>
      </div>

      {/* Purchase Items by Group - Mobile-First Responsive Design */}
      <div className="space-y-4">
        {Object.entries(groupedItems).map(([paymentTiming, items]) => {
          const isCollapsed = collapsedSections[paymentTiming];
          
          return (
            <div key={paymentTiming} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Collapsible Group Header - Mobile Optimized */}
              <button
                onClick={() => toggleSection(paymentTiming)}
                className="w-full bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors min-h-[64px]"
              >
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 text-left leading-tight">
                  {paymentTiming}
                </h3>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm text-gray-500">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm sm:text-base font-medium text-gray-700">
                      {formatCurrency(items.reduce((sum, item) => sum + item.amount, 0), true)}
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transform transition-transform flex-shrink-0 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {/* Items - Responsive Layout */}
              {!isCollapsed && (
                <div>
                  {/* Desktop Table View - Hidden on Mobile */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                          Cost Item
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                          Due Date
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                          Amount
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                            {item.isCustom ? (
                                <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={item.engagement}
                                  onChange={(e) => handleItemChange(item.id, 'engagement', e.target.value)}
                                    className="text-sm font-medium text-gray-900 border border-gray-300 rounded-md px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Enter cost item name"
                                />
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                    className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                                  title="Delete custom item"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                              </div>
                            ) : (
                                <div className="text-sm font-medium text-gray-900">
                                {item.engagement}
                              </div>
                            )}
                          </td>
                            <td className="px-4 py-3">
                            <input
                              type="date"
                              value={item.due}
                              onChange={(e) => handleItemChange(item.id, 'due', e.target.value)}
                                className="text-sm border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                            <td className="px-4 py-3">
                            <div className="flex items-center">
                                <span className="text-sm text-gray-500 mr-2 flex-shrink-0">$</span>
                              <input
                                type="number"
                                value={item.amount || ''}
                                onChange={(e) => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                  className="text-sm border border-gray-300 rounded-md px-3 py-2 flex-1 min-w-0 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </td>
                            <td className="px-4 py-3">
                            <select
                              value={item.status}
                              onChange={(e) => handleItemChange(item.id, 'status', e.target.value as 'Paid' | 'Outstanding')}
                                className={`text-sm border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                item.status === 'Paid' 
                                  ? 'bg-green-50 border-green-300 text-green-800' 
                                  : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                              }`}
                            >
                              <option value="Outstanding">Outstanding</option>
                              <option value="Paid">Paid</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>

                  {/* Mobile Card View - Shown only on Mobile */}
                  <div className="md:hidden divide-y divide-gray-200">
                    {items.map((item) => (
                      <div key={item.id} className="p-4 space-y-4 bg-white hover:bg-gray-50 transition-colors">
                        {/* Cost Item Name */}
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Cost Item
                          </label>
                          {item.isCustom ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item.engagement}
                                onChange={(e) => handleItemChange(item.id, 'engagement', e.target.value)}
                                className="text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-4 py-3 flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                                placeholder="Enter cost item name"
                              />
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Delete custom item"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-gray-900 py-2">
                              {item.engagement}
                            </div>
                          )}
                        </div>

                        {/* Mobile Grid for Amount and Status */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Amount
                            </label>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500 mr-2 flex-shrink-0">$</span>
                              <input
                                type="number"
                                value={item.amount || ''}
                                onChange={(e) => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="text-sm border border-gray-300 rounded-lg px-4 py-3 flex-1 min-w-0 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Status
                            </label>
                            <select
                              value={item.status}
                              onChange={(e) => handleItemChange(item.id, 'status', e.target.value as 'Paid' | 'Outstanding')}
                              className={`text-sm border rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] ${
                                item.status === 'Paid' 
                                  ? 'bg-green-50 border-green-300 text-green-800' 
                                  : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                              }`}
                            >
                              <option value="Outstanding">Outstanding</option>
                              <option value="Paid">Paid</option>
                            </select>
                          </div>
                        </div>

                        {/* Due Date - Full Width on Mobile */}
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={item.due}
                            onChange={(e) => handleItemChange(item.id, 'due', e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add Custom Item Button - Mobile Optimized */}
                  <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => handleAddCustomItem(paymentTiming)}
                      className="inline-flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-3 rounded-lg transition-colors min-h-[44px]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Other Cost
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Property Edit Form Component
function PropertyEditForm({ property, onSave, onCancel }: { property: PropertyData; onSave: (data: PropertyData) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<PropertyData>({
    id: property.id,
    name: property.name || '',
    type: property.type || 'residential_house',
    address: property.address || '',
    purchasePrice: property.purchasePrice || 0,
    currentValue: property.currentValue || 0,
    purchaseDate: property.purchaseDate || '',
    strategy: property.strategy || 'buy_hold',
    status: property.status || 'modelling'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: keyof PropertyData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const propertyTypes = [
    { value: 'residential_house', label: 'Residential House' },
    { value: 'residential_unit', label: 'Residential Unit' },
    { value: 'commercial_office', label: 'Commercial Office' },
    { value: 'commercial_retail', label: 'Commercial Retail' },
    { value: 'commercial_industrial', label: 'Commercial Industrial' },
    { value: 'mixed_use', label: 'Mixed Use' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Property Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[#111827] mb-1">
          Property Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm"
          required
        />
      </div>

      {/* Property Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-[#111827] mb-1">
          Property Address
        </label>
        <input
          type="text"
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm"
          placeholder="Enter property address"
        />
      </div>

      {/* Property Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-[#111827] mb-1">
          Property Type *
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm"
          required
        >
          {propertyTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Purchase Price */}
      <div>
        <label htmlFor="purchasePrice" className="block text-sm font-medium text-[#111827] mb-1">
          Purchase Price *
        </label>
        <input
          type="number"
          id="purchasePrice"
          value={formData.purchasePrice || ''}
          onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm"
          min="0"
          step="1000"
          required
        />
      </div>

      {/* Current Value */}
      <div>
        <label htmlFor="currentValue" className="block text-sm font-medium text-[#111827] mb-1">
          Last Valuation *
        </label>
        <input
          type="number"
          id="currentValue"
          value={formData.currentValue || ''}
          onChange={(e) => handleInputChange('currentValue', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm"
          min="0"
          step="1000"
          required
        />
      </div>

      {/* Purchase Date */}
      <div>
        <label htmlFor="purchaseDate" className="block text-sm font-medium text-[#111827] mb-1">
          Purchase Date *
        </label>
        <input
          type="date"
          id="purchaseDate"
          value={formData.purchaseDate}
          onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
          className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm"
          required
        />
      </div>

      {/* Property Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-[#111827] mb-1">
          Property Status *
        </label>
        <select
          id="status"
          value={formData.status || 'modelling'}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm"
          required
        >
          <option value="modelling">Modelling</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="bought">Bought</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-[#d1d5db] text-[#6b7280] rounded-lg text-sm font-medium hover:bg-[#f9fafb] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Icon components
function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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
