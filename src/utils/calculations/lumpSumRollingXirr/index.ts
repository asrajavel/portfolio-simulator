import xirr from 'xirr';
import { NavEntry } from '../../../types/navData';
import { areDatesContinuous, getNthPreviousMonthDate } from '../../date/dateUtils';
import { fillMissingNavDates } from '../../data/fillMissingNavDates';

/**
 * Helper to create a date key for map lookups (same as SIP)
 */
function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Helper to build a date map for O(1) lookups (same as SIP)
 */
function buildDateMap(fund: NavEntry[]): Map<string, NavEntry> {
  return new Map(fund.map(entry => [toDateKey(entry.date), entry]));
}

export interface RollingXirrEntry {
  date: Date;
  xirr: number;
  transactions: { nav: number; when: Date }[];
  volatility?: number;
}

/**
 * Calculates lump sum rolling XIRR for a portfolio of funds.
 * Each fund's NAV data should be provided as an array in the input array.
 * Investments are allocated according to the allocations array.
 *
 * @param navDataList Array of arrays of NavEntry (one per fund)
 * @param years Rolling window size in years (default 1)
 * @param allocations Array of allocation percentages (default: equal split)
 * @param investmentAmount Total investment amount (default 100)
 */
export function calculateLumpSumRollingXirr(
  navDataList: NavEntry[][],
  years: number = 1,
  allocations: number[] = [],
  investmentAmount: number = 100
): RollingXirrEntry[] {
  // Ensure we have at least one fund with at least 2 entries
  if (navDataList.length === 0 || navDataList.some(fund => fund.length < 2)) {
    return [];
  }

  const numFunds = navDataList.length;
  
  // Use provided allocations or default to equal split
  const actualAllocations = allocations.length === numFunds 
    ? allocations 
    : Array(numFunds).fill(100 / numFunds);
  
  const filledNavs = navDataList.map(fund => {
    let data = fund;
    if (!areDatesContinuous(data)) {
      data = fillMissingNavDates(data);
    }
    return data;
  });

  // Build date maps for O(1) lookups (same as SIP for performance)
  const fundDateMaps = filledNavs.map(buildDateMap);

  // Get a consolidated list of dates from the first fund (after filling)
  const sorted = [...filledNavs[0]].sort((a, b) => a.date.getTime() - b.date.getTime());
  const dateList = sorted.map(entry => entry.date);
  const result: RollingXirrEntry[] = [];
  const firstDate = dateList[0];
  const months = 12 * years;

  for (let i = 0; i < dateList.length; i++) {
    const endDate = dateList[i];
    const startDate = getNthPreviousMonthDate(endDate, months);
    if (startDate < firstDate) continue;
    
    // Find start index in the first fund (all funds should be aligned after filling)
    const startIdx = sorted.findIndex(entry =>
      entry.date.getFullYear() === startDate.getFullYear() &&
      entry.date.getMonth() === startDate.getMonth() &&
      entry.date.getDate() === startDate.getDate()
    );
    if (startIdx === -1) continue;

    // For each fund, calculate units bought at start and value at end
    const fundUnits: number[] = [];
    let valid = true;
    
    // Calculate units purchased for each fund based on allocations
    for (let f = 0; f < numFunds; f++) {
      const startEntry = fundDateMaps[f].get(toDateKey(startDate));
      
      if (!startEntry) { 
        valid = false; 
        break; 
      }
      
      const fundAllocation = (investmentAmount * actualAllocations[f]) / 100;
      fundUnits[f] = fundAllocation / startEntry.nav;
    }
    
    if (!valid) continue;
    
    // Calculate total portfolio value at end date
    let totalValue = 0;
    for (let f = 0; f < numFunds; f++) {
      const endEntry = fundDateMaps[f].get(toDateKey(endDate));
      
      if (!endEntry) { 
        valid = false; 
        break; 
      }
      
      totalValue += fundUnits[f] * endEntry.nav;
    }
    
    if (!valid) continue;

    // Prepare transactions for XIRR
    const xirrTransactions = [
      { amount: -investmentAmount, when: startDate },
      { amount: totalValue, when: endDate }
    ];
    
    // Match the expected interface format
    const transactions = [
      { nav: investmentAmount, when: startDate },
      { nav: totalValue, when: endDate }
    ];
    
    let rate: number;
    try {
      rate = xirr(xirrTransactions);
    } catch {
      continue; // Skip if XIRR calculation fails
    }
    
    // Calculate daily portfolio values for this specific period
    const periodDailyValues = calculatePeriodDailyPortfolioValues(
      fundDateMaps,
      fundUnits,
      sorted,
      startDate,
      endDate
    );
    
    // Calculate volatility from daily values
    const volatility = calculateVolatilityFromDailyValues(periodDailyValues);
    
    result.push({ 
      date: endDate, 
      xirr: rate, 
      transactions,
      volatility: Math.round(volatility * 10000) / 10000 // Round to 4 decimal places
    });
  }
  
  return result;
}

/**
 * Calculate daily portfolio values for a specific rolling period
 * Similar to SIP pattern - each period calculates its own daily values independently
 * Uses date maps for O(1) lookups instead of O(n) array scans
 */
function calculatePeriodDailyPortfolioValues(
  fundDateMaps: Map<string, NavEntry>[],
  fundUnits: number[],
  sorted: NavEntry[],
  startDate: Date,
  endDate: Date
): Array<{ date: Date; totalValue: number }> {
  const numFunds = fundDateMaps.length;
  const dailyValues: Array<{ date: Date; totalValue: number }> = [];
  
  // Filter dates within the period
  const periodDates = sorted.filter(
    entry => entry.date >= startDate && entry.date <= endDate
  );
  
  // Calculate total portfolio value for each day in the period
  for (const dateEntry of periodDates) {
    let totalValue = 0;
    let valid = true;

    for (let f = 0; f < numFunds; f++) {
      const navEntry = fundDateMaps[f].get(toDateKey(dateEntry.date));
      
      if (!navEntry) {
        valid = false;
        break;
      }
      
      totalValue += fundUnits[f] * navEntry.nav;
    }

    if (valid && totalValue > 0) {
      dailyValues.push({
        date: dateEntry.date,
        totalValue
      });
    }
  }

  return dailyValues;
}

/**
 * Calculate volatility from daily portfolio values
 * Simple version - no cash flow adjustments needed for lumpsum
 */
function calculateVolatilityFromDailyValues(
  dailyValues: Array<{ date: Date; totalValue: number }>
): number {
  if (dailyValues.length < 2) return 0;

  // Calculate daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < dailyValues.length; i++) {
    const prevValue = dailyValues[i - 1].totalValue;
    const currValue = dailyValues[i].totalValue;
    
    if (prevValue > 0) {
      const dailyReturn = (currValue / prevValue) - 1;
      dailyReturns.push(dailyReturn);
    }
  }

  if (dailyReturns.length < 2) return 0;

  // Calculate std dev
  const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);

  // Annualize (252 trading days)
  return stdDev * Math.sqrt(252) * 100;
} 