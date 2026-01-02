import { NavEntry } from '../../../../types/navData';
import { Transaction } from '../types';
import { toDateKey, generateSipDates } from './helpers';
import { createBuyTransactions } from '../transactions/buy';
import { createRebalanceTransactions } from '../transactions/rebalance';
import { createNilTransactions } from '../transactions/nil';
import { createFinalSellTransactions } from '../transactions/sell';
import { DailySipPortfolioValue } from '../volatility/sipPortfolioValue';

/**
 * Result of transaction calculation - includes both transactions and daily values for volatility
 */
export interface TransactionResult {
  transactions: Transaction[];
  dailyValues: DailySipPortfolioValue[];
}

/**
 * Calculate all transactions for a given date, including buy/rebalance transactions
 * and the final sell transaction at the end date.
 * Also computes daily portfolio values inline for volatility calculation.
 * 
 * OPTIMIZATION: Nil transactions are NOT created as objects - daily values are computed directly.
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
  sipAmount: number
): TransactionResult | null {
  const sipDates = generateSipDates(currentDate, months, firstDate);
  if (!sipDates.earliestDate) {
    return null;
  }

  const state = initializeState(fundDateMaps.length);
  const result = buildDailyTransactions(
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
    state
  );

  if (!result) return null;

  // Add final selling transactions at current date
  const sellTransactions = createFinalSellTransactions(currentDate, fundDateMaps, state.unitsPerFund);
  if (!sellTransactions) return null;

  return {
    transactions: [...result.transactions, ...sellTransactions],
    dailyValues: result.dailyValues
  };
}

/**
 * Calculate transactions WITH nil transactions included (for modal display)
 * This is the slower path, only used when user clicks on a data point
 */
export function calculateTransactionsForDateWithNil(
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
): Transaction[] | null {
  const sipDates = generateSipDates(currentDate, months, firstDate);
  if (!sipDates.earliestDate) {
    return null;
  }

  const state = initializeState(fundDateMaps.length);
  const transactions = buildDailyTransactionsWithNil(
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
    state
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

/**
 * OPTIMIZED: Build transactions WITHOUT creating nil transaction objects.
 * Daily portfolio values are computed inline for volatility calculation.
 */
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
  state: TransactionState
): { transactions: Transaction[]; dailyValues: DailySipPortfolioValue[] } | null {
  const transactions: Transaction[] = [];
  const dailyValues: DailySipPortfolioValue[] = [];
  const loopDate = new Date(startDate);
  const firstSipDate = new Date(startDate);

  while (loopDate < endDate) {
    const dateKey = toDateKey(loopDate);
    const isSipDate = sipDates.has(dateKey);

    let cashFlowForDay = 0;
    if (isSipDate) {
      const result = processSipDate(dateKey, loopDate, fundDateMaps, allocations, rebalancingEnabled, rebalancingThreshold, firstSipDate, stepUpEnabled, stepUpPercentage, sipAmount, state);
      if (!result) return null;
      transactions.push(...result);
      
      // Calculate actual cash flow from transactions created (handles step-up and rebalancing)
      cashFlowForDay = result
        .filter(tx => tx.type === 'buy')
        .reduce((sum, tx) => sum + tx.amount, 0);
    }

    // Compute daily portfolio value inline (no nil transactions created)
    const dailyValue = computeDailyPortfolioValue(dateKey, loopDate, fundDateMaps, state, cashFlowForDay);
    if (!dailyValue) return null;
    dailyValues.push(dailyValue);

    loopDate.setDate(loopDate.getDate() + 1);
  }

  return { transactions, dailyValues };
}

/**
 * OLD PATH: Build transactions WITH nil transaction objects (for modal display)
 */
function buildDailyTransactionsWithNil(
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
  state: TransactionState
): Transaction[] | null {
  const transactions: Transaction[] = [];
  const loopDate = new Date(startDate);
  const firstSipDate = new Date(startDate);

  while (loopDate < endDate) {
    const dateKey = toDateKey(loopDate);
    const isSipDate = sipDates.has(dateKey);

    const result = isSipDate
      ? processSipDate(dateKey, loopDate, fundDateMaps, allocations, rebalancingEnabled, rebalancingThreshold, firstSipDate, stepUpEnabled, stepUpPercentage, sipAmount, state)
      : processNilDate(dateKey, fundDateMaps, state);

    if (!result) return null;
    transactions.push(...result);

    loopDate.setDate(loopDate.getDate() + 1);
  }

  return transactions;
}

/**
 * Compute daily portfolio value without creating transaction objects
 */
function computeDailyPortfolioValue(
  dateKey: string,
  date: Date,
  fundDateMaps: Map<string, NavEntry>[],
  state: TransactionState,
  cashFlow: number
): DailySipPortfolioValue | null {
  let totalValue = 0;

  for (let fundIdx = 0; fundIdx < fundDateMaps.length; fundIdx++) {
    const entry = fundDateMaps[fundIdx].get(dateKey);
    if (!entry) return null;

    const currentValue = state.cumulativeUnits[fundIdx] * entry.nav;
    totalValue += currentValue;
  }

  return {
    date: new Date(date),
    totalValue,
    cashFlow
  };
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
  state: TransactionState
): Transaction[] | null {
  const buyResult = createBuyTransactions(dateKey, fundDateMaps, allocations, state, loopDate, firstSipDate, stepUpEnabled, stepUpPercentage, sipAmount);
  if (!buyResult) return null;

  const rebalanceTransactions = rebalancingEnabled
    ? createRebalanceTransactions(dateKey, loopDate, fundDateMaps, allocations, rebalancingThreshold, buyResult.portfolioValue, state)
    : [];

  if (rebalanceTransactions === null) return null;

  return [...buyResult.transactions, ...rebalanceTransactions];
}

function processNilDate(
  dateKey: string,
  fundDateMaps: Map<string, NavEntry>[],
  state: TransactionState
): Transaction[] | null {
  return createNilTransactions(dateKey, fundDateMaps, state);
}

