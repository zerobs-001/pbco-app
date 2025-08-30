"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CompactInput from '../../ui/CompactInput';
import CompactFormRow from '../../ui/CompactFormRow';
import CompactSelect from '../../ui/CompactSelect';
import { 
  PurchaseReferences, 
  calculateStampDuty, 
  calculateLMI 
} from '@/lib/constants/purchaseReferences';

// Types
type PaymentStatus = 'Paid' | 'To Pay';
type TimingGroup = 'Engagement' | 'Exchange' | 'Unconditional' | 'Settlement' | 'Post-Settlement';

interface PurchaseInputs {
  // Property Details (moved from Property Details section)
  propertyName: string;
  propertyType: string;
  investmentStrategy: string;
  status: 'modelling' | 'shortlisted' | 'bought' | 'sold';
  
  // A.1 Core property & buyer
  propertyAddress: string;
  state: string;
  purchasers: string;
  
  // A.2 Price, valuation, rent, units
  purchasePrice: number;
  valuationAtPurchase: number;
  rentPerWeek: number;
  numberOfUnits: number;
  
  // A.3 Dates & durations
  engagementDate: string;
  contractDate: string;
  daysToUnconditional: number;
  daysForSettlement: number;
  
  // A.4 Lending parameters
  lvr: number; // As decimal (0.8 = 80%)
  loanProduct: 'I/O' | 'P&I';
  interestRate: number; // As decimal (0.065 = 6.5%)
  loanTermYears: number;
  loanPreApproval: number;
  
  // A.5 Cash position
  fundsAvailable: number;
  
  // B.0 Purchase Summary percentages
  depositPaidAtConditional: number; // As decimal
  depositPaidAtUnconditional: number; // As decimal
}

interface PaymentItem {
  id: string;
  name: string;
  timingGroup: TimingGroup;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  isCalculated: boolean;
  isOptional?: boolean;
}

interface PurchaseData {
  inputs: PurchaseInputs;
  paymentItems: PaymentItem[];
}

interface PurchaseSectionProps {
  data: PurchaseData;
  onChange: (data: Partial<PurchaseData>) => void;
}

