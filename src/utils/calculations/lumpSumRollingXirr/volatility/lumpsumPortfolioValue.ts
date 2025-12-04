import { NavEntry } from '../../../../types/navData';

export interface DailyLumpsumPortfolioValue {
  date: Date;
  totalValue: number;
}

/**
 * Calculate daily portfolio values for a lumpsum investment
 * Much simpler than SIP - units are fixed from day 1, just multiply by NAV each day
 * 
 * @param navDataList - NAV data for each fund
 * @param startDate - Investment start date
 * @param endDate - Investment end date
 * @param allocations - Allocation percentages for each fund
 * @param investmentAmount - Total lumpsum amount
 */
export function calculateDailyLumpsumPortfolioValue(
  navDataList: NavEntry[][],
  startDate: Date,
  endDate: Date,
  allocations: number[],
  investmentAmount: number
): DailyLumpsumPortfolioValue[] {
  if (navDataList.length === 0 || navDataList.length !== allocations.length) {
    return [];
  }

  // Calculate units purchased on day 1 for each fund
  const unitsPerFund: number[] = [];
  for (let f = 0; f < navDataList.length; f++) {
    const startNav = navDataList[f].find(entry => 
      entry.date.getTime() === startDate.getTime()
    );
    
    if (!startNav) {
      return [];
    }
    
    const fundAllocation = (investmentAmount * allocations[f]) / 100;
    unitsPerFund[f] = fundAllocation / startNav.nav;
  }

  // Calculate portfolio value for each day
  const dailyValues: DailyLumpsumPortfolioValue[] = [];
  
  // Use first fund's dates as reference (all should be aligned after filling)
  const relevantDates = navDataList[0].filter(
    entry => entry.date >= startDate && entry.date <= endDate
  );

  for (const dateEntry of relevantDates) {
    const currentDate = dateEntry.date;
    let totalValue = 0;
    let valid = true;

    // Sum value across all funds
    for (let f = 0; f < navDataList.length; f++) {
      const navEntry = navDataList[f].find(
        entry => entry.date.getTime() === currentDate.getTime()
      );
      
      if (!navEntry) {
        valid = false;
        break;
      }
      
      totalValue += unitsPerFund[f] * navEntry.nav;
    }

    if (valid && totalValue > 0) {
      dailyValues.push({
        date: currentDate,
        totalValue
      });
    }
  }

  return dailyValues;
}

