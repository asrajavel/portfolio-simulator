import { NavEntry } from '../../../../types/navData';
import { Transaction } from '../types';

interface TransactionState {
  cumulativeUnits: number[];
}

/**
 * Create nil transactions for non-SIP dates (showing current holdings)
 */
export function createNilTransactions(
  dateKey: string,
  fundDateMaps: Map<string, NavEntry>[],
  state: Pick<TransactionState, 'cumulativeUnits'>
): Transaction[] | null {
  const transactions: Transaction[] = [];
  let totalPortfolioValue = 0;

  for (let fundIdx = 0; fundIdx < fundDateMaps.length; fundIdx++) {
    const entry = fundDateMaps[fundIdx].get(dateKey);
    if (!entry) return null;

    const currentValue = state.cumulativeUnits[fundIdx] * entry.nav;
    totalPortfolioValue += currentValue;

    transactions.push({
      fundIdx,
      when: entry.date,
      nav: entry.nav,
      units: 0,
      amount: 0,
      type: 'nil',
      cumulativeUnits: state.cumulativeUnits[fundIdx],
      currentValue,
      allocationPercentage: 0,
    });
  }

  transactions.forEach(tx => {
    tx.allocationPercentage = totalPortfolioValue > 0 ? (tx.currentValue / totalPortfolioValue) * 100 : 0;
  });

  return transactions;
}

