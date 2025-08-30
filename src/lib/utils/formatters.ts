/**
 * Formatting utilities for numbers and currency
 */

// Format number with thousand separators
export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  
  return num.toLocaleString('en-US');
};

// Remove formatting from number string
export const unformatNumber = (value: string): string => {
  if (!value) return '';
  return value.replace(/,/g, '');
};

// Format currency with thousand separators (for display)
export const formatCurrency = (
  amount: number | string | null | undefined, 
  showDecimals: boolean = false
): string => {
  if (amount === null || amount === undefined || amount === '') return '$0';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0';
  
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  };
  
  return num.toLocaleString('en-US', options);
};

// Format compact currency (e.g., $1.2K, $1.2M)
export const formatCompactCurrency = (amount: number): string => {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};