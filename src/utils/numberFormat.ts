/**
 * Utility functions for number formatting using Indian locale
 */

/**
 * Format a number with Indian locale formatting (commas)
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Parse a formatted number string back to a number
 * Removes all non-numeric characters
 */
export const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format a number as Indian currency (₹)
 */
export const formatCurrency = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
  }).format(num);
};

