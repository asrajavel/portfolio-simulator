import { NavEntry } from '../../types/navData';

export function fillMissingNavDates(navData: NavEntry[]): NavEntry[] {
  if (navData.length === 0) return [];

  // Sort ascending (oldest first)
  const sorted = [...navData].sort((a, b) => a.date.getTime() - b.date.getTime());
  const filled: NavEntry[] = [];
  let i = 0;
  let current = new Date(sorted[0].date);
  const last = sorted[sorted.length - 1].date;

  while (current <= last) {
    if (i < sorted.length && sameDay(current, sorted[i].date)) {
      filled.push({ date: new Date(current), nav: sorted[i].nav });
      i++;
    } else {
      // Use the next available NAV (forward fill)
      filled.push({ date: new Date(current), nav: sorted[i].nav });
    }
    current.setDate(current.getDate() + 1);
  }
  return filled;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
} 