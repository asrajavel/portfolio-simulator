import { NavEntry } from '../../../../types/navData';
import { Transaction } from '../types';

interface TransactionState {
  cumulativeUnits: number[];
  unitsPerFund: number[];
}

/**
 * Create rebalance transactions if needed
 */
export function createRebalanceTransactions(
  dateKey: string,
  loopDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  allocations: number[],
  rebalancingThreshold: number,
  portfolioValue: number,
  state: TransactionState
): Transaction[] | null {
  if (!isRebalancingNeeded(state.cumulativeUnits, fundDateMaps, dateKey, allocations, rebalancingThreshold, portfolioValue)) {
    return [];
  }

  const transactions: Transaction[] = [];

  for (let fundIdx = 0; fundIdx < fundDateMaps.length; fundIdx++) {
    const entry = fundDateMaps[fundIdx].get(dateKey);
    if (!entry) return null;

    const currentValue = state.cumulativeUnits[fundIdx] * entry.nav;
    const targetValue = portfolioValue * (allocations[fundIdx] / 100);
    const rebalanceAmount = targetValue - currentValue;

    if (Math.abs(rebalanceAmount) > 0.01) {
      const rebalanceUnits = rebalanceAmount / entry.nav;

      state.cumulativeUnits[fundIdx] += rebalanceUnits;
      state.unitsPerFund[fundIdx] += rebalanceUnits;

      transactions.push({
        fundIdx,
        when: new Date(loopDate),
        nav: entry.nav,
        units: rebalanceUnits,
        amount: -rebalanceAmount,
        type: 'rebalance',
        cumulativeUnits: state.cumulativeUnits[fundIdx],
        currentValue: state.cumulativeUnits[fundIdx] * entry.nav,
        allocationPercentage: allocations[fundIdx],
      });
    }
  }

  return transactions;
}

function isRebalancingNeeded(
  cumulativeUnits: number[],
  fundDateMaps: Map<string, NavEntry>[],
  dateKey: string,
  allocations: number[],
  threshold: number,
  portfolioValue: number
): boolean {
  for (let fundIdx = 0; fundIdx < fundDateMaps.length; fundIdx++) {
    const entry = fundDateMaps[fundIdx].get(dateKey);
    if (!entry) continue;

    const currentValue = cumulativeUnits[fundIdx] * entry.nav;
    const currentAllocation = (currentValue / portfolioValue) * 100;
    const targetAllocation = allocations[fundIdx];

    if (Math.abs(currentAllocation - targetAllocation) > threshold) {
      return true;
    }
  }

  return false;
}

