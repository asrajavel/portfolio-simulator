import { calculateLumpSumRollingXirr, RollingXirrEntry } from './index';
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
    expect(r2024!.transactions[0]).toEqual({ nav: 100, when: new Date('2023-01-31') });
    expect(r2024!.transactions[1]).toEqual({ nav: 120, when: new Date('2024-01-31') });
    expect(r2025).toBeDefined();
    expect(r2025!.xirr).toBeCloseTo(0.1662, 3);
    expect(r2025!.transactions.length).toBe(2);
    expect(r2025!.transactions[0]).toEqual({ nav: 100, when: new Date('2024-01-31') });
    expect(r2025!.transactions[1]).toEqual({ nav: 116.66666666666667, when: new Date('2025-01-31') });
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

  it('respects custom allocations for multiple funds', () => {
    const navData1: NavEntry[] = [
      { date: new Date('2023-01-31'), nav: 100 },
      { date: new Date('2024-01-31'), nav: 150 }, // 50% gain
    ];
    const navData2: NavEntry[] = [
      { date: new Date('2023-01-31'), nav: 100 },
      { date: new Date('2024-01-31'), nav: 110 }, // 10% gain
    ];
    const filled1 = fillMissingNavDates(navData1);
    const filled2 = fillMissingNavDates(navData2);
    
    // 70% in fund1 (high return), 30% in fund2 (low return)
    const result = calculateLumpSumRollingXirr([filled1, filled2], 1, [70, 30], 100);
    const r2024 = result.find(r => r.date.getTime() === new Date('2024-01-31').getTime());
    
    expect(r2024).toBeDefined();
    // Expected: 70 grows to 105, 30 grows to 33 → Total: 138 from 100
    expect(r2024!.xirr).toBe(0.38);
  });

  it('defaults to equal allocation when allocations not provided', () => {
    const navData1: NavEntry[] = [
      { date: new Date('2023-01-31'), nav: 100 },
      { date: new Date('2024-01-31'), nav: 150 },
    ];
    const navData2: NavEntry[] = [
      { date: new Date('2023-01-31'), nav: 100 },
      { date: new Date('2024-01-31'), nav: 110 },
    ];
    const filled1 = fillMissingNavDates(navData1);
    const filled2 = fillMissingNavDates(navData2);
    
    // No allocations provided - should split 50-50
    const result = calculateLumpSumRollingXirr([filled1, filled2], 1, [], 100);
    const r2024 = result.find(r => r.date.getTime() === new Date('2024-01-31').getTime());
    
    expect(r2024).toBeDefined();
    // Expected: 50 grows to 75, 50 grows to 55 → Total: 130 from 100
    expect(r2024!.xirr).toBe(0.3);
  });

  it('calculates correct corpus value with custom allocations', () => {
    const navData: NavEntry[] = [
      { date: new Date('2023-01-31'), nav: 10 },
      { date: new Date('2024-01-31'), nav: 20 }, // 2x
    ];
    const filled = fillMissingNavDates(navData);
    
    const result = calculateLumpSumRollingXirr([filled], 1, [100], 50000);
    const r2024 = result.find(r => r.date.getTime() === new Date('2024-01-31').getTime());
    
    expect(r2024).toBeDefined();
    expect(r2024!.xirr).toBe(1); // 100% return (50k → 100k)
    expect(r2024!.transactions[1].nav).toBe(100000);
  });
}); 