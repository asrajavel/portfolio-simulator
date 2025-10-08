import xirr from 'xirr';
import { NavEntry } from '../../types/navData';
import { areDatesContinuous, getNthPreviousMonthDate } from '../date/dateUtils';
import { fillMissingNavDates } from '../data/fillMissingNavDates';

export interface SipRollingXirrEntry {
  date: Date;
  xirr: number;
  transactions: Transaction[];
}

export interface Transaction {
  fundIdx: number;
  when: Date;
  nav: number;
  units: number;
  amount: number;
  type: 'buy' | 'sell' | 'rebalance' | 'nil';
  cumulativeUnits: number;
  currentValue: number;
  allocationPercentage?: number;
}

export function calculateSipRollingXirr(
  navDataList: NavEntry[][],
  years: number = 1,
  allocations: number[],
  rebalancingEnabled: boolean = false,
  rebalancingThreshold: number = 5,
  includeNilTransactions: boolean = false
): SipRollingXirrEntry[] {
  if (!isValidInput(navDataList)) return [];

  const months = years * 12;
  const filledNavs = navDataList.map(ensureContinuousDates);
  const fundDateMaps = filledNavs.map(buildDateMap);
  const baseDates = getSortedDates(filledNavs[0]);
  const firstDate = baseDates[0];

  return baseDates.flatMap(date =>
    computeSipXirrForDate(date, fundDateMaps, months, firstDate, allocations, rebalancingEnabled, rebalancingThreshold, includeNilTransactions)
  );
}

function computeSipXirrForDate(
  currentDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  months: number,
  firstDate: Date,
  allocations: number[],
  rebalancingEnabled: boolean,
  rebalancingThreshold: number,
  includeNilTransactions: boolean
): SipRollingXirrEntry[] {
  const { transactions, unitsPerFund } = calculateTransactionsForDate(
    currentDate,
    fundDateMaps,
    months,
    firstDate,
    allocations,
    rebalancingEnabled,
    rebalancingThreshold
  );
  if (!transactions) return [];

  const sells = finalSellingOfAllFunds(currentDate, fundDateMaps, unitsPerFund);
  if (!sells) return [];

  const allTransactions = [...transactions, ...sells];

  // Aggregate cashflows by date (exclude nil transactions since they have amount: 0 and just add overhead)
  const aggregatedCashflowsMap = new Map<string, number>();
  for (const tx of allTransactions) {
    if (tx.type === 'nil') continue; // Skip nil transactions for XIRR calculation
    const dateKey = toDateKey(tx.when);
    const currentAmount = aggregatedCashflowsMap.get(dateKey) || 0;
    aggregatedCashflowsMap.set(dateKey, currentAmount + tx.amount);
  }

  const cashflowsForXirr = Array.from(aggregatedCashflowsMap.entries()).map(([dateStr, amount]) => ({
    amount,
    when: new Date(dateStr), // Convert date string back to Date object
  }));

  // Sort cashflows by date, as xirr might require it (though not explicitly stated, it's good practice)
  cashflowsForXirr.sort((a, b) => a.when.getTime() - b.when.getTime());


  try {
    // The xirr library is expected to throw errors for invalid conditions
    // (e.g., < 2 cashflows, all same sign, non-convergence).
    const calculatedXirrValue = xirr(cashflowsForXirr);

    // Filter out nil transactions from the result to reduce memory usage when sending through worker
    // Nil transactions are useful for testing but cause out-of-memory errors when transferring large datasets
    const transactionsToReturn = includeNilTransactions 
      ? allTransactions 
      : allTransactions.filter(tx => tx.type !== 'nil');

    return [{
      date: currentDate,
      xirr: calculatedXirrValue,
      transactions: transactionsToReturn
    }];
  } catch (error) {
    console.warn(`XIRR calculation failed for date ${currentDate.toISOString()}:`, error);
    // Return empty array instead of throwing, so other dates can still be calculated
    return [];
  }
}

