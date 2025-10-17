import { NavEntry } from '../../../../types/navData';
import { areDatesContinuous, getNthPreviousMonthDate } from '../../../date/dateUtils';
import { fillMissingNavDates } from '../../../data/fillMissingNavDates';

export function isValidInput(navDataList: NavEntry[][]): boolean {
  return navDataList.length > 0 && !navDataList.some(f => f.length < 2);
}

export function ensureContinuousDates(fund: NavEntry[]): NavEntry[] {
  return areDatesContinuous(fund) ? fund : fillMissingNavDates(fund);
}

export function buildDateMap(fund: NavEntry[]): Map<string, NavEntry> {
  return new Map(fund.map(entry => [toDateKey(entry.date), entry]));
}

export function getSortedDates(fund: NavEntry[]): Date[] {
  return [...fund]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(entry => entry.date);
}

export function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ────────────── SIP Date Generation ────────────── //

export interface SipDatesResult {
  dateSet: Set<string>;
  earliestDate: Date | null;
}

export function generateSipDates(
  currentDate: Date,
  months: number,
  firstDate: Date
): SipDatesResult {
  const sipDates = new Set<string>();
  let earliestSipDate: Date | null = null;

  for (let m = months; m >= 1; m--) {
    const sipDate = getNthPreviousMonthDate(currentDate, m);
    if (sipDate < firstDate) {
      return { dateSet: sipDates, earliestDate: null };
    }

    sipDates.add(toDateKey(sipDate));
    if (!earliestSipDate || sipDate < earliestSipDate) {
      earliestSipDate = sipDate;
    }
  }

  return { dateSet: sipDates, earliestDate: earliestSipDate };
}

/**
 * Calculate which investment year a given date falls into, starting from the first SIP date
 * Used for step-up SIP calculations where investment amount increases yearly
 * 
 * @param currentDate - The date to check
 * @param firstSipDate - The first SIP date (year 1 starts from this date)
 * @returns The investment year (1-based: 1 for first year, 2 for second year, etc.)
 */
export function getInvestmentYear(currentDate: Date, firstSipDate: Date): number {
  const yearsDiff = currentDate.getFullYear() - firstSipDate.getFullYear();
  const monthsDiff = currentDate.getMonth() - firstSipDate.getMonth();
  const totalYears = yearsDiff + (monthsDiff >= 0 ? 0 : -1);
  return totalYears + 1; // Return 1-based year
}

