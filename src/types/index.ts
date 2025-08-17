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
  description?: string;
  global_settings_id: string;
  created_at: string;
  updated_at: string;
  // Calculated fields
  total_value?: number;
  average_lvr?: number;
  average_dscr?: number;
  income_replacement_year?: number;
  total_properties?: number;
  modeled_properties?: number;
  total_annual_cashflow?: number;
  portfolio_break_even_year?: number;
}

export interface GlobalSettings {
  id: string;
  portfolio_id: string;
  rent_growth_rate: number; // Annual percentage
  capital_growth_rate: number; // Annual percentage
  expense_inflation_rate: number; // Annual percentage
  tax_rate: number; // Marginal tax rate percentage
  discount_rate: number; // For NPV calculations
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  portfolio_id: string;
  name: string;
  type: PropertyType;
  address?: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string;
  strategy: InvestmentStrategy;
  cashflow_status: CashflowStatus;
  created_at: string;
  updated_at: string;
  // Financial data from JSONB
  annual_rent?: number;
  annual_expenses?: number;
  description?: string;
  // Related data
  loan?: Loan;
  property_metrics?: PropertyMetrics;
  cashflow_projection?: PropertyCashflowProjection;
}

export type PropertyType = 'residential_house' | 'residential_unit' | 'commercial_office' | 'commercial_retail' | 'commercial_industrial' | 'mixed_use';

export type InvestmentStrategy = 'buy_hold' | 'manufacture_equity' | 'value_add_commercial';

export type CashflowStatus = 'not_modeled' | 'modeling' | 'modeled' | 'error';

export interface Loan {
  id: string;
  property_id: string;
  type: LoanType;
  principal_amount: number;
  interest_rate: number;
  term_years: number;
  start_date: string;
  rate_step_ups?: RateStepUp[];
  created_at: string;
  updated_at: string;
}

export type LoanType = 'interest_only' | 'principal_interest';

export interface RateStepUp {
  year: number;
  new_rate: number;
}

export interface PropertyMetrics {
  id: string;
  property_id: string;
  lvr: number; // Loan to Value Ratio
  dscr: number; // Debt Service Coverage Ratio
  cash_on_cash_return: number;
  break_even_year: number;
  net_present_value: number;
  internal_rate_of_return: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyCashflowProjection {
  id: string;
  property_id: string;
  strategy: InvestmentStrategy;
  annual_cashflow: number;
  break_even_year: number;
  net_present_value: number;
  internal_rate_of_return: number;
  year_by_year_projection: YearlyProjection[];
  created_at: string;
  updated_at: string;
}

export interface YearlyProjection {
  year: number;
  rent_income: number;
  expenses: number;
  loan_payment: number;
  tax_liability: number;
  net_cashflow: number;
  cumulative_cashflow: number;
  property_value: number;
  loan_balance: number;
}

export interface PortfolioCashflow {
  id: string;
  portfolio_id: string;
  total_annual_cashflow: number;
  portfolio_break_even_year: number;
  income_replacement_year: number;
  year_by_year_projection: PortfolioYearlyProjection[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioYearlyProjection {
  year: number;
  total_rent_income: number;
  total_expenses: number;
  total_loan_payments: number;
  total_tax_liability: number;
  net_portfolio_cashflow: number;
  cumulative_portfolio_cashflow: number;
  total_portfolio_value: number;
  total_loan_balance: number;
}

export interface ReferenceData {
  id: string;
  category: string;
  name: string;
  value: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Additional types for modeling interface

export interface ModelingAssumptions {
  rent_growth_rate: number;
  capital_growth_rate: number;
  expense_inflation_rate: number;
  tax_rate: number;
  discount_rate: number;
}

export interface StrategyComparison {
  strategy: InvestmentStrategy;
  break_even_year: number;
  net_present_value: number;
  internal_rate_of_return: number;
  annual_cashflow: number;
  key_advantages: string[];
  key_disadvantages: string[];
}

export interface PropertyModelingResult {
  property: Property;
  assumptions: ModelingAssumptions;
  projection: PropertyCashflowProjection;
  strategy_comparisons: StrategyComparison[];
  recommendations: string[];
}

// UI Component Props

export interface KpiCardProps {
  title: string;
  value: string;
  accent: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  helper?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
}

export interface PropertyCardProps {
  property: Property;
  onEdit?: (propertyId: string) => void;
  onModel?: (propertyId: string) => void;
  onView?: (propertyId: string) => void;
}

export interface CashflowChartProps {
  projections: YearlyProjection[];
  breakEvenYear?: number;
  height?: number;
  width?: number;
}

export interface ModelingControlsProps {
  assumptions: ModelingAssumptions;
  onAssumptionsChange: (assumptions: ModelingAssumptions) => void;
  onRunProjection: () => void;
  onResetDefaults: () => void;
  isLoading?: boolean;
}

export interface StrategySelectorProps {
  selectedStrategy: InvestmentStrategy;
  onStrategyChange: (strategy: InvestmentStrategy) => void;
  disabled?: boolean;
}
