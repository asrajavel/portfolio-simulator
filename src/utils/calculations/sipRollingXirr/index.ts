import { NavEntry } from '../../../types/navData';
import { SipRollingXirrEntry, Transaction } from './types';
import { isValidInput, ensureContinuousDates, buildDateMap, getSortedDates } from './core/helpers';
import { calculateTransactionsForDate, calculateTransactionsForDateWithNil } from './core/transactionBuilder';
import { calculateXirrFromTransactions } from './core/xirrCalculator';
import { calculateVolatility } from './volatility/volatilityCalculator';

// Re-export types for backward compatibility
export type { SipRollingXirrEntry, Transaction } from './types';

// Timing accumulators for performance analysis
let _xirrTime = 0;
let _volatilityTime = 0;
let _transactionTime = 0;

/**
 * Calculate SIP Rolling XIRR for given NAV data
 * 
 * @param navDataList - Array of NAV data for each fund
 * @param years - Rolling period in years (default: 1)
 * @param allocations - Target allocation percentages for each fund
 * @param rebalancingEnabled - Whether to enable portfolio rebalancing (default: false)
 * @param rebalancingThreshold - Threshold percentage for triggering rebalancing (default: 5)
 * @param includeNilTransactions - Whether to include nil transactions in result (default: false, set true for tests)
 * @param stepUpEnabled - Whether to enable step-up SIP (default: false)
 * @param stepUpPercentage - Annual percentage increase for step-up SIP (default: 0)
 * @param sipAmount - Monthly SIP amount (default: 100)
 * @returns Array of SIP Rolling XIRR entries for each date
 */
export function calculateSipRollingXirr(
  navDataList: NavEntry[][],
  years: number = 1,
  allocations: number[],
  rebalancingEnabled: boolean = false,
  rebalancingThreshold: number = 5,
  includeNilTransactions: boolean = false,
  stepUpEnabled: boolean = false,
  stepUpPercentage: number = 0,
  sipAmount: number = 100
): SipRollingXirrEntry[] {
  // Reset timing accumulators
  _xirrTime = 0;
  _volatilityTime = 0;
  _transactionTime = 0;
  
  // Validate input
  if (!isValidInput(navDataList)) return [];

  // Prepare data
  const months = years * 12;
  const filledNavs = navDataList.map(ensureContinuousDates);
  const fundDateMaps = filledNavs.map(buildDateMap);
  const baseDates = getSortedDates(filledNavs[0]);
  const firstDate = baseDates[0];

  // Calculate XIRR for each date
  const results = baseDates.flatMap(date =>
    computeSipXirrForDate(
      date,
      fundDateMaps,
      months,
      firstDate,
      allocations,
      rebalancingEnabled,
      rebalancingThreshold,
      includeNilTransactions,
      stepUpEnabled,
      stepUpPercentage,
      sipAmount
    )
  );
  
  // Log timing breakdown
  console.log(`[SIP Calc] Transactions: ${_transactionTime.toFixed(0)}ms | XIRR: ${_xirrTime.toFixed(0)}ms | Volatility: ${_volatilityTime.toFixed(0)}ms | Total entries: ${results.length}`);
  
  return results;
}

/**
 * Compute SIP XIRR for a single date
 * OPTIMIZED: Uses pre-computed daily values for volatility instead of nil transactions
 * Falls back to old path when nil transactions are explicitly requested (for tests/modal)
 */
function computeSipXirrForDate(
  currentDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  months: number,
  firstDate: Date,
  allocations: number[],
  rebalancingEnabled: boolean,
  rebalancingThreshold: number,
  includeNilTransactions: boolean,
  stepUpEnabled: boolean,
  stepUpPercentage: number,
  sipAmount: number
): SipRollingXirrEntry[] {
  // If nil transactions are explicitly requested, use the old path (slower but includes nil)
  if (includeNilTransactions) {
    return computeSipXirrForDateWithNil(
      currentDate, fundDateMaps, months, firstDate, allocations,
      rebalancingEnabled, rebalancingThreshold, stepUpEnabled, stepUpPercentage, sipAmount
    );
  }

  // OPTIMIZED PATH: Build transactions and compute daily values inline (no nil transactions)
  const txStart = performance.now();
  const result = calculateTransactionsForDate(
    currentDate,
    fundDateMaps,
    months,
    firstDate,
    allocations,
    rebalancingEnabled,
    rebalancingThreshold,
    stepUpEnabled,
    stepUpPercentage,
    sipAmount
  );
  _transactionTime += performance.now() - txStart;

  if (!result) return [];

  // Calculate XIRR from transactions (only buy/sell/rebalance) - timed
  const xirrStart = performance.now();
  const xirrValue = calculateXirrFromTransactions(result.transactions, currentDate);
  _xirrTime += performance.now() - xirrStart;
  if (xirrValue === null) return [];

  // Calculate volatility from pre-computed daily values - timed
  const volStart = performance.now();
  const volatility = calculateVolatility(result.dailyValues);
  _volatilityTime += performance.now() - volStart;

  return [{
    date: currentDate,
    xirr: Math.round(xirrValue * 10000) / 10000,
    transactions: result.transactions, // Already filtered (no nil)
    volatility: Math.round(volatility * 10000) / 10000
  }];
}

