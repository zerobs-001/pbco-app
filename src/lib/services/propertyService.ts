import { createClient } from '@/lib/supabase/client';
import { Property, PropertyType, InvestmentStrategy, Loan, LoanType } from '@/types';

export interface CreatePropertyData {
  name: string;
  type: PropertyType;
  address?: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string;
  strategy: InvestmentStrategy;
  // Financial details
  annual_rent: number;
  annual_expenses: number;
  // Loan details
  loan_amount?: number;
  interest_rate?: number;
  loan_term?: number;
  loan_type?: LoanType;
  // Additional details
  description?: string;
}

export interface PropertyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PropertyService {
  private supabase = createClient();

  /**
   * Validate property data before creation
   */
  validatePropertyData(data: CreatePropertyData): PropertyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!data.name?.trim()) {
      errors.push('Property name is required');
    }

    if (!data.type) {
      errors.push('Property type is required');
    }

    if (!data.purchase_price || data.purchase_price <= 0) {
      errors.push('Purchase price must be greater than 0');
    }

    if (!data.current_value || data.current_value <= 0) {
      errors.push('Current value must be greater than 0');
    }

    if (!data.purchase_date) {
      errors.push('Purchase date is required');
    }

    if (!data.strategy) {
      errors.push('Investment strategy is required');
    }

    if (!data.annual_rent || data.annual_rent < 0) {
      errors.push('Annual rent must be 0 or greater');
    }

    if (!data.annual_expenses || data.annual_expenses < 0) {
      errors.push('Annual expenses must be 0 or greater');
    }

    // Business logic validation
    if (data.current_value < data.purchase_price) {
      warnings.push('Current value is less than purchase price - this may indicate a loss');
    }

    if (data.annual_expenses > data.annual_rent) {
      warnings.push('Annual expenses exceed annual rent - this property will have negative cashflow');
    }

    // Loan validation
    if (data.loan_amount) {
      if (data.loan_amount <= 0) {
        errors.push('Loan amount must be greater than 0');
      }

      if (data.loan_amount > data.current_value) {
        errors.push('Loan amount cannot exceed current property value');
      }

      if (!data.interest_rate || data.interest_rate <= 0) {
        errors.push('Interest rate is required when loan amount is provided');
      }

      if (!data.loan_term || data.loan_term <= 0) {
        errors.push('Loan term is required when loan amount is provided');
      }

      if (!data.loan_type) {
        errors.push('Loan type is required when loan amount is provided');
      }

      // LVR calculation
      const lvr = (data.loan_amount / data.current_value) * 100;
      if (lvr > 95) {
        warnings.push(`Loan to Value Ratio (${lvr.toFixed(1)}%) is very high - consider reducing loan amount`);
      }

      // DSCR calculation
      if (data.interest_rate && data.loan_term) {
        const monthlyRate = data.interest_rate / 100 / 12;
        const totalPayments = data.loan_term * 12;
        const monthlyPayment = (data.loan_amount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                             (Math.pow(1 + monthlyRate, totalPayments) - 1);
        const annualPayment = monthlyPayment * 12;
        const dscr = data.annual_rent / annualPayment;

        if (dscr < 1.2) {
          warnings.push(`Debt Service Coverage Ratio (${dscr.toFixed(2)}x) is below recommended minimum of 1.2x`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create a new property
   */
  async createProperty(portfolioId: string, data: CreatePropertyData): Promise<Property> {
    // Validate the data first
    const validation = this.validatePropertyData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Prepare property data for the API
    const propertyData = {
      name: data.name.trim(),
      type: data.type,
      address: data.address?.trim() || null,
      purchase_price: data.purchase_price,
      current_value: data.current_value,
      purchase_date: data.purchase_date,
      strategy: data.strategy,
      annual_rent: data.annual_rent,
      annual_expenses: data.annual_expenses,
      description: data.description?.trim() || null,
      cashflow_status: 'not_modeled'
    };

    try {
      // Use the server-side API route to bypass RLS
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioId,
          propertyData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { property } = await response.json();
      return this.mapDatabasePropertyToType(property);
    } catch (error) {
      console.error('Property creation error:', error);
      throw error;
    }
  }

  /**
   * Get all properties for a portfolio
   */
  async getPropertiesByPortfolio(portfolioId: string): Promise<Property[]> {
    const { data: properties, error } = await this.supabase
      .from('properties')
      .select(`
        *,
        loans (*)
      `)
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch properties: ${error.message}`);
    }

    return properties.map(this.mapDatabasePropertyToType);
  }

  /**
   * Get a single property by ID
   */
  async getPropertyById(id: string): Promise<Property | null> {
    try {
      const response = await fetch(`/api/properties/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { property } = await response.json();
      return this.mapDatabasePropertyToType(property);
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  }

  async getPropertiesByPortfolioId(portfolioId: string): Promise<Property[]> {
    try {
      const response = await fetch(`/api/properties?portfolioId=${portfolioId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { properties } = await response.json();
      return properties.map((property: any) => this.mapDatabasePropertyToType(property));
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  }

  /**
   * Update property cashflow status
   */
  async updateCashflowStatus(propertyId: string, status: 'not_modeled' | 'modeling' | 'modeled' | 'error'): Promise<void> {
    const { error } = await this.supabase
      .from('properties')
      .update({ cashflow_status: status })
      .eq('id', propertyId);

    if (error) {
      throw new Error(`Failed to update cashflow status: ${error.message}`);
    }
  }

  /**
   * Map database property to TypeScript interface
   */
  private mapDatabasePropertyToType(dbProperty: any): Property {
    const propertyData = dbProperty.data || {};
    console.log('🔍 Service: Mapping property data:', {
      id: dbProperty.id,
      hasData: !!dbProperty.data,
      hasLoan: !!dbProperty.loan,
      hasLoans: !!dbProperty.loans,
      annual_rent: dbProperty.annual_rent,
      propertyDataAnnualRent: propertyData.annual_rent
    });
    return {
      id: dbProperty.id,
      portfolio_id: dbProperty.portfolio_id,
      name: dbProperty.name || propertyData.name,
      type: dbProperty.type || propertyData.type,
      address: dbProperty.address || propertyData.address,
      purchase_price: dbProperty.purchase_price || propertyData.purchase_price,
      current_value: dbProperty.current_value || propertyData.current_value,
      purchase_date: dbProperty.purchase_date || propertyData.purchase_date,
      strategy: dbProperty.strategy || propertyData.strategy,
      cashflow_status: dbProperty.cashflow_status || propertyData.cashflow_status || 'not_modeled',
      created_at: dbProperty.created_at,
      updated_at: dbProperty.updated_at,
      // Financial data - check both top level (from API) and nested data (from direct DB)
      annual_rent: dbProperty.annual_rent || propertyData.annual_rent,
      annual_expenses: dbProperty.annual_expenses || propertyData.annual_expenses,
      description: dbProperty.description || propertyData.description,
      loan: dbProperty.loans?.[0] ? {
        id: dbProperty.loans[0].id,
        property_id: dbProperty.loans[0].property_id,
        type: dbProperty.loans[0].type,
        principal_amount: dbProperty.loans[0].principal_amount,
        interest_rate: dbProperty.loans[0].interest_rate,
        term_years: dbProperty.loans[0].term_years,
        start_date: dbProperty.loans[0].start_date,
        created_at: dbProperty.loans[0].created_at,
        updated_at: dbProperty.loans[0].updated_at
      } : dbProperty.loan ? {
        id: dbProperty.loan.id || `embedded_${dbProperty.id}`,
        property_id: dbProperty.loan.property_id || dbProperty.id,
        type: dbProperty.loan.type,
        principal_amount: dbProperty.loan.principal_amount,
        interest_rate: dbProperty.loan.interest_rate,
        term_years: dbProperty.loan.term_years,
        start_date: dbProperty.loan.start_date,
        created_at: dbProperty.loan.created_at,
        updated_at: dbProperty.loan.updated_at
      } : undefined
    };
  }
}

export const propertyService = new PropertyService();
