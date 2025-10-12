import { DailyPortfolioValue } from './portfolioValue';

const TRADING_DAYS_PER_YEAR = 252;

/**
 * Calculate portfolio volatility from daily portfolio values
 * Returns annualized volatility as a percentage
 */
export function calculateVolatility(
  dailyValues: DailyPortfolioValue[]
): number {
  // Need at least 2 data points to calculate volatility
  if (dailyValues.length < 2) {
    return 0;
  }

  // Calculate daily returns
  const dailyReturns = calculateDailyReturns(dailyValues);

  // Calculate mean return
  const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

  // Calculate variance
  const variance = dailyReturns.reduce((sum, r) => {
    const diff = r - meanReturn;
    return sum + (diff * diff);
  }, 0) / dailyReturns.length;

  // Calculate standard deviation (daily volatility)
  const dailyVolatility = Math.sqrt(variance);

  // Annualize volatility
  const annualizedVolatility = dailyVolatility * Math.sqrt(TRADING_DAYS_PER_YEAR);

  const volatilityPercent = (annualizedVolatility * 100) || 0;

  return volatilityPercent;
}

/**
 * Calculate daily returns from portfolio values
 * Daily Return = (Today's Value - Yesterday's Value + Cash Flow) / Yesterday's Value
 * 
 * Adjusts for cash flows to get true market returns:
 * - On buy days: valueChange + (-100) removes the 100 investment from the increase
 * - On nil days: valueChange + 0 = no adjustment needed
 * - This isolates the market movement from cash flow effects
 * 
 * Since we include both buy and nil days, the array is continuous (no gaps),
 * so we can simply use array indices instead of date lookups.
 */
function calculateDailyReturns(dailyValues: DailyPortfolioValue[]): number[] {
  const returns: number[] = [];

  // Calculate returns from consecutive days (array is already sorted and continuous)
  for (let i = 1; i < dailyValues.length; i++) {
    const previousEntry = dailyValues[i - 1];
    const currentEntry = dailyValues[i];

    if (previousEntry.totalValue > 0) {
      // Adjust for cash flow to get true market return
      // currentEntry.cashFlow is negative for buy (money out)
      // We ADD cashFlow to remove investment effect from value change
      const valueChange = currentEntry.totalValue - previousEntry.totalValue;
      const marketReturn = (valueChange + currentEntry.cashFlow) / previousEntry.totalValue;
      
      returns.push(marketReturn);
    }
  }

  return returns;
}

