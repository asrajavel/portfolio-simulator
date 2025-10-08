import { calculateSipRollingXirr, Transaction } from './sipRollingXirr';
import { NavEntry } from '../../types/navData';
import { moderateGrowthFund } from './sipRollingXirr.fixtures';

/**
 * Tests specifically for 'nil' transaction generation and verification
 * 
 * Verifies:
 * - 'nil' transactions are created for non-SIP dates
 * - 'nil' transactions have correct cumulative units and values
 * - Allocation percentages are calculated correctly for 'nil' transactions
 */

// Helper function to verify transaction properties
function expectTransactionToMatch(
  actual: Transaction,
  expected: {
    fundIdx: number;
    nav: number;
    units: number;
    amount: number;
    type: 'buy' | 'sell' | 'rebalance' | 'nil';
    cumulativeUnits: number;
    currentValue: number;
    allocationPercentage?: number;
  }
) {
  expect(actual.fundIdx).toBe(expected.fundIdx);
  expect(actual.nav).toBe(expected.nav);
  expect(actual.units).toBe(expected.units);
  expect(actual.amount).toBe(expected.amount);
  expect(actual.type).toBe(expected.type);
  expect(actual.cumulativeUnits).toBeCloseTo(expected.cumulativeUnits, 4);
  expect(actual.currentValue).toBeCloseTo(expected.currentValue, 2);
  if (expected.allocationPercentage !== undefined) {
    expect(actual.allocationPercentage).toBe(expected.allocationPercentage);
  }
}

describe('calculateSipRollingXirr - Nil Transactions', () => {

  describe('Single Fund Nil Transactions', () => {
    it('should create nil transactions for non-SIP dates with correct values', () => {
      const allocations = [100];
      const result = calculateSipRollingXirr([moderateGrowthFund], 1, allocations, false, 5, true);
      const lastEntry = result[result.length - 1];

      // Get all nil transactions
      const nilTransactions = lastEntry.transactions.filter(tx => tx.type === 'nil');

      // Should have 353 nil transactions (365 days - 12 SIP days = 353)
      expect(nilTransactions.length).toBe(353);
      
      // Verify first nil transaction (Jan 2 - day after first SIP)
      const jan2Nil = nilTransactions[0];
      expect(jan2Nil.when.toISOString().split('T')[0]).toBe('2023-01-02');
      expectTransactionToMatch(jan2Nil, { fundIdx: 0, nav: 105, units: 0, amount: 0, type: 'nil', cumulativeUnits: 1.0000, currentValue: 105.00, allocationPercentage: 100 });
      
      // Verify a mid-month nil transaction (Feb 2 - after 2 SIPs, cumulative units updated)
      const feb2Nil = nilTransactions.find(tx => 
        tx.when.toISOString().split('T')[0] === '2023-02-02'
      );
      expect(feb2Nil).toBeDefined();
      expectTransactionToMatch(feb2Nil!, { fundIdx: 0, nav: 110, units: 0, amount: 0, type: 'nil', cumulativeUnits: 1.9524, currentValue: 214.76, allocationPercentage: 100 });
      
      // Verify last nil transaction (Dec 31 - after all 12 SIPs)
      const dec31Nil = nilTransactions[nilTransactions.length - 1];
      expect(dec31Nil.when.toISOString().split('T')[0]).toBe('2023-12-31');
      expectTransactionToMatch(dec31Nil, { fundIdx: 0, nav: 160, units: 0, amount: 0, type: 'nil', cumulativeUnits: 9.5901, currentValue: 1534.42, allocationPercentage: 100 });
    });
  });

  describe('Multi-Fund Nil Transactions', () => {
    it('should create nil transactions for both funds with correct values and allocation percentages', () => {
      const fund1: NavEntry[] = [
        { date: new Date('2023-01-01'), nav: 100 },
        { date: new Date('2023-02-01'), nav: 110 },
        { date: new Date('2023-03-01'), nav: 120 },
      ];

      const fund2: NavEntry[] = [
        { date: new Date('2023-01-01'), nav: 50 },
        { date: new Date('2023-02-01'), nav: 55 },
        { date: new Date('2023-03-01'), nav: 60 },
      ];

      const allocations = [60, 40]; // 60/40 split
      const result = calculateSipRollingXirr([fund1, fund2], 2/12, allocations, false, 5, true);
      const lastEntry = result[result.length - 1];

      // Get nil transactions for Jan 2 (day after first SIP)
      const jan2Nils = lastEntry.transactions.filter(
        tx => tx.when.toISOString().split('T')[0] === '2023-01-02' && tx.type === 'nil'
      );
      
      expect(jan2Nils.length).toBe(2); // One nil per fund
      expectTransactionToMatch(jan2Nils[0], { fundIdx: 0, nav: 110, units: 0, amount: 0, type: 'nil', cumulativeUnits: 0.6000, currentValue: 66.00, allocationPercentage: 60 });
      expectTransactionToMatch(jan2Nils[1], { fundIdx: 1, nav: 55, units: 0, amount: 0, type: 'nil', cumulativeUnits: 0.8000, currentValue: 44.00, allocationPercentage: 40 });

      // Get nil transactions for Feb 2 (day after second SIP - cumulative units updated)
      const feb2Nils = lastEntry.transactions.filter(
        tx => tx.when.toISOString().split('T')[0] === '2023-02-02' && tx.type === 'nil'
      );
      
      expect(feb2Nils.length).toBe(2);
      expectTransactionToMatch(feb2Nils[0], { fundIdx: 0, nav: 120, units: 0, amount: 0, type: 'nil', cumulativeUnits: 1.1455, currentValue: 137.45, allocationPercentage: 60 });
      expectTransactionToMatch(feb2Nils[1], { fundIdx: 1, nav: 60, units: 0, amount: 0, type: 'nil', cumulativeUnits: 1.5273, currentValue: 91.64, allocationPercentage: 40 });
    });
  });
});
