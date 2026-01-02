import { NavEntry } from '../../../../types/navData';
import { Transaction } from '../types';

interface TransactionState {
  cumulativeUnits: number[];
  unitsPerFund: number[];
}

/**
 * Create annual adjustment transactions to transition to new target allocation
 * Similar to rebalancing, but triggered on anniversary dates during transition period
 * 
 * @param dateKey - Date key for NAV lookup
 * @param loopDate - Current date
 * @param fundDateMaps - NAV data for each fund
 * @param targetAllocations - Current target allocations (interpolated)
 * @param state - Current portfolio state
 * @returns Array of annual_adjustment transactions
 */
export function createAnnualAdjustmentTransactions(
  dateKey: string,
  loopDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  targetAllocations: number[],
  state: TransactionState
): Transaction[] | null {
  const transactions: Transaction[] = [];

  // Calculate total portfolio value
  let portfolioValue = 0;
  for (let fundIdx = 0; fundIdx < fundDateMaps.length; fundIdx++) {
    const entry = fundDateMaps[fundIdx].get(dateKey);
    if (!entry) return null;
    portfolioValue += state.cumulativeUnits[fundIdx] * entry.nav;
  }

  // If portfolio is empty, no adjustment needed
  if (portfolioValue < 0.01) {
    return [];
  }

  // Rebalance to new target allocation
  for (let fundIdx = 0; fundIdx < fundDateMaps.length; fundIdx++) {
    const entry = fundDateMaps[fundIdx].get(dateKey);
    if (!entry) return null;

    const currentValue = state.cumulativeUnits[fundIdx] * entry.nav;
    const targetValue = portfolioValue * (targetAllocations[fundIdx] / 100);
    const adjustmentAmount = targetValue - currentValue;

    // Only create transaction if adjustment is meaningful (> 1 paisa)
    if (Math.abs(adjustmentAmount) > 0.01) {
      const adjustmentUnits = adjustmentAmount / entry.nav;

      state.cumulativeUnits[fundIdx] += adjustmentUnits;
      state.unitsPerFund[fundIdx] += adjustmentUnits;

      transactions.push({
        fundIdx,
        when: new Date(loopDate),
        nav: entry.nav,
        units: adjustmentUnits,
        amount: -adjustmentAmount,
        type: 'annual_adjustment',
        cumulativeUnits: state.cumulativeUnits[fundIdx],
        currentValue: state.cumulativeUnits[fundIdx] * entry.nav,
        allocationPercentage: targetAllocations[fundIdx],
      });
    }
  }

  return transactions;
}


