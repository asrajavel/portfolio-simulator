import { NavEntry } from '../../../../types/navData';
import { Transaction } from '../types';
import { toDateKey, generateSipDates } from './helpers';
import { createBuyTransactions } from '../transactions/buy';
import { createRebalanceTransactions } from '../transactions/rebalance';
import { createNilTransactions } from '../transactions/nil';
import { createFinalSellTransactions } from '../transactions/sell';

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
  sipAmount: number
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
): Transaction[] | null {
  const transactions: Transaction[] = [];
  const loopDate = new Date(startDate);
  const firstSipDate = new Date(startDate); // Store first SIP date for step-up calculation

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

