import xirr from 'xirr';
import { NavEntry } from '../../../types/navData';
import { areDatesContinuous, getNthPreviousMonthDate } from '../../date/dateUtils';
import { fillMissingNavDates } from '../../data/fillMissingNavDates';
import { calculateVolatilityForEntry } from './volatility';
import { Transaction } from '../sipRollingXirr/types';

// ============================================================================
// TYPES
// ============================================================================

export interface RollingXirrEntry {
  date: Date;
  xirr: number;
  transactions: Transaction[];
  volatility?: number;
}

// Re-export Transaction for convenience
export type { Transaction } from '../sipRollingXirr/types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function buildDateMap(fund: NavEntry[]): Map<string, NavEntry> {
  return new Map(fund.map(entry => [toDateKey(entry.date), entry]));
}

function ensureContinuousDates(fund: NavEntry[]): NavEntry[] {
  return areDatesContinuous(fund) ? fund : fillMissingNavDates(fund);
}

function isValidInput(navDataList: NavEntry[][]): boolean {
  return navDataList.length > 0 && navDataList.every(fund => fund.length >= 2);
}

function getSortedDates(fund: NavEntry[]): NavEntry[] {
  return [...fund].sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate Lumpsum Rolling XIRR for given NAV data
 * 
 * @param navDataList - Array of NAV data for each fund
 * @param years - Rolling period in years (default: 1)
 * @param allocations - Target allocation percentages for each fund (default: equal split)
 * @param investmentAmount - Total investment amount (default: 100)
 * @param includeNilTransactions - Whether to include nil transactions in result (default: false)
 * @returns Array of Lumpsum Rolling XIRR entries for each date
 */
export function calculateLumpSumRollingXirr(
  navDataList: NavEntry[][],
  years: number = 1,
  allocations: number[] = [],
  investmentAmount: number = 100,
  includeNilTransactions: boolean = false
): RollingXirrEntry[] {
  // Validate input
  if (!isValidInput(navDataList)) return [];

  // Prepare data
  const numFunds = navDataList.length;
  const actualAllocations = allocations.length === numFunds 
    ? allocations 
    : Array(numFunds).fill(100 / numFunds);
  
  const filledNavs = navDataList.map(ensureContinuousDates);
  const fundDateMaps = filledNavs.map(buildDateMap);
  const sorted = getSortedDates(filledNavs[0]);
  const firstDate = sorted[0].date;
  const months = years * 12;

  // Calculate XIRR for each date
  return sorted.flatMap(entry =>
    computeLumpsumXirrForDate(
      entry.date,
      fundDateMaps,
      sorted,
      firstDate,
      months,
      actualAllocations,
      investmentAmount,
      includeNilTransactions
    )
  );
}

// ============================================================================
// CORE COMPUTATION
// ============================================================================

/**
 * Compute Lumpsum XIRR for a single date
 * This is the orchestration function that coordinates all calculations
 */
function computeLumpsumXirrForDate(
  endDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  sorted: NavEntry[],
  firstDate: Date,
  months: number,
  allocations: number[],
  investmentAmount: number,
  includeNilTransactions: boolean
): RollingXirrEntry[] {
  // Calculate start date
  const startDate = getNthPreviousMonthDate(endDate, months);
  if (startDate < firstDate) return [];

  // Calculate units purchased at start for each fund
  const fundUnits = calculateFundUnits(
    fundDateMaps,
    startDate,
    allocations,
    investmentAmount
  );
  if (!fundUnits) return [];

  // Calculate total portfolio value at end date
  const totalValue = calculateTotalValue(fundDateMaps, endDate, fundUnits);
  if (totalValue === null) return [];

  // Calculate XIRR
  const xirrValue = calculateXirr(investmentAmount, totalValue, startDate, endDate);
  if (xirrValue === null) return [];

  // Build detailed transactions and calculate volatility
  const allTransactions = buildDetailedTransactions(
    fundDateMaps,
    fundUnits,
    allocations,
    sorted,
    startDate,
    endDate,
    investmentAmount
  );

  const volatility = calculateVolatilityForEntry(allTransactions);

  // Filter nil transactions if not needed (for memory efficiency)
  const transactionsToReturn = includeNilTransactions
    ? allTransactions
    : allTransactions.filter(tx => tx.type !== 'nil');

  return [{
    date: endDate,
    xirr: Math.round(xirrValue * 10000) / 10000,
    transactions: transactionsToReturn,
    volatility: Math.round(volatility * 10000) / 10000
  }];
}

/**
 * Calculate units purchased for each fund at start date
 */
function calculateFundUnits(
  fundDateMaps: Map<string, NavEntry>[],
  startDate: Date,
  allocations: number[],
  investmentAmount: number
): number[] | null {
  const fundUnits: number[] = [];
  const startKey = toDateKey(startDate);

  for (let f = 0; f < fundDateMaps.length; f++) {
    const startEntry = fundDateMaps[f].get(startKey);
    if (!startEntry) return null;
    
    const fundAllocation = (investmentAmount * allocations[f]) / 100;
    fundUnits[f] = fundAllocation / startEntry.nav;
  }

  return fundUnits;
}

/**
 * Calculate total portfolio value at end date
 */
function calculateTotalValue(
  fundDateMaps: Map<string, NavEntry>[],
  endDate: Date,
  fundUnits: number[]
): number | null {
  let totalValue = 0;
  const endKey = toDateKey(endDate);

  for (let f = 0; f < fundDateMaps.length; f++) {
    const endEntry = fundDateMaps[f].get(endKey);
    if (!endEntry) return null;
    
    totalValue += fundUnits[f] * endEntry.nav;
  }

  return totalValue;
}

/**
 * Calculate XIRR from initial investment and final value
 */
function calculateXirr(
  investmentAmount: number,
  totalValue: number,
  startDate: Date,
  endDate: Date
): number | null {
  try {
    return xirr([
      { amount: -investmentAmount, when: startDate },
      { amount: totalValue, when: endDate }
    ]);
  } catch {
    return null;
  }
}

/**
 * Build detailed transactions for all dates in the period
 */
function buildDetailedTransactions(
  fundDateMaps: Map<string, NavEntry>[],
  fundUnits: number[],
  allocations: number[],
  sorted: NavEntry[],
  startDate: Date,
  endDate: Date,
  investmentAmount: number
): Transaction[] {
  const transactions: Transaction[] = [];
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);
  
  // Filter dates within the period
  const periodDates = sorted.filter(
    entry => entry.date >= startDate && entry.date <= endDate
  );
  
  // Generate transactions for each day
  for (const dateEntry of periodDates) {
    const dateKey = toDateKey(dateEntry.date);
    const isStartDate = dateKey === startKey;
    const isEndDate = dateKey === endKey;
    let totalPortfolioValue = 0;
    const dayTransactions: Transaction[] = [];

    // Create transaction for each fund
    for (let fundIdx = 0; fundIdx < fundDateMaps.length; fundIdx++) {
      const navEntry = fundDateMaps[fundIdx].get(dateKey);
      if (!navEntry) continue;

      const currentValue = fundUnits[fundIdx] * navEntry.nav;
      totalPortfolioValue += currentValue;
      const fundAllocation = (investmentAmount * allocations[fundIdx]) / 100;
      
      // Determine transaction type and amount
      let type: 'buy' | 'sell' | 'nil' = 'nil';
      let amount = 0;
      
      if (isStartDate) {
        type = 'buy';
        amount = -fundAllocation;
      } else if (isEndDate) {
        type = 'sell';
        amount = currentValue;
      }

      dayTransactions.push({
        fundIdx,
        nav: navEntry.nav,
        when: navEntry.date,
        units: fundUnits[fundIdx],
        amount,
        type,
        cumulativeUnits: fundUnits[fundIdx],
        currentValue,
        allocationPercentage: 0 // Calculated below
      });
    }

    // Calculate allocation percentages
    dayTransactions.forEach(tx => {
      tx.allocationPercentage = totalPortfolioValue > 0 
        ? (tx.currentValue / totalPortfolioValue) * 100 
        : 0;
    });

    transactions.push(...dayTransactions);
  }

  return transactions;
}