/**
 * OLD PATH: Compute with nil transactions included (for tests and modal display)
 */
function computeSipXirrForDateWithNil(
  currentDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  months: number,
  firstDate: Date,
  allocations: number[],
  rebalancingEnabled: boolean,
  rebalancingThreshold: number,
  stepUpEnabled: boolean,
  stepUpPercentage: number,
  sipAmount: number
): SipRollingXirrEntry[] {
  const txStart = performance.now();
  const allTransactions = calculateTransactionsForDateWithNil(
    currentDate,
    fundDateMaps,
    months,
    firstDate,
    allocations,
    rebalancingEnabled,
    rebalancingThreshold,
    stepUpEnabled,
    stepUpPercentage,
    sipAmount
  );
  _transactionTime += performance.now() - txStart;

  if (!allTransactions) return [];

  const xirrStart = performance.now();
  const xirrValue = calculateXirrFromTransactions(allTransactions, currentDate);
  _xirrTime += performance.now() - xirrStart;
  if (xirrValue === null) return [];

  // Calculate volatility from transactions (extract daily values from nil transactions)
  const volStart = performance.now();
  const dailyValues = extractDailyValuesFromTransactions(allTransactions);
  const volatility = calculateVolatility(dailyValues);
  _volatilityTime += performance.now() - volStart;

  return [{
    date: currentDate,
    xirr: Math.round(xirrValue * 10000) / 10000,
    transactions: allTransactions, // Includes nil
    volatility: Math.round(volatility * 10000) / 10000
  }];
}

/**
 * Extract daily values from nil/buy transactions (for old path)
 */
function extractDailyValuesFromTransactions(transactions: Transaction[]): { date: Date; totalValue: number; cashFlow: number }[] {
  const relevantTransactions = transactions.filter(
    tx => tx.type === 'nil' || tx.type === 'buy'
  );

  const transactionsByDate = new Map<string, Transaction[]>();
  
  for (const tx of relevantTransactions) {
    const dateKey = tx.when.toISOString().split('T')[0];
    if (!transactionsByDate.has(dateKey)) {
      transactionsByDate.set(dateKey, []);
    }
    transactionsByDate.get(dateKey)!.push(tx);
  }

  const dailyValues: { date: Date; totalValue: number; cashFlow: number }[] = [];
  
  for (const [, txs] of transactionsByDate.entries()) {
    const totalValue = txs.reduce((sum, tx) => sum + tx.currentValue, 0);
    const cashFlow = txs
      .filter(tx => tx.type === 'buy')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    if (totalValue > 0) {
      dailyValues.push({
        date: txs[0].when,
        totalValue,
        cashFlow
      });
    }
  }

  dailyValues.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return dailyValues;
}

/**
 * Recalculate transactions for a specific date with nil transactions included
 * Used for on-demand calculation when viewing transaction details in modal
 * 
 * @param navDataList - Array of NAV data for each fund
 * @param targetDate - The specific date to recalculate for
 * @param years - Rolling period in years
 * @param allocations - Target allocation percentages for each fund
 * @param rebalancingEnabled - Whether rebalancing was enabled
 * @param rebalancingThreshold - Threshold percentage for rebalancing
 * @param stepUpEnabled - Whether step-up SIP was enabled
 * @param stepUpPercentage - Annual percentage increase for step-up
 * @param sipAmount - Monthly SIP amount
 * @returns Transaction array with nil transactions included, or null if calculation fails
 */
export function recalculateTransactionsForDate(
  navDataList: NavEntry[][],
  targetDate: Date,
  years: number,
  allocations: number[],
  rebalancingEnabled: boolean,
  rebalancingThreshold: number,
  stepUpEnabled: boolean,
  stepUpPercentage: number,
  sipAmount: number
): Transaction[] | null {
  // Validate input
  if (!isValidInput(navDataList)) return null;

  // Prepare data
  const months = years * 12;
  const filledNavs = navDataList.map(ensureContinuousDates);
  const fundDateMaps = filledNavs.map(buildDateMap);
  const baseDates = getSortedDates(filledNavs[0]);
  const firstDate = baseDates[0];

  // Calculate transactions for the target date with nil included (slower path)
  const allTransactions = calculateTransactionsForDateWithNil(
    targetDate,
    fundDateMaps,
    months,
    firstDate,
    allocations,
    rebalancingEnabled,
    rebalancingThreshold,
    stepUpEnabled,
    stepUpPercentage,
    sipAmount
  );

  return allTransactions;
}
