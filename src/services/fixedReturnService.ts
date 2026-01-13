import { AssetNavData } from '../types/asset';

/**
 * Generate synthetic NAV data for fixed return assets
 */
export class FixedReturnService {
  static generateFixedReturnData(
    annualReturnPercentage: number,
    startYear: number = 1990
  ): AssetNavData[] {
    const navData: AssetNavData[] = [];
    const startDate = new Date(Date.UTC(startYear, 0, 1));
    const endDate = new Date();
    
    let currentDate = new Date(startDate);
    const startNav = 100;
    const dailyGrowthFactor = Math.pow(1 + (annualReturnPercentage / 100), 1 / 365.25);
    let dayCount = 0;
    
    while (currentDate <= endDate) {
      const currentNav = startNav * Math.pow(dailyGrowthFactor, dayCount);
      
      navData.push({
        date: new Date(currentDate),
        nav: currentNav
      });
      
      dayCount++;
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return navData;
  }
}

export const fixedReturnService = FixedReturnService;
