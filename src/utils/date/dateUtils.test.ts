import { areDatesContinuous, getNthPreviousMonthDate } from './dateUtils';
import { NavEntry } from '../../types/navData';

describe('areDatesContinuous', () => {
  it('returns true for continuous dates', () => {
    const navData: NavEntry[] = [
      { date: new Date('2023-01-01'), nav: 100 },
      { date: new Date('2023-01-02'), nav: 101 },
      { date: new Date('2023-01-03'), nav: 102 },
    ];
    expect(areDatesContinuous(navData)).toBe(true);
  });

  it('returns false for non-continuous dates', () => {
    const navData: NavEntry[] = [
      { date: new Date('2023-01-01'), nav: 100 },
      { date: new Date('2023-01-03'), nav: 102 },
    ];
    expect(areDatesContinuous(navData)).toBe(false);
  });

  it('returns true for empty or single entry', () => {
    expect(areDatesContinuous([])).toBe(true);
    expect(areDatesContinuous([{ date: new Date('2023-01-01'), nav: 100 }])).toBe(true);
  });
});

describe('getNthPreviousMonthDate', () => {
  it('gets the same day in the previous month', () => {
    const d = new Date('2023-05-15');
    expect(getNthPreviousMonthDate(d, 1)).toEqual(new Date('2023-04-15'));
    expect(getNthPreviousMonthDate(d, 2)).toEqual(new Date('2023-03-15'));
  });

  it('handles month-end edge cases', () => {
    // March 31 -> Feb 28 (non-leap year)
    expect(getNthPreviousMonthDate(new Date('2023-03-31'), 1)).toEqual(new Date('2023-02-28'));
    // March 31 -> Feb 29 (leap year)
    expect(getNthPreviousMonthDate(new Date('2024-03-31'), 1)).toEqual(new Date('2024-02-29'));
    // May 31 -> April 30
    expect(getNthPreviousMonthDate(new Date('2023-05-31'), 1)).toEqual(new Date('2023-04-30'));
  });

  it('handles year wrap-around', () => {
    expect(getNthPreviousMonthDate(new Date('2023-01-15'), 1)).toEqual(new Date('2022-12-15'));
    expect(getNthPreviousMonthDate(new Date('2023-01-31'), 1)).toEqual(new Date('2022-12-31'));
  });
}); 