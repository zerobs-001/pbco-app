// Core application types for Property Portfolio Cashflow Forecaster

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'client' | 'admin';
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  user_id: string;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  last_login_at?: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  globals: GlobalSettings;
  start_year: number;
  created_at: string;
  updated_at: string;
}

export interface GlobalSettings {
  startYear: number;
  marginalTax: number;
  medicare: number;
  rentGrowth: number;
  expenseInflation: number;
  capitalGrowth: number;
  targetIncome: number;
}

export interface Property {
  id: string;
  portfolio_id: string;
  data: PropertyInput;
  created_at: string;
  updated_at: string;
}

export interface PropertyInput {
  id: string;
  state: string;
  propertyType: PropertyType;
  strategy: InvestmentStrategy;
  purchasePrice: number;
  settlementYearIndex: number;
  initialRentPa: number;
  vacancyPct: number;
  pmFeePct: number;
  otherExpensesPa: number;
  insurancePa: number;
  ratesStrataPa: number;
  depreciationPa: number;
  landTaxPa: number;
  capexYearIndex?: number;
  capexAmount?: number;
  sellingYearIndex?: number;
  sellingCostsPct: number;
  stampDuty?: number;
  lmi?: number;
}

export type PropertyType = 
  | 'RESIDENTIAL_HOUSE'
  | 'RESIDENTIAL_UNIT'
  | 'COMMERCIAL_OFFICE'
  | 'COMMERCIAL_RETAIL'
  | 'COMMERCIAL_INDUSTRIAL';

export type InvestmentStrategy = 
  | 'BUY_AND_HOLD'
  | 'MANUFACTURE_EQUITY'
  | 'VALUE_ADD_COMMERCIAL';

export interface StrategyData {
  // Buy & Hold (baseline)
  BUY_AND_HOLD?: {
    // Optional one-off capex legacy fields
    capexYearIndex?: number;
    capexAmount?: number;
  };
  
  // Manufacture Equity
  MANUFACTURE_EQUITY?: {
    startYearIndex: number;
    durationMonths: number;
    capexBudget: number;
    contingencyPct: number;
    downtimeWeeks: number;
    expectedRentUpliftPct?: number;
    expectedRentUpliftAmount?: number;
    endValueOverride?: number;
    funding: 'cash' | 'loan_top_up';
    capitaliseInterest: boolean;
  };
  
  // Value-Add Commercial
  VALUE_ADD_COMMERCIAL?: {
    currentNetLease: boolean; // Net lease toggle
    marketRentPa: number;
    targetOccupancyPct: number;
    incentivePct: number;
    leasingDowntimeWeeks: number;
    capexProgramPa: number;
    revalueCapRate?: number;
  };
}

export interface Loan {
  id: string;
  property_id: string;
  data: LoanInput;
  created_at: string;
  updated_at: string;
}

export interface LoanInput {
  propertyId: string;
  loanType: LoanType;
  initialLoan: number;
  interestRatePct: number;
  ioYears: number;
  termYears: number;
  rateStepUpPp: number;
}

export type LoanType = 'INTEREST_ONLY' | 'PRINCIPAL_AND_INTEREST';

export interface Results {
  id: string;
  portfolio_id: string;
  scenario: string;
  engine_version: string;
  year_rows: YearRow[];
  kpis: KPIs;
  events: Event[];
  computed_at: string;
}

export interface YearRow {
  yearIndex: number;
  yearLabel: string;
  netTaxableIncome: number;
  tax: number;
  afterTaxCF: number;
  interest: number;
  principal: number;
  portfolioValue: number;
  totalLoans: number;
  equity: number;
  lvr: number;
  dscr: number;
}

export interface KPIs {
  incomeReplacementYear: number;
  currentYearAfterTaxCF: number;
  currentLVR: number;
  currentDSCR: number;
}

export interface Event {
  year: number;
  type: EventType;
  description: string;
  propertyId?: string;
}

export type EventType = 
  | 'SETTLEMENT'
  | 'IO_TO_PI'
  | 'WORKS_START'
  | 'WORKS_COMPLETE'
  | 'RENT_UPLIFT'
  | 'LEASE_UP'
  | 'SALE';

export interface Consent {
  id: string;
  user_id: string;
  version: string;
  accepted_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  diff?: Record<string, any>;
  ip?: string;
  user_agent?: string;
  created_at: string;
}

// Reference data types
export interface ReferenceLMI {
  id: string;
  lender_class: string;
  lvr_min: number;
  lvr_max: number;
  loan_min: number;
  loan_max: number;
  premium_pct: number;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferenceStampDuty {
  id: string;
  state: string;
  bracket_min: number;
  bracket_max: number;
  formula_text: string;
  first_home_flag: boolean;
  investor_flag: boolean;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferenceDefaults {
  id: string;
  key: string;
  value_json: any;
  description: string;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferenceCapRates {
  id: string;
  region: string;
  asset_type: string;
  cap_rate: number;
  source: string;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
