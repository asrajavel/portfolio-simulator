import { FixedReturnService } from './fixedReturnService';

/**
 * Tests for Fixed Return Service
 * 
 * Verifies:
 * 1. Weekday-only data generation (no weekends)
 * 2. Correct daily compounding formula
 * 3. UTC date handling to avoid timezone issues
 */

describe('FixedReturnService', () => {
  describe('generateFixedReturnData', () => {
    it('should generate weekday-only data with correct start date', () => {
      const data = FixedReturnService.generateFixedReturnData(8, 2023);
      
      // Jan 1, 2023 is Sunday - should start with Jan 2 (Monday)
      expect(data[0].date.getUTCFullYear()).toBe(2023);
      expect(data[0].date.getUTCDate()).toBe(2);
      expect(data[0].date.getUTCDay()).toBe(1); // Monday
      
      // All entries should be weekdays
      data.slice(0, 20).forEach(entry => {
        const dayOfWeek = entry.date.getUTCDay();
        expect(dayOfWeek).toBeGreaterThanOrEqual(1);
        expect(dayOfWeek).toBeLessThanOrEqual(5);
      });
    });

    it('should calculate correct NAV with daily compounding (8% annual)', () => {
      const data = FixedReturnService.generateFixedReturnData(8, 2023);
      
      // First 3 days: 100 * (1.08)^(days/365.25)
      expect(data[0].nav).toBeCloseTo(100.02107, 4); // Jan 2 (1 day)
      expect(data[1].nav).toBeCloseTo(100.04215, 4); // Jan 3 (2 days)
      expect(data[2].nav).toBeCloseTo(100.06323, 4); // Jan 4 (3 days)
      
      // After ~1 year (Jan 2, 2024): 100 * (1.08)^(366/365.25) ≈ 107.98
      const oneYearEntry = data.find(entry => 
        entry.date.getUTCFullYear() === 2024 && 
        entry.date.getUTCMonth() === 0 && 
        entry.date.getUTCDate() === 2
      );
      expect(oneYearEntry?.nav).toBeCloseTo(107.98, 1);
    });

    it('should use UTC dates at midnight', () => {
      const data = FixedReturnService.generateFixedReturnData(8, 2023);
      
      expect(data[0].date.getUTCHours()).toBe(0);
      expect(data[0].date.getUTCMinutes()).toBe(0);
      expect(data[0].date.getUTCSeconds()).toBe(0);
    });

    it('should generate approximately 260 weekdays per year', () => {
      const data = FixedReturnService.generateFixedReturnData(8, 2023);
      
      const entries2023 = data.filter(entry => 
        entry.date.getUTCFullYear() === 2023
      );
      
      expect(entries2023.length).toBeGreaterThan(250);
      expect(entries2023.length).toBeLessThan(265);
    });

    it('should handle different return rates correctly', () => {
      // 0% return - constant NAV
      const data0 = FixedReturnService.generateFixedReturnData(0, 2023);
      expect(data0[0].nav).toBe(100);
      expect(data0[10].nav).toBe(100);
      
      // 12% return - should be higher
      const data12 = FixedReturnService.generateFixedReturnData(12, 2023);
      expect(data12[0].nav).toBeCloseTo(100.03103, 4);
    });
  });
});

