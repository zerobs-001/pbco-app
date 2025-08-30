import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

export interface DefaultPortfolioSettings {
  startYear: number;
  marginalTax: number;
  medicare: number;
  rentGrowth: number;
  expenseInflation: number;
  capitalGrowth: number;
  targetIncome: number;
}

export interface CreatePortfolioData {
  userId: string;
  name?: string;
  description?: string;
  settings?: Partial<DefaultPortfolioSettings>;
}

export class PortfolioService {
  private supabase = createClient();

  /**
   * Get default portfolio settings
   */
  private getDefaultSettings(): DefaultPortfolioSettings {
    const currentYear = new Date().getFullYear();
    
    return {
      startYear: currentYear,
      marginalTax: 0.37, // 37% marginal tax rate
      medicare: 0.02, // 2% Medicare levy
      rentGrowth: 0.03, // 3% annual rent growth
      expenseInflation: 0.025, // 2.5% expense inflation
      capitalGrowth: 0.04, // 4% capital growth
      targetIncome: 100000 // Target annual income
    };
  }

  /**
   * Create a default portfolio for a new user
   */
  async createDefaultPortfolio(userId: string): Promise<{ success: boolean; portfolio?: any; error?: string }> {
    try {
      const defaultSettings = this.getDefaultSettings();
      
      // Generate a unique portfolio ID
      const portfolioId = crypto.randomUUID();
      
      const { data: portfolio, error } = await this.supabase
        .from('portfolios')
        .insert({
          id: portfolioId,
          user_id: userId,
          name: 'My Investment Portfolio',
          globals: defaultSettings,
          start_year: defaultSettings.startYear
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default portfolio:', error);
        return { 
          success: false, 
          error: `Failed to create default portfolio: ${error.message}` 
        };
      }

      console.log('✅ Created default portfolio for user:', userId);
      return { 
        success: true, 
        portfolio 
      };

    } catch (err) {
      console.error('Unexpected error creating portfolio:', err);
      return { 
        success: false, 
        error: 'An unexpected error occurred while creating portfolio' 
      };
    }
  }

  /**
   * Create a custom portfolio
   */
  async createPortfolio(data: CreatePortfolioData): Promise<{ success: boolean; portfolio?: any; error?: string }> {
    try {
      const defaultSettings = this.getDefaultSettings();
      const settings = { ...defaultSettings, ...data.settings };
      
      // Generate a unique portfolio ID
      const portfolioId = crypto.randomUUID();
      
      const { data: portfolio, error } = await this.supabase
        .from('portfolios')
        .insert({
          id: portfolioId,
          user_id: data.userId,
          name: data.name || 'My Investment Portfolio',
          globals: settings,
          start_year: settings.startYear
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating portfolio:', error);
        return { 
          success: false, 
          error: `Failed to create portfolio: ${error.message}` 
        };
      }

      return { 
        success: true, 
        portfolio 
      };

    } catch (err) {
      console.error('Unexpected error creating portfolio:', err);
      return { 
        success: false, 
        error: 'An unexpected error occurred while creating portfolio' 
      };
    }
  }

  /**
   * Get user's portfolios
   */
  async getUserPortfolios(userId: string): Promise<{ success: boolean; portfolios?: any[]; error?: string }> {
    try {
      const { data: portfolios, error } = await this.supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching portfolios:', error);
        return { 
          success: false, 
          error: `Failed to fetch portfolios: ${error.message}` 
        };
      }

      return { 
        success: true, 
        portfolios: portfolios || [] 
      };

    } catch (err) {
      console.error('Unexpected error fetching portfolios:', err);
      return { 
        success: false, 
        error: 'An unexpected error occurred while fetching portfolios' 
      };
    }
  }

  /**
   * Get user's first (primary) portfolio
   */
  async getUserPrimaryPortfolio(userId: string): Promise<{ success: boolean; portfolio?: any; error?: string }> {
    try {
      const { data: portfolio, error } = await this.supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }) // Get the first created portfolio
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No portfolio found
          return { 
            success: false, 
            error: 'No portfolio found' 
          };
        }
        
        console.error('Error fetching primary portfolio:', error);
        return { 
          success: false, 
          error: `Failed to fetch portfolio: ${error.message}` 
        };
      }

      return { 
        success: true, 
        portfolio 
      };

    } catch (err) {
      console.error('Unexpected error fetching portfolio:', err);
      return { 
        success: false, 
        error: 'An unexpected error occurred while fetching portfolio' 
      };
    }
  }

  /**
   * Ensure user has at least one portfolio, create if needed
   */
  async ensureUserHasPortfolio(userId: string): Promise<{ success: boolean; portfolio?: any; error?: string }> {
    try {
      console.log('🔥 ensureUserHasPortfolio called for userId:', userId);
      
      // First, check if user has any portfolios
      const portfolioResult = await this.getUserPrimaryPortfolio(userId);
      console.log('🔥 getUserPrimaryPortfolio result:', portfolioResult);
      
      if (portfolioResult.success && portfolioResult.portfolio) {
        // User already has a portfolio
        console.log('🔥 User already has portfolio:', portfolioResult.portfolio.id);
        return portfolioResult;
      }

      // User doesn't have a portfolio, create one
      console.log('🔥 User has no portfolio, creating default portfolio for:', userId);
      const createResult = await this.createDefaultPortfolio(userId);
      console.log('🔥 createDefaultPortfolio result:', createResult);
      return createResult;

    } catch (err) {
      console.error('🔥 Unexpected error ensuring user has portfolio:', err);
      return { 
        success: false, 
        error: 'An unexpected error occurred while ensuring portfolio exists' 
      };
    }
  }
}

// Export a singleton instance
export const portfolioService = new PortfolioService();