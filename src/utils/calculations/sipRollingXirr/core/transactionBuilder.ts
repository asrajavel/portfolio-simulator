import { NavEntry } from '../../../../types/navData';
import { Transaction } from '../types';
import { toDateKey, generateSipDates } from './helpers';
import { createBuyTransactions } from '../transactions/buy';
import { createRebalanceTransactions } from '../transactions/rebalance';
import { createNilTransactions } from '../transactions/nil';
import { createFinalSellTransactions } from '../transactions/sell';
import { createAnnualAdjustmentTransactions } from '../transactions/annualAdjustment';
import { getCurrentTargetAllocation, shouldPerformAnnualAdjustment } from './allocationTransition';

/**
 * Calculate all transactions for a given date, including buy/rebalance/nil transactions
 * and the final sell transaction at the end date
 */
export function calculateTransactionsForDate(
  currentDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  months: number,
  firstDate: Date,
  allocations: number[],
  rebalancingEnabled: boolean,
  rebalancingThreshold: number,
  stepUpEnabled: boolean,
  stepUpPercentage: number,
  sipAmount: number,
  allocationTransitionEnabled: boolean,
  endAllocations: number[],
  transitionYears: number,
  rollingYears: number
): Transaction[] | null {
  const sipDates = generateSipDates(currentDate, months, firstDate);
  if (!sipDates.earliestDate) {
    return null;
  }

  const state = initializeState(fundDateMaps.length);
  const transactions = buildDailyTransactions(
    sipDates.earliestDate,
    currentDate,
    sipDates.dateSet,
    fundDateMaps,
    allocations,
    rebalancingEnabled,
    rebalancingThreshold,
    stepUpEnabled,
    stepUpPercentage,
    sipAmount,
    state,
    allocationTransitionEnabled,
    endAllocations,
    transitionYears,
    rollingYears
  );

  if (!transactions) return null;

  // Add final selling transactions at current date
  const sellTransactions = createFinalSellTransactions(currentDate, fundDateMaps, state.unitsPerFund);
  if (!sellTransactions) return null;

  return [...transactions, ...sellTransactions];
}

// ────────────── Private Helpers ────────────── //

interface TransactionState {
  unitsPerFund: number[];
  cumulativeUnits: number[];
}

function initializeState(numFunds: number): TransactionState {
  return {
    unitsPerFund: new Array(numFunds).fill(0),
    cumulativeUnits: new Array(numFunds).fill(0),
  };
}

function buildDailyTransactions(
  startDate: Date,
  endDate: Date,
  sipDates: Set<string>,
  fundDateMaps: Map<string, NavEntry>[],
  allocations: number[],
  rebalancingEnabled: boolean,
  rebalancingThreshold: number,
  stepUpEnabled: boolean,
  stepUpPercentage: number,
  sipAmount: number,
  state: TransactionState,
  allocationTransitionEnabled: boolean,
  endAllocations: number[],
  transitionYears: number,
  rollingYears: number
): Transaction[] | null {
  const transactions: Transaction[] = [];
  const loopDate = new Date(startDate);
  const firstSipDate = new Date(startDate); // Store first SIP date for step-up calculation

  while (loopDate < endDate) {
    const dateKey = toDateKey(loopDate);
    const isSipDate = sipDates.has(dateKey);

    const result = isSipDate
      ? processSipDate(
          dateKey,
          loopDate,
          fundDateMaps,
          allocations,
          rebalancingEnabled,
          rebalancingThreshold,
          firstSipDate,
          stepUpEnabled,
          stepUpPercentage,
          sipAmount,
          state,
          allocationTransitionEnabled,
          endAllocations,
          transitionYears,
          rollingYears
        )
      : processNilDate(dateKey, fundDateMaps, state);

    if (!result) return null;
    transactions.push(...result);

    loopDate.setDate(loopDate.getDate() + 1);
  }

  return transactions;
}

function processSipDate(
  dateKey: string,
  loopDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  allocations: number[],
  rebalancingEnabled: boolean,
  rebalancingThreshold: number,
  firstSipDate: Date,
  stepUpEnabled: boolean,
  stepUpPercentage: number,
  sipAmount: number,
  state: TransactionState,
  allocationTransitionEnabled: boolean,
  endAllocations: number[],
  transitionYears: number,
  rollingYears: number
): Transaction[] | null {
  const allTransactions: Transaction[] = [];
  
  // Calculate current target allocation once (used for all transactions on this date)
  const currentTargetAllocation = allocationTransitionEnabled
    ? getCurrentTargetAllocation(
        loopDate,
        firstSipDate,
        rollingYears,
        transitionYears,
        allocations,
        endAllocations
      )
    : allocations;

  // Check if we should perform annual adjustment
  const shouldAdjust = shouldPerformAnnualAdjustment(
    loopDate,
    firstSipDate,
    rollingYears,
    transitionYears,
    allocationTransitionEnabled
  );

  // Step 1: Perform annual adjustment if needed (before buying)
  if (shouldAdjust) {
    const adjustmentTransactions = createAnnualAdjustmentTransactions(
      dateKey,
      loopDate,
      fundDateMaps,
      currentTargetAllocation,
      state
    );
    
    if (adjustmentTransactions === null) return null;
    allTransactions.push(...adjustmentTransactions);
  }

  // Step 2: Buy SIP with current target allocation
  const buyResult = createBuyTransactions(
    dateKey,
    fundDateMaps,
    currentTargetAllocation,
    state,
    loopDate,
    firstSipDate,
    stepUpEnabled,
    stepUpPercentage,
    sipAmount
  );
  
  if (!buyResult) return null;
  allTransactions.push(...buyResult.transactions);

  // Step 3: Perform regular rebalancing (skip if annual adjustment was done)
  if (rebalancingEnabled && !shouldAdjust) {
    const rebalanceTransactions = createRebalanceTransactions(
      dateKey,
      loopDate,
      fundDateMaps,
      currentTargetAllocation,
      rebalancingThreshold,
      buyResult.portfolioValue,
      state
    );

    if (rebalanceTransactions === null) return null;
    allTransactions.push(...rebalanceTransactions);
  }

  return allTransactions;
}

function processNilDate(
  dateKey: string,
  fundDateMaps: Map<string, NavEntry>[],
  state: TransactionState
): Transaction[] | null {
  return createNilTransactions(dateKey, fundDateMaps, state);
}

