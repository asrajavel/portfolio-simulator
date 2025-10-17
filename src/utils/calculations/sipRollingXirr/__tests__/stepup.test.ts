import { calculateSipRollingXirr } from '../index';
import { NavEntry } from '../../../../types/navData';

describe('calculateSipRollingXirr - Step-up SIP', () => {
  const createTestNavData = (startNav: number, growthRate: number, years: number): NavEntry[] => {
    const data: NavEntry[] = [];
    const startDate = new Date('2020-01-01');
    const totalDays = years * 365 + 60; // Extra days for rolling window
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nav = startNav * Math.pow(1 + growthRate, i / 365);
      data.push({ date, nav });
    }
    return data;
  };

  describe('Basic Step-up Functionality', () => {
    it('should have increasing investment amounts with step-up enabled', () => {
      const navData = createTestNavData(100, 0.10, 2);
      const result = calculateSipRollingXirr([navData], 2, [100], false, 5, true, true, 10);

      const lastEntry = result[result.length - 1];
      const buyTransactions = lastEntry.transactions.filter(tx => tx.type === 'buy');
      
      // Verify exact investment amounts
      expect(Math.abs(buyTransactions[0].amount)).toBeCloseTo(100, 2); // First month: 100
      expect(Math.abs(buyTransactions[11].amount)).toBeCloseTo(100, 2); // Month 12: still 100
      expect(Math.abs(buyTransactions[12].amount)).toBeCloseTo(110, 2); // Month 13: 110 (year 2)
      expect(Math.abs(buyTransactions[23].amount)).toBeCloseTo(110, 2); // Month 24: 110
    });

    it('should calculate correct XIRR with step-up', () => {
      const navData = createTestNavData(100, 0.12, 2);
      const result = calculateSipRollingXirr([navData], 2, [100], false, 5, false, true, 10);

      const lastEntry = result[result.length - 1];
      
      // Verify XIRR and volatility
      expect(lastEntry.xirr).toBeCloseTo(0.12, 2);
      expect(lastEntry.volatility).toBe(0);
    });

    it('should work with multiple funds and step-up', () => {
      const navData1 = createTestNavData(100, 0.12, 2);
      const navData2 = createTestNavData(100, 0.08, 2);
      
      const result = calculateSipRollingXirr([navData1, navData2], 2, [50, 50], false, 5, false, true, 10);

      const lastEntry = result[result.length - 1];
      const buyTransactions = lastEntry.transactions.filter(tx => tx.type === 'buy');
      
      // Verify buy transaction count
      expect(buyTransactions.length).toBe(48); // 24 months × 2 funds
      
      // Verify specific amounts (50% allocation)
      expect(Math.abs(buyTransactions[0].amount)).toBeCloseTo(50, 2); // Fund 1, month 1: 50
      expect(Math.abs(buyTransactions[1].amount)).toBeCloseTo(50, 2); // Fund 2, month 1: 50
      expect(Math.abs(buyTransactions[24].amount)).toBeCloseTo(55, 2); // Fund 1, month 13: 55 (year 2)
      expect(Math.abs(buyTransactions[25].amount)).toBeCloseTo(55, 2); // Fund 2, month 13: 55
      
      // Verify XIRR
      expect(lastEntry.xirr).toBeCloseTo(0.1001, 4);
    });
  });
});

