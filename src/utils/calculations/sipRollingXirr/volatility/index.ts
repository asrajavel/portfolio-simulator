import { Transaction } from '../types';
import { calculateDailySipPortfolioValue } from './sipPortfolioValue';
import { calculateVolatility } from './volatilityCalculator';

export type { DailySipPortfolioValue } from './sipPortfolioValue';

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
  const dailyValues = calculateDailySipPortfolioValue(transactions);

  // Calculate volatility from portfolio values
  return calculateVolatility(dailyValues);
}

