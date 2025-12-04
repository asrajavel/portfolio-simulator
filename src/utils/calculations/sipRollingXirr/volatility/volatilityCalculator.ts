import { DailySipPortfolioValue } from './sipPortfolioValue';

const TRADING_DAYS_PER_YEAR = 252;

/**
 * Calculate portfolio volatility from daily portfolio values
 * Returns annualized volatility as a percentage
 * 
 * Automatically excludes forward-filled weekends/holidays (where value didn't change)
 * and adjusts annualization based on actual trading days in the data
 */
export function calculateVolatility(
  dailyValues: DailySipPortfolioValue[]
): number {
  // Need at least 2 data points to calculate volatility
  if (dailyValues.length < 2) {
    return 0;
  }

  // Calculate daily returns (excludes forward-filled non-trading days)
  const dailyReturns = calculateDailyReturns(dailyValues);

  // Need at least 2 returns to calculate volatility
  if (dailyReturns.length < 2) {
    return 0;
  }

  // Calculate mean return
  const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

  // Calculate variance
  const variance = dailyReturns.reduce((sum, r) => {
    const diff = r - meanReturn;
    return sum + (diff * diff);
  }, 0) / dailyReturns.length;

  // Calculate standard deviation (daily volatility)
  const dailyVolatility = Math.sqrt(variance);

  // Calculate trading days per year based on actual data
  // If we have 365 days but only 252 returns (69% ratio), annualize accordingly
  const totalDays = dailyValues.length - 1; // Subtract 1 since we calculate returns between days
  const tradingDays = dailyReturns.length;
  const tradingDaysPerYear = totalDays > 0 
    ? Math.round((tradingDays / totalDays) * 365)
    : TRADING_DAYS_PER_YEAR; // Default to 252 if calculation fails

  // Annualize volatility using calculated trading days
  const annualizedVolatility = dailyVolatility * Math.sqrt(tradingDaysPerYear);

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
 * Skips forward-filled days (weekends/holidays) where:
 * - Portfolio value didn't change AND
 * - No cash flow occurred (no actual transaction)
 * This prevents artificially low volatility from zero returns on non-trading days
 */
function calculateDailyReturns(dailyValues: DailySipPortfolioValue[]): number[] {
  const returns: number[] = [];

  // Calculate returns from consecutive days (array is already sorted and continuous)
  for (let i = 1; i < dailyValues.length; i++) {
    const previousEntry = dailyValues[i - 1];
    const currentEntry = dailyValues[i];

    if (previousEntry.totalValue > 0) {
      const valueChange = currentEntry.totalValue - previousEntry.totalValue;
      
      // Skip forward-filled days (weekends/holidays) where value didn't change and no cash flow
      // This prevents artificially low volatility from zero returns on non-trading days
      if (valueChange === 0 && currentEntry.cashFlow === 0) {
        continue; // Skip this day - it's a forward-filled non-trading day
      }
      
      // Adjust for cash flow to get true market return
      // currentEntry.cashFlow is negative for buy (money out)
      // We ADD cashFlow to remove investment effect from value change
      const marketReturn = (valueChange + currentEntry.cashFlow) / previousEntry.totalValue;
      
      returns.push(marketReturn);
    }
  }

  return returns;
}