function calculateTransactionsForDate(
  currentDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  months: number,
  firstDate: Date,
  allocations: number[],
  rebalancingEnabled: boolean,
  rebalancingThreshold: number
): { transactions: Transaction[] | null; unitsPerFund: number[] } {
  const totalInvestment = 100;
  const numFunds = fundDateMaps.length;
  const transactions: Transaction[] = [];
  const unitsPerFund = new Array(numFunds).fill(0);
  const cumulativeUnits = new Array(numFunds).fill(0);

  // Pre-generate all SIP dates and find the earliest one
  const sipDates = new Set<string>();
  let earliestSipDate: Date | null = null;
  
  for (let m = months; m >= 1; m--) {
    const sipDate = getNthPreviousMonthDate(currentDate, m);
    if (sipDate < firstDate) return { transactions: null, unitsPerFund };
    
    sipDates.add(toDateKey(sipDate));
    if (!earliestSipDate || sipDate < earliestSipDate) {
      earliestSipDate = sipDate;
    }
  }

  if (!earliestSipDate) return { transactions: null, unitsPerFund };

  // Loop through each day from earliest SIP date to current date (exclusive)
  const loopDate = new Date(earliestSipDate);
  
  while (loopDate < currentDate) {
    const dateKey = toDateKey(loopDate);
    const isSipDate = sipDates.has(dateKey);

    if (isSipDate) {
      // This is a SIP date - process buy transactions
      const transactionsForCurrentSipDate: Transaction[] = [];
      let totalPortfolioValueAfterSip = 0;
      const currentFundValuesAfterSip: number[] = new Array(numFunds).fill(0);

      // 1. Process SIP investments for the current sipDate
      for (let fundIdx = 0; fundIdx < numFunds; fundIdx++) {
        const navMap = fundDateMaps[fundIdx];
        const entry = navMap.get(dateKey);
        if (!entry) return { transactions: null, unitsPerFund };

        const initialAlloc = allocations[fundIdx];
        const investmentAmount = totalInvestment * (initialAlloc / 100);
        const units = investmentAmount / entry.nav;

        cumulativeUnits[fundIdx] += units;
        unitsPerFund[fundIdx] += units; 
        const currentFundValue = cumulativeUnits[fundIdx] * entry.nav;
        currentFundValuesAfterSip[fundIdx] = currentFundValue;
        totalPortfolioValueAfterSip += currentFundValue;
        
        const transaction: Transaction = {
          fundIdx,
          nav: entry.nav,
          when: entry.date,
          units,
          amount: -investmentAmount,
          type: 'buy',
          cumulativeUnits: cumulativeUnits[fundIdx],
          currentValue: currentFundValue,
        };
        transactionsForCurrentSipDate.push(transaction);
      }

      // 2. Calculate allocation percentages for SIP transactions
      for (const tx of transactionsForCurrentSipDate) {
        if (totalPortfolioValueAfterSip > 0) {
          const preRebalanceFundValue = currentFundValuesAfterSip[tx.fundIdx];
          tx.allocationPercentage = (preRebalanceFundValue / totalPortfolioValueAfterSip) * 100;
        } else {
          tx.allocationPercentage = 0;
        }
        transactions.push(tx);
      }

      // 3. Rebalancing Logic for the current sipDate
      if (rebalancingEnabled) {
        let needsRebalancing = false;
        for (let fundIdx = 0; fundIdx < numFunds; fundIdx++) {
          const currentAllocation = (currentFundValuesAfterSip[fundIdx] / totalPortfolioValueAfterSip) * 100;
          const targetAllocation = allocations[fundIdx];
          if (Math.abs(currentAllocation - targetAllocation) > rebalancingThreshold) {
            needsRebalancing = true;
            break;
          }
        }

        if (needsRebalancing && totalPortfolioValueAfterSip > 0) {
          const rebalanceTransactionsForSipDate: Transaction[] = [];
          for (let fundIdx = 0; fundIdx < numFunds; fundIdx++) {
            const navMap = fundDateMaps[fundIdx];
            const entry = navMap.get(dateKey);
            if (!entry) return { transactions: null, unitsPerFund };

            const targetFundValue = totalPortfolioValueAfterSip * (allocations[fundIdx] / 100);
            const rebalanceAmount = targetFundValue - currentFundValuesAfterSip[fundIdx];

            if (Math.abs(rebalanceAmount) > 0.01) {
              const rebalanceUnits = rebalanceAmount / entry.nav;
              
              cumulativeUnits[fundIdx] += rebalanceUnits;
              unitsPerFund[fundIdx] += rebalanceUnits;

              const rebalanceTx: Transaction = {
                fundIdx,
                when: new Date(loopDate),
                nav: entry.nav,
                units: rebalanceUnits,
                amount: -rebalanceAmount,
                type: 'rebalance',
                cumulativeUnits: cumulativeUnits[fundIdx],
                currentValue: cumulativeUnits[fundIdx] * entry.nav,
                allocationPercentage: allocations[fundIdx],
              };
              rebalanceTransactionsForSipDate.push(rebalanceTx);
            }
          }
          transactions.push(...rebalanceTransactionsForSipDate);
        }
      }
    } else {
      // Not a SIP date - create 'nil' transactions showing current holdings
      let totalPortfolioValue = 0;
      const nilTransactions: Transaction[] = [];

      for (let fundIdx = 0; fundIdx < numFunds; fundIdx++) {
        const navMap = fundDateMaps[fundIdx];
        const entry = navMap.get(dateKey);
        if (!entry) return { transactions: null, unitsPerFund };

        const currentValue = cumulativeUnits[fundIdx] * entry.nav;
        totalPortfolioValue += currentValue;

        nilTransactions.push({
          fundIdx,
          when: entry.date,
          nav: entry.nav,
          units: 0,
          amount: 0,
          type: 'nil',
          cumulativeUnits: cumulativeUnits[fundIdx],
          currentValue,
        });
      }

      // Calculate allocation percentages for nil transactions
      for (const tx of nilTransactions) {
        if (totalPortfolioValue > 0) {
          tx.allocationPercentage = (tx.currentValue / totalPortfolioValue) * 100;
        } else {
          tx.allocationPercentage = 0;
        }
        transactions.push(tx);
      }
    }

    // Move to next day
    loopDate.setDate(loopDate.getDate() + 1);
  }

  return { transactions, unitsPerFund };
}

