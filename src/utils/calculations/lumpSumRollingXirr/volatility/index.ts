import { NavEntry } from '../../../../types/navData';
import { calculateDailyLumpsumPortfolioValue } from './lumpsumPortfolioValue';
import { calculateLumpsumVolatility } from './volatilityCalculator';

export type { DailyLumpsumPortfolioValue } from './lumpsumPortfolioValue';

/**
 * Calculate portfolio volatility for a lumpsum investment period
 * 
 * @param navDataList - NAV data for each fund
 * @param startDate - Investment start date
 * @param endDate - Investment end date
 * @param allocations - Allocation percentages for each fund
 * @param investmentAmount - Total lumpsum amount
 * @returns Annualized volatility percentage (0 if insufficient data)
 */
export function calculateVolatilityForLumpsumEntry(
  navDataList: NavEntry[][],
  startDate: Date,
  endDate: Date,
  allocations: number[],
  investmentAmount: number
): number {
  // Calculate daily portfolio values
  const dailyValues = calculateDailyLumpsumPortfolioValue(
    navDataList,
    startDate,
    endDate,
    allocations,
    investmentAmount
  );

  // Calculate volatility from daily values
  return calculateLumpsumVolatility(dailyValues);
}

