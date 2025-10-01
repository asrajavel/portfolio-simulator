// Date utility functions for NAV and lump sum rolling XIRR calculations
import { NavEntry } from '../../types/navData';

export function areDatesContinuous(navData: NavEntry[]): boolean {
  if (navData.length < 2) return true;
  const sorted = [...navData].sort((a, b) => a.date.getTime() - b.date.getTime());
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].date;
    const curr = sorted[i].date;
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff !== 1) return false;
  }
  return true;
}

// Get the date N months before a given date, handling month-end edge cases
export function getNthPreviousMonthDate(currentDate: Date, months: number): Date {
  const date = new Date(currentDate);
  const d = date.getDate();
  date.setMonth(date.getMonth() - months);
  // Handle month-end edge case (e.g., March 31 -> Feb 28/29)
  if (date.getDate() < d) {
    date.setDate(0); // Go to last day of previous month
  }
  return date;
} 