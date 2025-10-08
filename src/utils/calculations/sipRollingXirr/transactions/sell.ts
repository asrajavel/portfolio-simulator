import { NavEntry } from '../../../../types/navData';
import { Transaction } from '../types';
import { toDateKey } from '../core/helpers';

/**
 * Create final sell transactions at the end date
 */
export function createFinalSellTransactions(
  currentDate: Date,
  fundDateMaps: Map<string, NavEntry>[],
  unitsPerFund: number[]
): Transaction[] | null {
  const dateKey = toDateKey(currentDate);
  const sells: Transaction[] = [];

  for (let fundIdx = 0; fundIdx < fundDateMaps.length; fundIdx++) {
    const entry = fundDateMaps[fundIdx].get(dateKey);
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
      cumulativeUnits: units,
      currentValue: units * entry.nav,
    });
  }

  return sells;
}

