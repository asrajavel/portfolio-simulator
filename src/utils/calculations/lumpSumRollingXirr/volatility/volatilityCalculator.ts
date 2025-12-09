const TRADING_DAYS_PER_YEAR = 252;

export interface DailyPortfolioValue {
  date: Date;
  totalValue: number;
}

/**
 * Calculate portfolio volatility from daily portfolio values
 * Returns annualized volatility as a percentage
 * 
 * Lumpsum version is simpler than SIP since there are no intermediate cash flows
 * to adjust for - just a single investment at start
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

  // Annualize volatility using standard 252 trading days
  const annualizedVolatility = dailyVolatility * Math.sqrt(TRADING_DAYS_PER_YEAR);

  const volatilityPercent = (annualizedVolatility * 100) || 0;

  return volatilityPercent;
}

/**
 * Calculate daily returns from portfolio values
 * Daily Return = (Today's Value / Yesterday's Value) - 1
 * 
 * Simpler than SIP since lumpsum has no intermediate cash flows
 * Just pure market returns on the invested capital
 */
function calculateDailyReturns(dailyValues: DailyPortfolioValue[]): number[] {
  const returns: number[] = [];

  for (let i = 1; i < dailyValues.length; i++) {
    const previousValue = dailyValues[i - 1].totalValue;
    const currentValue = dailyValues[i].totalValue;

    if (previousValue > 0) {
      const dailyReturn = (currentValue / previousValue) - 1;
      returns.push(dailyReturn);
    }
  }

  return returns;
}
