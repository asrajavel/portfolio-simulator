import xirr from 'xirr';
import { NavEntry } from '../../types/navData';
import { areDatesContinuous, getNthPreviousMonthDate } from '../date/dateUtils';

export interface RollingXirrEntry {
  date: Date;
  xirr: number;
  transactions: { amount: number; when: Date }[];
}

/**
 * Calculates lump sum rolling 1-year XIRR for a series of NAV entries.
 * For each date, uses getNthPreviousMonthDate to get the date 12 months before,
 * and uses the NAV for that date (after filling missing dates). If the calculated date is before the start, skip.
 * Throws an error if the dates are not continuous (no missing days).
 * Assumes input is already filled for missing dates.
 */
export function calculateLumpSumRollingXirr(navData: NavEntry[]): RollingXirrEntry[] {
  if (navData.length < 2) return [];
  if (!areDatesContinuous(navData)) {
    throw new Error('NAV dates are not continuous');
  }
  // Sort ascending by date
  const sorted = [...navData].sort((a, b) => a.date.getTime() - b.date.getTime());
  const result: RollingXirrEntry[] = [];
  const firstDate = sorted[0].date;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const oneYearAgo = getNthPreviousMonthDate(current.date, 12);
    if (oneYearAgo < firstDate) continue;
    // Find the entry with the exact same date as oneYearAgo (guaranteed to exist after filling)
    const startIdx = sorted.findIndex(entry =>
      entry.date.getFullYear() === oneYearAgo.getFullYear() &&
      entry.date.getMonth() === oneYearAgo.getMonth() &&
      entry.date.getDate() === oneYearAgo.getDate()
    );
    if (startIdx === -1) continue; // Should not happen after filling, but safe check
    const start = sorted[startIdx];
    const transactions = [
      { amount: -start.nav, when: start.date },
      { amount: current.nav, when: current.date },
    ];
    try {
      const rate = xirr(transactions);
      result.push({ date: current.date, xirr: rate, transactions });
    } catch {
      // If xirr fails to converge, skip
      continue;
    }
  }
  return result;
} 