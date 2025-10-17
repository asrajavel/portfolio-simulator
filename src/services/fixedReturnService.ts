import { InstrumentNavData } from '../types/instrument';

/**
 * Service to generate synthetic NAV data for fixed return instruments
 */
export class FixedReturnService {
  /**
   * Generate daily NAV data for a fixed annual return percentage
   * @param annualReturnPercentage - The annual return percentage (e.g., 8 for 8%)
   * @param startYear - Starting year for data generation (default: 1990)
   * @returns Array of NAV data with daily entries
   */
  static generateFixedReturnData(
    annualReturnPercentage: number,
    startYear: number = 1990
  ): InstrumentNavData[] {
    const navData: InstrumentNavData[] = [];
    // Create UTC dates to avoid timezone issues (consistent with index service)
    const startDate = new Date(Date.UTC(startYear, 0, 1)); // January 1 of start year, UTC
    const endDate = new Date(); // Today
    
    let currentDate = new Date(startDate);
    const startNav = 100; // Starting NAV
    
    while (currentDate <= endDate) {
      // Skip weekends (Saturday = 6, Sunday = 0) to match trading day behavior of other instruments
      // Use UTC methods to avoid timezone issues
      const dayOfWeek = currentDate.getUTCDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        continue;
      }
      
      // Calculate days since start (calendar days, not trading days)
      const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // For fixed returns, use simple daily compounding with high precision
      // Daily rate = (1 + annual_rate)^(1/365.25) - 1
      const dailyGrowthFactor = Math.pow(1 + (annualReturnPercentage / 100), 1 / 365.25);
      const currentNav = startNav * Math.pow(dailyGrowthFactor, daysSinceStart);
      
      // Round to eliminate floating point precision errors that cause fake volatility
      const roundedNav = Math.round(currentNav * 100000) / 100000; // 5 decimal places
      
      navData.push({
        date: new Date(currentDate),
        nav: roundedNav
      });
      
      // Move to next day using UTC methods
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return navData;
  }
}

export const fixedReturnService = FixedReturnService;