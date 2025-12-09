import { Transaction } from '../../sipRollingXirr/types';
import { calculateVolatility, DailyPortfolioValue } from './volatilityCalculator';

export type { DailyPortfolioValue } from './volatilityCalculator';

/**
 * Calculate portfolio volatility for a set of lumpsum transactions
 * 
 * @param transactions - All transactions from investment start to current date
 * @returns Annualized volatility percentage (0 if insufficient data)
 */
export function calculateVolatilityForEntry(
  transactions: Transaction[]
): number {
  // Extract daily portfolio values from transactions
  const dailyValues = extractDailyPortfolioValues(transactions);

  // Calculate volatility from portfolio values
  return calculateVolatility(dailyValues);
}

/**
 * Extract daily portfolio values from transactions
 * Groups transactions by date and sums current values
 */
function extractDailyPortfolioValues(
  transactions: Transaction[]
): DailyPortfolioValue[] {
  // Group by date to get daily portfolio values
  const dailyValuesMap = new Map<string, number>();
  
  for (const tx of transactions) {
    const dateKey = tx.when.toISOString().split('T')[0];
    const existing = dailyValuesMap.get(dateKey) || 0;
    dailyValuesMap.set(dateKey, existing + tx.currentValue);
  }

  // Convert to array and sort by date
  return Array.from(dailyValuesMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateStr, totalValue]) => ({
      date: new Date(dateStr),
      totalValue
    }));
}
