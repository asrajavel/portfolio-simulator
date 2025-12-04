import { DailyLumpsumPortfolioValue } from './lumpsumPortfolioValue';

/**
 * Calculate annualized volatility from daily portfolio values
 * Simpler than SIP - no cash flow adjustments needed
 * 
 * @param dailyValues - Daily portfolio values
 * @returns Annualized volatility (standard deviation of returns)
 */
export function calculateLumpsumVolatility(
  dailyValues: DailyLumpsumPortfolioValue[]
): number {
  if (dailyValues.length < 2) {
    return 0;
  }

  // Calculate daily returns
  const dailyReturns: number[] = [];
  
  for (let i = 1; i < dailyValues.length; i++) {
    const prevValue = dailyValues[i - 1].totalValue;
    const currValue = dailyValues[i].totalValue;
    
    if (prevValue > 0) {
      // Simple return: (today / yesterday) - 1
      const dailyReturn = (currValue / prevValue) - 1;
      dailyReturns.push(dailyReturn);
    }
  }

  if (dailyReturns.length < 2) {
    return 0;
  }

  // Calculate standard deviation of daily returns
  const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);

  // Annualize volatility (252 trading days per year)
  const annualizedVolatility = stdDev * Math.sqrt(252);

  return annualizedVolatility;
}

