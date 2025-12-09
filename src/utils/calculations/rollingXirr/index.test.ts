import { calculateLumpSumRollingXirr, RollingXirrEntry } from '../lumpSumRollingXirr';
import { NavEntry } from '../../../types/navData';
import { fillMissingNavDates } from '../../data/fillMissingNavDates';

describe('calculateLumpSumRollingXirr', () => {
  it('calculates lump sum rolling 1-year XIRR for simple NAV data', () => {
    const navData: NavEntry[] = [
      { date: new Date('2023-01-31'), nav: 100 },
      { date: new Date('2024-01-31'), nav: 120 },
      { date: new Date('2025-01-31'), nav: 140 },
    ];
    const filled = fillMissingNavDates(navData);
    const result = calculateLumpSumRollingXirr([filled]);
    // Find the results for the specific dates of interest
    const r2024 = result.find(r => r.date.getTime() === new Date('2024-01-31').getTime());
    const r2025 = result.find(r => r.date.getTime() === new Date('2025-01-31').getTime());
    expect(r2024).toBeDefined();
    expect(r2024!.xirr).toBeCloseTo(0.2, 3);
    expect(r2024!.transactions.length).toBe(2);
    // Now returns detailed transactions with type 'buy' and 'sell'
    expect(r2024!.transactions[0].nav).toBe(100);
    expect(r2024!.transactions[0].when).toEqual(new Date('2023-01-31'));
    expect(r2024!.transactions[0].type).toBe('buy');
    expect(r2024!.transactions[1].nav).toBe(120);
    expect(r2024!.transactions[1].when).toEqual(new Date('2024-01-31'));
    expect(r2024!.transactions[1].type).toBe('sell');
    expect(r2025).toBeDefined();
    expect(r2025!.xirr).toBeCloseTo(0.1662, 3);
    expect(r2025!.transactions.length).toBe(2);
    expect(r2025!.transactions[0].nav).toBe(120); // NAV on 2024-01-31 is 120
    expect(r2025!.transactions[0].when).toEqual(new Date('2024-01-31'));
    expect(r2025!.transactions[1].nav).toBe(140); // NAV on 2025-01-31 is 140
    expect(r2025!.transactions[1].when).toEqual(new Date('2025-01-31'));
  });

  it('returns empty array if not enough data', () => {
    expect(calculateLumpSumRollingXirr([fillMissingNavDates([])])).toEqual([]);
    expect(calculateLumpSumRollingXirr([fillMissingNavDates([{ date: new Date('2023-01-01'), nav: 100 }])])).toEqual([]);
  });

  it('skips dates where no suitable start date exists', () => {
    const navData: NavEntry[] = [
      { date: new Date('2023-01-31'), nav: 100 },
      { date: new Date('2023-06-30'), nav: 110 },
      { date: new Date('2024-07-31'), nav: 130 },
    ];
    const filled = fillMissingNavDates(navData);
    const result = calculateLumpSumRollingXirr([filled]);
    // Only 2024-07-31 should have a valid 1-year-back date (2023-07-31, which will be filled)
    expect(result.length).toBeGreaterThanOrEqual(1);
    // The first result should be for 2024-07-31
    expect(result.some(r => r.date.getTime() === new Date('2024-07-31').getTime())).toBe(true);
  });
}); 