// ============================================================================
// ON-DEMAND RECALCULATION
// ============================================================================

/**
 * Recalculate transactions for a specific date with nil transactions included
 * Used for on-demand calculation when viewing transaction details in modal
 * 
 * @param navDataList - Array of NAV data for each fund
 * @param targetDate - The specific date to recalculate for
 * @param years - Rolling period in years
 * @param allocations - Target allocation percentages for each fund
 * @param investmentAmount - Total investment amount
 * @returns Transaction array with nil transactions included, or null if calculation fails
 */
export function recalculateLumpsumTransactionsForDate(
  navDataList: NavEntry[][],
  targetDate: Date,
  years: number,
  allocations: number[],
  investmentAmount: number = 100
): Transaction[] | null {
  // Validate input
  if (!isValidInput(navDataList)) return null;

  // Prepare data
  const numFunds = navDataList.length;
  const actualAllocations = allocations.length === numFunds 
    ? allocations 
    : Array(numFunds).fill(100 / numFunds);
  
  const filledNavs = navDataList.map(ensureContinuousDates);
  const fundDateMaps = filledNavs.map(buildDateMap);
  const sorted = getSortedDates(filledNavs[0]);
  const firstDate = sorted[0].date;
  const months = years * 12;

  // Calculate start date
  const startDate = getNthPreviousMonthDate(targetDate, months);
  if (startDate < firstDate) return null;

  // Calculate fund units
  const fundUnits = calculateFundUnits(
    fundDateMaps,
    startDate,
    actualAllocations,
    investmentAmount
  );
  if (!fundUnits) return null;

  // Build detailed transactions (with nil included)
  const allTransactions = buildDetailedTransactions(
    fundDateMaps,
    fundUnits,
    actualAllocations,
    sorted,
    startDate,
    targetDate,
    investmentAmount
  );

  return allTransactions;
}
