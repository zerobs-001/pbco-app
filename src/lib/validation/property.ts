import { z } from 'zod';

// Property type enum validation
export const PropertyTypeSchema = z.enum([
  'residential_house',
  'residential_unit',
  'commercial_office',
  'commercial_retail',
  'commercial_industrial',
  'mixed_use'
]);

// Investment strategy enum validation
export const InvestmentStrategySchema = z.enum([
  'buy_hold',
  'manufacture_equity',
  'value_add_commercial'
]);

// Loan type enum validation
export const LoanTypeSchema = z.enum([
  'interest_only',
  'principal_interest'
]);

// Financial data validation (positive numbers, reasonable limits)
export const FinancialDataSchema = z.object({
  annual_rent: z.number().min(0).max(10000000).optional(), // Max $10M annual rent
  annual_expenses: z.number().min(0).max(1000000).optional(), // Max $1M annual expenses
  description: z.string().max(1000).optional(), // Max 1000 characters
});

// Loan data validation
export const LoanDataSchema = z.object({
  type: LoanTypeSchema,
  principal_amount: z.number().min(0).max(10000000), // Max $10M loan
  interest_rate: z.number().min(0).max(1), // 0-100% as decimal
  term_years: z.number().int().min(1).max(50), // 1-50 years
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  io_years: z.number().int().min(0).max(30).optional(), // 0-30 years IO period
  rate_step_ups: z.array(z.object({
    year: z.number().int().min(1).max(50),
    new_rate: z.number().min(0).max(1)
  })).optional(),
});

// Property data validation
export const PropertyDataSchema = z.object({
  name: z.string().min(1).max(100).trim(), // 1-100 characters
  type: PropertyTypeSchema,
  address: z.string().max(200).optional(), // Max 200 characters
  purchase_price: z.number().min(0).max(100000000), // Max $100M purchase price
  current_value: z.number().min(0).max(100000000), // Max $100M current value
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  strategy: InvestmentStrategySchema,
  cashflow_status: z.enum(['not_modeled', 'modeled', 'in_progress']).optional(),
  status: z.enum(['modelling', 'shortlisted', 'bought', 'sold']).optional(),
  // Financial data
  annual_rent: z.number().min(0).max(10000000).optional(),
  annual_expenses: z.number().min(0).max(1000000).optional(),
  description: z.string().max(1000).optional(),
  // Loan data (embedded)
  loan: LoanDataSchema.optional(),
  loans: z.array(LoanDataSchema).optional(),
});

// Portfolio data validation
export const PortfolioDataSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  globals: z.object({
    startYear: z.number().int().min(2020).max(2050),
    marginalTax: z.number().min(0).max(1), // 0-100% as decimal
    medicare: z.number().min(0).max(1), // 0-100% as decimal
    rentGrowth: z.number().min(-0.5).max(1), // -50% to 100% growth
    expenseInflation: z.number().min(-0.5).max(1), // -50% to 100% inflation
    capitalGrowth: z.number().min(-0.5).max(1), // -50% to 100% growth
    targetIncome: z.number().min(0).max(10000000), // Max $10M target income
  }),
  start_year: z.number().int().min(2020).max(2050),
});

// API request validation schemas
export const CreatePropertyRequestSchema = z.object({
  portfolioId: z.string().uuid(),
  propertyData: PropertyDataSchema,
  loanData: LoanDataSchema.optional(),
});

export const UpdatePropertyRequestSchema = z.object({
  // Allow partial updates but validate each field if present
  name: z.string().min(1).max(100).trim().optional(),
  type: PropertyTypeSchema.optional(),
  address: z.string().max(200).optional(),
  purchase_price: z.number().min(0).max(100000000).optional(),
  current_value: z.number().min(0).max(100000000).optional(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  strategy: InvestmentStrategySchema.optional(),
  cashflow_status: z.enum(['not_modeled', 'modeled', 'in_progress']).optional(),
  status: z.enum(['modelling', 'shortlisted', 'bought', 'sold']).optional(),
  annual_rent: z.number().min(0).max(10000000).optional(),
  annual_expenses: z.number().min(0).max(1000000).optional(),
  description: z.string().max(1000).optional(),
  loans: z.array(LoanDataSchema).optional(),
});

// Purchase section validation schemas
export const PurchaseInputsSchema = z.object({
  // Property Details
  propertyAddress: z.string().min(1).max(200).trim(),
  state: z.string().min(2).max(3), // State abbreviation
  purchasers: z.string().min(1).max(100).trim(),
  
  // Price, valuation, rent, units
  purchasePrice: z.number().min(0).max(100000000),
  valuationAtPurchase: z.number().min(0).max(100000000),
  rentPerWeek: z.number().min(0).max(100000),
  numberOfUnits: z.number().int().min(1).max(100),
  
  // Dates & durations
  engagementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  contractDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysToUnconditional: z.number().int().min(0).max(365),
  daysForSettlement: z.number().int().min(0).max(365),
  
  // Lending parameters
  lvr: z.number().min(0).max(1), // 0-100% as decimal
  loanProduct: z.enum(['I/O', 'P&I']),
  interestRate: z.number().min(0).max(1), // 0-100% as decimal
  loanTermYears: z.number().int().min(1).max(50),
  loanPreApproval: z.number().min(0).max(100000000),
  
  // Cash position
  fundsAvailable: z.number().min(0).max(100000000),
  
  // Purchase Summary percentages
  depositPaidAtConditional: z.number().min(0).max(1), // 0-100% as decimal
  depositPaidAtUnconditional: z.number().min(0).max(1), // 0-100% as decimal
});

// Utility function to validate and sanitize input
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors?.map(e => `${e.path.join('.')}: ${e.message}`)?.join(', ') || 'Validation error';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Validation failed' };
  }
}
