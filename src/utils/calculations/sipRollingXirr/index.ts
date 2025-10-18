import { NavEntry } from '../../../types/navData';
import { SipRollingXirrEntry } from './types';
import { isValidInput, ensureContinuousDates, buildDateMap, getSortedDates } from './core/helpers';
import { calculateTransactionsForDate } from './core/transactionBuilder';
import { calculateXirrFromTransactions } from './core/xirrCalculator';
import { calculateVolatilityForEntry } from './volatility';

// Re-export types for backward compatibility
export type { SipRollingXirrEntry, Transaction } from './types';

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
  // Validate input
  if (!isValidInput(navDataList)) return [];

  // Prepare data
  const months = years * 12;
  const filledNavs = navDataList.map(ensureContinuousDates);
  const fundDateMaps = filledNavs.map(buildDateMap);
  const baseDates = getSortedDates(filledNavs[0]);
  const firstDate = baseDates[0];

  // Calculate XIRR for each date
  return baseDates.flatMap(date =>
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
}

/**
 * Compute SIP XIRR for a single date
 * This is the orchestration function that coordinates transaction building and XIRR calculation
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
  // Build all transactions (buy, sell, rebalance, nil)
  const allTransactions = calculateTransactionsForDate(
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

  if (!allTransactions) return [];

  // Calculate XIRR from transactions
  const xirrValue = calculateXirrFromTransactions(allTransactions, currentDate);
  if (xirrValue === null) return [];

  // Calculate volatility from all transactions (includes nil for accurate daily tracking)
  const volatility = calculateVolatilityForEntry(allTransactions);

  // Filter nil transactions if not needed (for memory efficiency)
  const transactionsToReturn = includeNilTransactions
    ? allTransactions
    : allTransactions.filter(tx => tx.type !== 'nil');

  return [{
    date: currentDate,
    xirr: Math.round(xirrValue * 10000) / 10000, // Round to 4 decimal places for precision
    transactions: transactionsToReturn,
    volatility: Math.round(volatility * 10000) / 10000 // Round to 4 decimal places for precision
  }];
}