function finalSellingOfAllFunds(
  currentDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  unitsPerFund: number[]
): Transaction[] | null {
  const numFunds = fundDateMaps.length;
  const dateKey = toDateKey(currentDate);
  const sells: Transaction[] = [];

  for (let fundIdx = 0; fundIdx < numFunds; fundIdx++) {
    const navMap = fundDateMaps[fundIdx];
    const entry = navMap.get(dateKey);
    if (!entry) return null;

    const units = unitsPerFund[fundIdx];
    const amount = units * entry.nav;

    sells.push({
      fundIdx,
      nav: entry.nav,
      when: entry.date,
      units,
      amount,
      type: 'sell',
      cumulativeUnits: units, // All units are sold
      currentValue: units * entry.nav,
    });
  }

  return sells;
}

// ────────────── Internal Helpers ────────────── //

function isValidInput(navDataList: NavEntry[][]): boolean {
  return navDataList.length > 0 && !navDataList.some(f => f.length < 2);
}

function ensureContinuousDates(fund: NavEntry[]): NavEntry[] {
  return areDatesContinuous(fund) ? fund : fillMissingNavDates(fund);
}

function buildDateMap(fund: NavEntry[]): Map<string, NavEntry> {
  return new Map(fund.map(entry => [toDateKey(entry.date), entry]));
}

function getSortedDates(fund: NavEntry[]): Date[] {
  return [...fund]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(entry => entry.date);
}

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}