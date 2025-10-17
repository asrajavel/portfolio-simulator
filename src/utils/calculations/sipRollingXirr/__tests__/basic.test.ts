import { calculateSipRollingXirr } from '../index';
import { NavEntry } from '../../../../types/navData';

/**
 * Basic tests for SIP Rolling XIRR calculation (single fund scenarios)
 * 
 * These tests verify:
 * 1. Single-fund SIP transaction generation
 * 2. Cumulative units and current value tracking
 * 3. XIRR calculation accuracy
 * 
 * Note: Multi-fund scenarios are tested in sipRollingXirr.rebalancing.core.test.ts
 */

describe('calculateSipRollingXirr - Single Fund', () => {
  // Test data: Fund with steady 5% monthly growth
  const steadyGrowthFund: NavEntry[] = [
    { date: new Date('2023-01-01'), nav: 100 },
    { date: new Date('2023-02-01'), nav: 105 },
    { date: new Date('2023-03-01'), nav: 110 },
    { date: new Date('2023-04-01'), nav: 115 },
    { date: new Date('2023-05-01'), nav: 120 },
    { date: new Date('2023-06-01'), nav: 125 },
    { date: new Date('2023-07-01'), nav: 130 },
    { date: new Date('2023-08-01'), nav: 135 },
    { date: new Date('2023-09-01'), nav: 140 },
    { date: new Date('2023-10-01'), nav: 145 },
    { date: new Date('2023-11-01'), nav: 150 },
    { date: new Date('2023-12-01'), nav: 155 },
    { date: new Date('2024-01-01'), nav: 160 },
  ];

  describe('Basic SIP Functionality', () => {
    it('should generate correct transactions for single fund with exact values', () => {
      const allocations = [100];
      const result = calculateSipRollingXirr([steadyGrowthFund], 1, allocations);
      const lastEntry = result[result.length - 1];

      // Expected: 12 buys (12 months) + 1 sell = 13 non-nil transactions
      const expectedTransactions = [
        // Month 1: Jan 2023
        { fundIdx: 0, nav: 100, when: new Date('2023-01-01'), units: 1.0000, amount: -100.00, type: 'buy' },
        // Month 2: Feb 2023
        { fundIdx: 0, nav: 105, when: new Date('2023-02-01'), units: 0.9524, amount: -100.00, type: 'buy' },
        // Month 3: Mar 2023
        { fundIdx: 0, nav: 110, when: new Date('2023-03-01'), units: 0.9091, amount: -100.00, type: 'buy' },
        // Month 4: Apr 2023
        { fundIdx: 0, nav: 115, when: new Date('2023-04-01'), units: 0.8696, amount: -100.00, type: 'buy' },
        // Month 5: May 2023
        { fundIdx: 0, nav: 120, when: new Date('2023-05-01'), units: 0.8333, amount: -100.00, type: 'buy' },
        // Month 6: Jun 2023
        { fundIdx: 0, nav: 125, when: new Date('2023-06-01'), units: 0.8000, amount: -100.00, type: 'buy' },
        // Month 7: Jul 2023
        { fundIdx: 0, nav: 130, when: new Date('2023-07-01'), units: 0.7692, amount: -100.00, type: 'buy' },
        // Month 8: Aug 2023
        { fundIdx: 0, nav: 135, when: new Date('2023-08-01'), units: 0.7407, amount: -100.00, type: 'buy' },
        // Month 9: Sep 2023
        { fundIdx: 0, nav: 140, when: new Date('2023-09-01'), units: 0.7143, amount: -100.00, type: 'buy' },
        // Month 10: Oct 2023
        { fundIdx: 0, nav: 145, when: new Date('2023-10-01'), units: 0.6897, amount: -100.00, type: 'buy' },
        // Month 11: Nov 2023
        { fundIdx: 0, nav: 150, when: new Date('2023-11-01'), units: 0.6667, amount: -100.00, type: 'buy' },
        // Month 12: Dec 2023
        { fundIdx: 0, nav: 155, when: new Date('2023-12-01'), units: 0.6452, amount: -100.00, type: 'buy' },
        // Final: Jan 2024 - Sell all units
        { fundIdx: 0, nav: 160, when: new Date('2024-01-01'), units: 9.5901, amount: 1534.42, type: 'sell' },
      ];

      // Verify transaction count (nil transactions not included by default)
      expect(lastEntry.transactions.length).toBe(expectedTransactions.length);

      // Verify each transaction
      lastEntry.transactions.forEach((tx, i) => {
        const expected = expectedTransactions[i];
        expect(tx.fundIdx).toBe(expected.fundIdx);
        expect(tx.nav).toBeCloseTo(expected.nav, 2);
        expect(tx.when.toISOString().split('T')[0]).toBe(expected.when.toISOString().split('T')[0]);
        expect(tx.units).toBeCloseTo(expected.units, 4);
        expect(tx.amount).toBeCloseTo(expected.amount, 2);
        expect(tx.type).toBe(expected.type);
      });

      // Verify XIRR
      expect(lastEntry.xirr).toBeCloseTo(0.5488197128979718, 4);
    });

    it('should calculate cumulative units and current value correctly', () => {
      const allocations = [100];
      const result = calculateSipRollingXirr([steadyGrowthFund], 1, allocations);
      const lastEntry = result[result.length - 1];

      let cumulativeUnits = 0;

      lastEntry.transactions.forEach((tx, i) => {
        if (tx.type === 'buy') {
          cumulativeUnits += tx.units;
          expect(tx.cumulativeUnits).toBeCloseTo(cumulativeUnits, 4);
          expect(tx.currentValue).toBeCloseTo(cumulativeUnits * tx.nav, 2);
        } else if (tx.type === 'sell') {
          // For sell: cumulative units should be total units bought
          expect(tx.cumulativeUnits).toBeCloseTo(cumulativeUnits, 4);
          expect(tx.currentValue).toBeCloseTo(cumulativeUnits * tx.nav, 2);
        }
      });
    });
  });
});