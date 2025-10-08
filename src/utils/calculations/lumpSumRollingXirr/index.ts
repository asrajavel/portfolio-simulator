import xirr from 'xirr';
import { NavEntry } from '../../../types/navData';
import { areDatesContinuous, getNthPreviousMonthDate } from '../../date/dateUtils';
import { fillMissingNavDates } from '../../data/fillMissingNavDates';

export interface RollingXirrEntry {
  date: Date;
  xirr: number;
  transactions: { nav: number; when: Date }[];
}

/**
 * Calculates lump sum rolling XIRR for a portfolio of funds.
 * Each fund's NAV data should be provided as an array in the input array.
 * Investments are split equally across all funds.
 *
 * @param navDataList Array of arrays of NavEntry (one per fund)
 * @param years Rolling window size in years (default 1)
 * @param investmentAmount Total investment amount (default 100)
 */
export function calculateLumpSumRollingXirr(
  navDataList: NavEntry[][],
  years: number = 1,
  investmentAmount: number = 100
): RollingXirrEntry[] {
  // Ensure we have at least one fund with at least 2 entries
  if (navDataList.length === 0 || navDataList.some(fund => fund.length < 2)) {
    return [];
  }

  const numFunds = navDataList.length;
  const filledNavs = navDataList.map(fund => {
    let data = fund;
    if (!areDatesContinuous(data)) {
      data = fillMissingNavDates(data);
    }
    return data;
  });

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
    
    // Calculate units purchased for each fund with equal allocation
    for (let f = 0; f < numFunds; f++) {
      const fundNav = filledNavs[f];
      const startEntry = fundNav.find(entry => 
        entry.date.getFullYear() === startDate.getFullYear() &&
        entry.date.getMonth() === startDate.getMonth() &&
        entry.date.getDate() === startDate.getDate()
      );
      
      if (!startEntry) { 
        valid = false; 
        break; 
      }
      
      const fundAllocation = investmentAmount / numFunds;
      fundUnits[f] = fundAllocation / startEntry.nav;
    }
    
    if (!valid) continue;
    
    // Calculate total portfolio value at end date
    let totalValue = 0;
    for (let f = 0; f < numFunds; f++) {
      const fundNav = filledNavs[f];
      const endEntry = fundNav.find(entry => 
        entry.date.getFullYear() === endDate.getFullYear() &&
        entry.date.getMonth() === endDate.getMonth() &&
        entry.date.getDate() === endDate.getDate()
      );
      
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
    
    result.push({ date: endDate, xirr: rate, transactions });
  }
  
  return result;
} 