// Helper functions
const formatCurrency = (amount: number): string => {
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

const formatPercent = (decimal: number): string => {
  return `${(decimal * 100).toFixed(2)}%`;
};

const addDays = (dateStr: string, days: number): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const PurchaseSection: React.FC<PurchaseSectionProps> = ({
  data,
  onChange
}) => {
  // Initialize inputs with defaults
  const [inputs, setInputs] = useState<PurchaseInputs>(() => ({
    // Property Details (moved from Property Details section)
    propertyName: data.inputs?.propertyName || '',
    propertyType: data.inputs?.propertyType || 'residential_unit',
    investmentStrategy: data.inputs?.investmentStrategy || 'buy_hold',
    status: data.inputs?.status || 'modelling',
    
    // Core property & buyer
    propertyAddress: data.inputs?.propertyAddress || '',
    state: data.inputs?.state || '',
    purchasers: data.inputs?.purchasers || '',
    
    // Price, valuation, rent, units
    purchasePrice: data.inputs?.purchasePrice || 0,
    valuationAtPurchase: data.inputs?.valuationAtPurchase || data.inputs?.purchasePrice || 0,
    rentPerWeek: data.inputs?.rentPerWeek || 0,
    numberOfUnits: data.inputs?.numberOfUnits || 1,
    
    // Dates & durations
    engagementDate: data.inputs?.engagementDate || new Date().toISOString().split('T')[0],
    contractDate: data.inputs?.contractDate || '',
    daysToUnconditional: data.inputs?.daysToUnconditional || 14,
    daysForSettlement: data.inputs?.daysForSettlement || 42,
    
    // Lending parameters
    lvr: data.inputs?.lvr || 0.80,
    loanProduct: data.inputs?.loanProduct || 'P&I',
    interestRate: data.inputs?.interestRate || 0.065,
    loanTermYears: data.inputs?.loanTermYears || 30,
    loanPreApproval: data.inputs?.loanPreApproval || 0,
    
    // Cash position
    fundsAvailable: data.inputs?.fundsAvailable || 0,
    
    // Purchase Summary percentages
    depositPaidAtConditional: data.inputs?.depositPaidAtConditional || 0.05, // 5% default
    depositPaidAtUnconditional: data.inputs?.depositPaidAtUnconditional || 0.05, // 5% default
  }));

  // Calculate derived values
  const calculations = useMemo(() => {
    // A.2 Calculated fields
    const percentMV = inputs.valuationAtPurchase > 0 
      ? (inputs.purchasePrice - inputs.valuationAtPurchase) / inputs.valuationAtPurchase
      : 0;
    
    // A.4 Calculated fields
    const loanAmount = inputs.purchasePrice * inputs.lvr;
    const bcRemaining = inputs.loanPreApproval - loanAmount;
    
    // B.0 Purchase Summary calculations
    const totalDepositPercent = 1 - inputs.lvr;
    const plannedLoanAmount = inputs.purchasePrice * inputs.lvr;
    const financedPortionAtSettlement = inputs.lvr * Math.min(inputs.purchasePrice, inputs.valuationAtPurchase);
    
    // Date calculations
    const settlementDate = addDays(inputs.contractDate, inputs.daysForSettlement);
    const unconditionalDate = addDays(inputs.contractDate, inputs.daysToUnconditional);
    const postSettlementDate = addDays(settlementDate, PurchaseReferences.PostSettlementLagDays);
    
    // Deposit calculations
    const conditionalDepositAmount = inputs.purchasePrice * inputs.depositPaidAtConditional;
    const unconditionalDepositAmount = inputs.purchasePrice * inputs.depositPaidAtUnconditional;
    const depositBalanceAtSettlement = Math.max(0, 
      inputs.purchasePrice - financedPortionAtSettlement - conditionalDepositAmount - unconditionalDepositAmount
    );
    
    // Fee calculations
    const stampDuty = calculateStampDuty(inputs.state, inputs.purchasePrice, true);
    const lmi = totalDepositPercent >= PurchaseReferences.MinDepositPctNoLMI 
      ? 0 
      : calculateLMI(plannedLoanAmount, inputs.lvr);
    const ratesAdjustment = inputs.valuationAtPurchase * PurchaseReferences.RatesAdjustmentRatePct;
    
    return {
      percentMV,
      loanAmount,
      bcRemaining,
      totalDepositPercent,
      plannedLoanAmount,
      financedPortionAtSettlement,
      settlementDate,
      unconditionalDate,
      postSettlementDate,
      conditionalDepositAmount,
      unconditionalDepositAmount,
      depositBalanceAtSettlement,
      stampDuty,
      lmi,
      ratesAdjustment,
    };
  }, [inputs]);

  // Initialize payment items
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>(() => {
    if (data.paymentItems && data.paymentItems.length > 0) {
      return data.paymentItems;
    }
    
    // Default payment items structure
    return [
      // B.1 Timing: Engagement
      {
        id: 'engagement_fee',
        name: 'Engagement Fee',
        timingGroup: 'Engagement',
        dueDate: inputs.engagementDate,
        amount: PurchaseReferences.EngagementFee,
        status: 'To Pay',
        isCalculated: false,
      },
      
      // B.2 Timing: Exchange of Contract
      {
        id: 'conditional_deposit',
        name: 'Conditional Holding Deposit',
        timingGroup: 'Exchange',
        dueDate: inputs.contractDate,
        amount: calculations.conditionalDepositAmount,
        status: 'To Pay',
        isCalculated: true,
      },
      {
        id: 'building_insurance',
        name: 'Building & Landlord Insurance',
        timingGroup: 'Exchange',
        dueDate: inputs.contractDate,
        amount: PurchaseReferences.DefaultInsuranceAtExchange,
        status: 'To Pay',
        isCalculated: false,
      },
      {
        id: 'building_pest',
        name: 'Building & Pest Inspection',
        timingGroup: 'Exchange',
        dueDate: inputs.contractDate,
        amount: PurchaseReferences.DefaultBPIFee,
        status: 'To Pay',
        isCalculated: false,
      },
      {
        id: 'plumbing_electrical',
        name: 'Plumbing & Electrical Inspections',
        timingGroup: 'Exchange',
        dueDate: inputs.contractDate,
        amount: PurchaseReferences.DefaultPEInspectionFee,
        status: 'To Pay',
        isCalculated: false,
      },
      {
        id: 'independent_valuation',
        name: 'Independent Property Valuation (optional)',
        timingGroup: 'Exchange',
        dueDate: inputs.contractDate,
        amount: PurchaseReferences.DefaultValuationFee,
        status: 'To Pay',
        isCalculated: false,
        isOptional: true,
      },
      
      // B.3 Timing: Unconditional Exchange
      {
        id: 'unconditional_deposit',
        name: 'Unconditional Holding Deposit',
        timingGroup: 'Unconditional',
        dueDate: calculations.unconditionalDate,
        amount: calculations.unconditionalDepositAmount,
        status: 'To Pay',
        isCalculated: true,
      },
      
      // B.4 Timing: Settlement
      {
        id: 'deposit_balance',
        name: 'Deposit Balance Paid at Settlement',
        timingGroup: 'Settlement',
        dueDate: calculations.settlementDate,
        amount: calculations.depositBalanceAtSettlement,
        status: 'To Pay',
        isCalculated: true,
      },
      {
        id: 'stamp_duty',
        name: 'Stamp Duty (estimate)',
        timingGroup: 'Settlement',
        dueDate: calculations.settlementDate,
        amount: calculations.stampDuty,
        status: 'To Pay',
        isCalculated: true,
      },
      {
        id: 'lmi',
        name: 'Lenders Mortgage Insurance (LMI)',
        timingGroup: 'Settlement',
        dueDate: calculations.settlementDate,
        amount: calculations.lmi,
        status: 'To Pay',
        isCalculated: true,
      },
      {
        id: 'mortgage_fees',
        name: 'Mortgage Fees',
        timingGroup: 'Settlement',
        dueDate: calculations.settlementDate,
        amount: PurchaseReferences.DefaultMortgageFees,
        status: 'To Pay',
        isCalculated: false,
      },
      {
        id: 'conveyancing',
        name: 'Conveyancing (Fees + Searches)',
        timingGroup: 'Settlement',
        dueDate: calculations.settlementDate,
        amount: PurchaseReferences.DefaultConveyancingFee,
        status: 'To Pay',
        isCalculated: false,
      },
      {
        id: 'rates_adjustment',
        name: 'Rates Adjustment — current period',
        timingGroup: 'Settlement',
        dueDate: calculations.settlementDate,
        amount: calculations.ratesAdjustment,
        status: 'To Pay',
        isCalculated: true,
      },
      {
        id: 'balance',
        name: 'Balance (If applicable)',
        timingGroup: 'Settlement',
        dueDate: calculations.settlementDate,
        amount: 0,
        status: 'To Pay',
        isCalculated: false,
        isOptional: true,
      },
      
      // B.5 Timing: Post-Settlement
      {
        id: 'maintenance_allowance',
        name: 'Maintenance Allowance',
        timingGroup: 'Post-Settlement',
        dueDate: calculations.postSettlementDate,
        amount: PurchaseReferences.DefaultMaintenanceAllowance,
        status: 'To Pay',
        isCalculated: false,
      },
    ];
  });

  // Update payment items when calculations change
  useEffect(() => {
    const updatedItems = paymentItems.map(item => {
      if (!item.isCalculated) return item;
      
      let newAmount = item.amount;
      let newDueDate = item.dueDate;
      
      switch (item.id) {
        case 'conditional_deposit':
          newAmount = calculations.conditionalDepositAmount;
          newDueDate = inputs.contractDate;
          break;
        case 'unconditional_deposit':
          newAmount = calculations.unconditionalDepositAmount;
          newDueDate = calculations.unconditionalDate;
          break;
        case 'deposit_balance':
          newAmount = calculations.depositBalanceAtSettlement;
          newDueDate = calculations.settlementDate;
          break;
        case 'stamp_duty':
          newAmount = calculations.stampDuty;
          newDueDate = calculations.settlementDate;
          break;
        case 'lmi':
          newAmount = calculations.lmi;
          newDueDate = calculations.settlementDate;
          break;
        case 'rates_adjustment':
          newAmount = calculations.ratesAdjustment;
          newDueDate = calculations.settlementDate;
          break;
      }
      
      // Update due dates for non-calculated items based on timing group
      if (!item.isCalculated) {
        switch (item.timingGroup) {
          case 'Engagement':
            newDueDate = inputs.engagementDate;
            break;
          case 'Exchange':
            newDueDate = inputs.contractDate;
            break;
          case 'Unconditional':
            newDueDate = calculations.unconditionalDate;
            break;
          case 'Settlement':
            newDueDate = calculations.settlementDate;
            break;
          case 'Post-Settlement':
            newDueDate = calculations.postSettlementDate;
            break;
        }
      }
      
      return { ...item, amount: newAmount, dueDate: newDueDate };
    });
    
    setPaymentItems(updatedItems);
    onChange({ inputs, paymentItems: updatedItems });
  }, [inputs, calculations]);

  // Update functions
  const updateInput = (field: keyof PurchaseInputs, value: string | number) => {
    setInputs(prev => {
      const newInputs = { ...prev };
      
      // Handle different field types
      if (field === 'propertyName' || field === 'propertyType' || field === 'investmentStrategy' || 
          field === 'status' || field === 'propertyAddress' || field === 'state' || field === 'purchasers' || 
          field === 'engagementDate' || field === 'contractDate' || field === 'loanProduct') {
        newInputs[field] = value as any;
      } else if (field === 'lvr' || field === 'interestRate' || 
                 field === 'depositPaidAtConditional' || field === 'depositPaidAtUnconditional') {
        // Convert percentage input to decimal
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        newInputs[field] = isNaN(numValue) ? 0 : numValue / 100;
      } else {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        newInputs[field] = isNaN(numValue) ? 0 : numValue;
      }
      
      // Auto-fill contract date if not set
      if (field === 'engagementDate' && !newInputs.contractDate) {
        newInputs.contractDate = addDays(value as string, PurchaseReferences.DefaultContractLeadDays);
      }
      
      // Auto-fill valuation if not set
      if (field === 'purchasePrice' && !prev.valuationAtPurchase) {
        newInputs.valuationAtPurchase = numValue as number;
      }
      
      // Auto-calculate rent if not set
      if (field === 'purchasePrice' && !prev.rentPerWeek) {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        newInputs.rentPerWeek = Math.round((numValue * PurchaseReferences.DefaultGrossYield) / 52);
      }
      
      return newInputs;
    });
  };

  const updatePaymentItem = (id: string, field: 'amount' | 'status', value: number | PaymentStatus) => {
    const updatedItems = paymentItems.map(item => 
      item.id === id 
        ? { ...item, [field]: field === 'amount' ? parseFloat(value.toString()) || 0 : value }
        : item
    );
    setPaymentItems(updatedItems);
    onChange({ inputs, paymentItems: updatedItems });
  };

  // Calculate summaries
  const getTimingGroupItems = (group: TimingGroup) => {
    return paymentItems.filter(item => item.timingGroup === group);
  };

  const getTimingGroupTotal = (group: TimingGroup) => {
    return getTimingGroupItems(group).reduce((sum, item) => sum + item.amount, 0);
  };

  const getTimingGroupToPay = (group: TimingGroup) => {
    return getTimingGroupItems(group)
      .filter(item => item.status === 'To Pay')
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const totalCashRequired = paymentItems.reduce((sum, item) => sum + item.amount, 0);
  const totalRemainingToPay = paymentItems
    .filter(item => item.status === 'To Pay')
    .reduce((sum, item) => sum + item.amount, 0);
  const fundsRemaining = inputs.fundsAvailable - totalCashRequired;

  // State options
  const stateOptions = [
    { value: '', label: 'Select State' },
    { value: 'NSW', label: 'New South Wales' },
    { value: 'VIC', label: 'Victoria' },
    { value: 'QLD', label: 'Queensland' },
    { value: 'WA', label: 'Western Australia' },
    { value: 'SA', label: 'South Australia' },
    { value: 'TAS', label: 'Tasmania' },
    { value: 'ACT', label: 'Australian Capital Territory' },
    { value: 'NT', label: 'Northern Territory' },
  ];

  const loanProductOptions = [
    { value: 'I/O', label: 'Interest Only' },
    { value: 'P&I', label: 'Principal & Interest' },
  ];

  const unitOptions = Array.from({ length: 10 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }));

  const timingGroups: TimingGroup[] = ['Engagement', 'Exchange', 'Unconditional', 'Settlement', 'Post-Settlement'];

  const timingGroupColors = {
    'Engagement': 'blue',
    'Exchange': 'purple',
    'Unconditional': 'green',
    'Settlement': 'orange',
    'Post-Settlement': 'gray',
  };

  // Options for select fields
  const propertyTypes = [
    { value: 'residential_house', label: 'Residential House' },
    { value: 'residential_unit', label: 'Residential Unit' },
    { value: 'commercial_office', label: 'Commercial Office' },
    { value: 'commercial_retail', label: 'Commercial Retail' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'land', label: 'Land' }
  ];

  const strategies = [
    { value: 'buy_hold', label: 'Buy & Hold' },
    { value: 'manufacture_equity', label: 'Manufacture Equity' },
    { value: 'value_add_commercial', label: 'Value-Add Commercial' },
    { value: 'fix_flip', label: 'Fix & Flip' },
    { value: 'development', label: 'Development' }
  ];

  const statuses = [
    { value: 'modelling', label: 'Modelling' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'bought', label: 'Bought' },
    { value: 'sold', label: 'Sold' }
  ];

  return (
    <div className="space-y-6">
      {/* DEAL INPUTS (renamed from A) Inputs) */}
      <div className="space-y-4">
        <div className="bg-primary/10 border-l-4 border-primary p-4">
          <h3 className="text-sm font-semibold text-primary">DEAL INPUTS</h3>
        </div>
        
        <div className="space-y-1">
          {/* Property Details (moved from Property Details section) */}
          <CompactFormRow label="Property Name" required>
            <CompactInput
              value={inputs.propertyName}
              onChange={(value) => updateInput('propertyName', value)}
              placeholder="Enter property name"
            />
          </CompactFormRow>

          <CompactFormRow label="Property Type" required>
            <CompactSelect
              value={inputs.propertyType}
              onChange={(value) => updateInput('propertyType', value)}
              options={propertyTypes}
            />
          </CompactFormRow>

          <CompactFormRow label="Investment Strategy" required>
            <CompactSelect
              value={inputs.investmentStrategy}
              onChange={(value) => updateInput('investmentStrategy', value)}
              options={strategies}
            />
          </CompactFormRow>

          <CompactFormRow label="Status" required>
            <CompactSelect
              value={inputs.status}
              onChange={(value) => updateInput('status', value)}
              options={statuses}
            />
          </CompactFormRow>

          {/* A.1 Core property & buyer */}
          <CompactFormRow label="Property Address" required>
            <CompactInput
              value={inputs.propertyAddress}
              onChange={(value) => updateInput('propertyAddress', value)}
              placeholder="Enter property address"
            />
          </CompactFormRow>

          <CompactFormRow label="State" required>
            <CompactSelect
              value={inputs.state}
              onChange={(value) => updateInput('state', value)}
              options={stateOptions}
            />
          </CompactFormRow>

          <CompactFormRow label="Purchaser(s)" required>
            <CompactInput
              value={inputs.purchasers}
              onChange={(value) => updateInput('purchasers', value)}
              placeholder="Enter purchaser names"
            />
          </CompactFormRow>

          {/* A.2 Price, valuation, rent, units */}
          <CompactFormRow label="Purchase Price" required>
            <CompactInput
              type="currency"
              value={inputs.purchasePrice || ''}
              onChange={(value) => updateInput('purchasePrice', value)}
              placeholder="0"
            />
          </CompactFormRow>

          <CompactFormRow label="Valuation at Purchase">
            <CompactInput
              type="currency"
              value={inputs.valuationAtPurchase || ''}
              onChange={(value) => updateInput('valuationAtPurchase', value)}
              placeholder="0"
            />
          </CompactFormRow>

          <CompactFormRow label="%MV">
            <div className="text-xs text-gray-600 py-1 border-b border-gray-300">
              {formatPercent(calculations.percentMV)}
              {calculations.percentMV < 0 && <span className="text-green-600 ml-2">(Below market)</span>}
            </div>
          </CompactFormRow>

          <CompactFormRow label="Rent Per Week">
            <CompactInput
              type="currency"
              value={inputs.rentPerWeek || ''}
              onChange={(value) => updateInput('rentPerWeek', value)}
              placeholder="0"
            />
          </CompactFormRow>

          <CompactFormRow label="No. of Units">
            <CompactSelect
              value={inputs.numberOfUnits.toString()}
              onChange={(value) => updateInput('numberOfUnits', parseInt(value))}
              options={unitOptions}
            />
          </CompactFormRow>

          {/* A.3 Dates & durations */}
          <CompactFormRow label="Engagement Date">
            <CompactInput
              type="date"
              value={inputs.engagementDate}
              onChange={(value) => updateInput('engagementDate', value)}
            />
          </CompactFormRow>

          <CompactFormRow label="Contract Date">
            <CompactInput
              type="date"
              value={inputs.contractDate}
              onChange={(value) => updateInput('contractDate', value)}
            />
          </CompactFormRow>

          <CompactFormRow label="Days to Unconditional">
            <CompactInput
              type="number"
              value={inputs.daysToUnconditional || ''}
              onChange={(value) => updateInput('daysToUnconditional', value)}
              placeholder="14"
            />
          </CompactFormRow>

          <CompactFormRow label="Days for Settlement">
            <CompactInput
              type="number"
              value={inputs.daysForSettlement || ''}
              onChange={(value) => updateInput('daysForSettlement', value)}
              placeholder="42"
            />
          </CompactFormRow>

          {/* A.4 Lending parameters */}
          <CompactFormRow label="LVR (%)">
            <CompactInput
              type="number"
              step="0.1"
              value={(inputs.lvr * 100) || ''}
              onChange={(value) => updateInput('lvr', value)}
              placeholder="80"
            />
          </CompactFormRow>

          <CompactFormRow label="Loan Product">
            <CompactSelect
              value={inputs.loanProduct}
              onChange={(value) => updateInput('loanProduct', value)}
              options={loanProductOptions}
            />
          </CompactFormRow>

          <CompactFormRow label="Interest Rate (%)">
            <CompactInput
              type="number"
              step="0.01"
              value={(inputs.interestRate * 100) || ''}
              onChange={(value) => updateInput('interestRate', value)}
              placeholder="6.50"
            />
          </CompactFormRow>

          <CompactFormRow label="Loan Term (Years)">
            <CompactInput
              type="number"
              value={inputs.loanTermYears || ''}
              onChange={(value) => updateInput('loanTermYears', value)}
              placeholder="30"
            />
          </CompactFormRow>

          <CompactFormRow label="Loan amount (LVR×PP)">
            <div className="text-xs text-gray-600 py-1 border-b border-gray-300">
              {formatCurrency(calculations.loanAmount)}
            </div>
          </CompactFormRow>

          <CompactFormRow label="Loan pre-approval">
            <CompactInput
              type="currency"
              value={inputs.loanPreApproval || ''}
              onChange={(value) => updateInput('loanPreApproval', value)}
              placeholder="0"
            />
          </CompactFormRow>

          <CompactFormRow label="BC Remaining">
            <div className="text-xs text-gray-600 py-1 border-b border-gray-300">
              {formatCurrency(calculations.bcRemaining)}
              {calculations.bcRemaining < 0 && <span className="text-red-600 ml-2">(Over limit)</span>}
            </div>
          </CompactFormRow>

          {/* A.5 Cash position */}
          <CompactFormRow label="Funds Available">
            <CompactInput
              type="currency"
              value={inputs.fundsAvailable || ''}
              onChange={(value) => updateInput('fundsAvailable', value)}
              placeholder="0"
            />
          </CompactFormRow>

          <CompactFormRow label="Funds Required">
            <div className="text-xs text-gray-600 py-1 border-b border-gray-300">
              {formatCurrency(totalCashRequired)}
            </div>
          </CompactFormRow>

          <CompactFormRow label="Funds Remaining">
            <div className={`text-xs py-1 border-b border-gray-300 ${fundsRemaining < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {formatCurrency(fundsRemaining)}
              {fundsRemaining < 0 && <span className="ml-2">(Shortfall)</span>}
            </div>
          </CompactFormRow>
        </div>
      </div>

      {/* PURCHASE SUMMARY (renamed from B.0) Purchase Summary) */}
      <div className="space-y-4">
        <div className="bg-primary/10 border-l-4 border-primary p-4">
          <h3 className="text-sm font-semibold text-primary">PURCHASE SUMMARY</h3>
        </div>
        
        <div className="space-y-1">
          <CompactFormRow label="Total Deposit %">
            <div className="text-xs text-gray-600 py-1 border-b border-gray-300">
              {formatPercent(calculations.totalDepositPercent)}
            </div>
          </CompactFormRow>

          <CompactFormRow label="Deposit at Conditional (%)">
            <CompactInput
              type="number"
              step="0.1"
              value={(inputs.depositPaidAtConditional * 100) || ''}
              onChange={(value) => updateInput('depositPaidAtConditional', value)}
              placeholder="5"
            />
          </CompactFormRow>

          <CompactFormRow label="Deposit at Unconditional (%)">
            <CompactInput
              type="number"
              step="0.1"
              value={(inputs.depositPaidAtUnconditional * 100) || ''}
              onChange={(value) => updateInput('depositPaidAtUnconditional', value)}
              placeholder="5"
            />
          </CompactFormRow>

          <CompactFormRow label="Planned Loan Amount">
            <div className="text-xs text-gray-600 py-1 border-b border-gray-300">
              {formatCurrency(calculations.plannedLoanAmount)}
            </div>
          </CompactFormRow>

          <CompactFormRow label="Financed Portion at Settlement">
            <div className="text-xs text-gray-600 py-1 border-b border-gray-300">
              {formatCurrency(calculations.financedPortionAtSettlement)}
            </div>
          </CompactFormRow>
        </div>
      </div>

      {/* Grand Total Summary */}
      <div className="bg-gray-100 border-2 border-gray-300 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-gray-900">Deal Summary</h2>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(totalRemainingToPay)}
            </div>
            <div className="text-xs text-gray-600">Capital Required</div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-700">
          <span>Total Deal Cost: {formatCurrency(totalCashRequired)}</span>
          <span>Paid: {formatCurrency(totalCashRequired - totalRemainingToPay)}</span>
        </div>
      </div>

      {/* PURCHASE COSTS (renamed from B) Purchase Timeline) */}
      <div className="space-y-4">
        <div className="bg-primary/10 border-l-4 border-primary p-4">
          <h3 className="text-sm font-semibold text-primary">PURCHASE COSTS</h3>
        </div>

        {/* Table Header */}
        <div className="border-b border-gray-200 pb-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700">
            <div className="col-span-4">Payment Item</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Outstanding</div>
          </div>
        </div>

        {/* Timing Groups */}
        {timingGroups.map(group => {
          const items = getTimingGroupItems(group);
          const total = getTimingGroupTotal(group);
          const toPay = getTimingGroupToPay(group);
          const color = timingGroupColors[group];

          if (items.length === 0) return null;

          return (
            <div key={group} className="space-y-2">
              {/* Group Header */}
              <div className="bg-secondary/10 border-l-4 border-secondary p-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-secondary">
                    {group}
                  </h4>
                  <div className="flex gap-4 text-xs">
                    <span className="text-secondary">
                      Total: {formatCurrency(total)}
                    </span>
                    {toPay > 0 && (
                      <span className="text-destructive">
                        To Pay: {formatCurrency(toPay)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Group Items */}
              <div className="space-y-1 pl-2">
                {items.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center py-1 hover:bg-gray-50 rounded">
                    <div className="col-span-4">
                      <div className="text-xs font-medium text-gray-900">
                        {item.name}
                        {item.isOptional && <span className="text-gray-500 ml-1">(optional)</span>}
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600">
                        {item.dueDate || '-'}
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      {item.isCalculated ? (
                        <div className="text-xs text-gray-600">
                          {formatCurrency(item.amount)}
                        </div>
                      ) : (
                        <CompactInput
                          type="currency"
                          value={item.amount || ''}
                          onChange={(value) => updatePaymentItem(item.id, 'amount', parseFloat(value.replace(/,/g, '')) || 0)}
                          placeholder="0"
                          className="text-xs"
                        />
                      )}
                    </div>
                    
                    <div className="col-span-2">
                      <CompactSelect
                        value={item.status}
                        onChange={(value) => updatePaymentItem(item.id, 'status', value as PaymentStatus)}
                        options={[
                          { value: 'Paid', label: 'Paid' },
                          { value: 'To Pay', label: 'To Pay' },
                        ]}
                        className="text-xs"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600 text-right">
                        {item.status === 'To Pay' ? formatCurrency(item.amount) : '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PurchaseSection;