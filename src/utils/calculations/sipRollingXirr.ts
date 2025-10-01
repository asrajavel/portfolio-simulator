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
  type: 'buy' | 'sell' | 'rebalance';
  cumulativeUnits: number;
  currentValue: number;
  allocationPercentage?: number;
}

export function calculateSipRollingXirr(
  navDataList: NavEntry[][],
  years: number = 1,
  allocations: number[],
  rebalancingEnabled: boolean = false,
  rebalancingThreshold: number = 5
): SipRollingXirrEntry[] {
  if (!isValidInput(navDataList)) return [];

  const months = years * 12;
  const filledNavs = navDataList.map(ensureContinuousDates);
  const fundDateMaps = filledNavs.map(buildDateMap);
  const baseDates = getSortedDates(filledNavs[0]);
  const firstDate = baseDates[0];

  return baseDates.flatMap(date =>
    computeSipXirrForDate(date, fundDateMaps, months, firstDate, allocations, rebalancingEnabled, rebalancingThreshold)
  );
}

function computeSipXirrForDate(
  currentDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  months: number,
  firstDate: Date,
  allocations: number[],
  rebalancingEnabled: boolean,
  rebalancingThreshold: number
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

  // Aggregate cashflows by date
  const aggregatedCashflowsMap = new Map<string, number>();
  for (const tx of allTransactions) {
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

    return [{
      date: currentDate,
      xirr: calculatedXirrValue,
      transactions: allTransactions // Return original, non-aggregated transactions for display
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

  for (let m = months; m >= 1; m--) {
    const sipDate = getNthPreviousMonthDate(currentDate, m);
    if (sipDate < firstDate) return { transactions: null, unitsPerFund };

    const dateKey = toDateKey(sipDate);
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
      // unitsPerFund tracks total units for final sale, so add SIP units here
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
        // For the SIP transaction row, show allocation *before* rebalancing on this date
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
          const entry = navMap.get(dateKey); // NAV for rebalancing
          if (!entry) return { transactions: null, unitsPerFund }; // Should not happen if SIP was processed

          const targetFundValue = totalPortfolioValueAfterSip * (allocations[fundIdx] / 100);
          const rebalanceAmount = targetFundValue - currentFundValuesAfterSip[fundIdx];

          if (Math.abs(rebalanceAmount) > 0.01) { // Only process significant rebalances
            const rebalanceUnits = rebalanceAmount / entry.nav;
            
            cumulativeUnits[fundIdx] += rebalanceUnits; // Update cumulative units with rebalanced units
            unitsPerFund[fundIdx] += rebalanceUnits;    // Also update unitsPerFund for final sale

            const rebalanceTx: Transaction = {
              fundIdx,
              when: sipDate,
              nav: entry.nav,
              units: rebalanceUnits, // can be negative
              amount: -rebalanceAmount, // Store buy as negative, sell as positive
              type: 'rebalance',
              cumulativeUnits: cumulativeUnits[fundIdx],
              currentValue: cumulativeUnits[fundIdx] * entry.nav, // Value after rebalance
              allocationPercentage: allocations[fundIdx], // Post-rebalance, it should be the target
            };
            rebalanceTransactionsForSipDate.push(rebalanceTx);
          }
        }
        // Add rebalance transactions to the main list
        transactions.push(...rebalanceTransactionsForSipDate);
      }
    }
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