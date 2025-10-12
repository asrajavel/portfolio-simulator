import { Transaction } from '../types';
import { calculateDailyPortfolioValue } from './portfolioValue';
import { calculateVolatility } from './volatilityCalculator';

export type { DailyPortfolioValue } from './portfolioValue';

/**
 * Calculate portfolio volatility for a set of transactions
 * 
 * @param transactions - All transactions from SIP start to current date
 * @returns Annualized volatility percentage (0 if insufficient data)
 */
export function calculateVolatilityForEntry(
  transactions: Transaction[]
): number {
  // Calculate daily portfolio values using actual drifting allocations
  const dailyValues = calculateDailyPortfolioValue(transactions);

  // Calculate volatility from portfolio values
  return calculateVolatility(dailyValues);
}

