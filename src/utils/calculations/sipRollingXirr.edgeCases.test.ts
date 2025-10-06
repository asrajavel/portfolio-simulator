import { calculateSipRollingXirr } from './sipRollingXirr';
import { fastGrowingFund, slowGrowingFund, moderateGrowthFund, decliningFund } from './sipRollingXirr.fixtures';

/**
 * Edge case tests for SIP Rolling XIRR with Rebalancing
 * 
 * Tests extreme scenarios:
 * - 0% threshold (always rebalance)
 * - 100% threshold (never rebalance)
 * - Three funds
 * - Negative returns
 */

describe('calculateSipRollingXirr - Edge Cases', () => {
  describe('Threshold Extremes', () => {
    it('should handle 0% threshold (always rebalance)', () => {
      const allocations = [50, 50];
      const threshold = 0; // Always rebalance
      
      const result = calculateSipRollingXirr(
        [fastGrowingFund, slowGrowingFund],
        1,
        allocations,
        true,
        threshold
      );

      const lastEntry = result[result.length - 1];
      const rebalanceTransactions = lastEntry.transactions.filter(tx => tx.type === 'rebalance');
      
      // With 0% threshold, should rebalance after every SIP (11 SIPs = 22 rebalancing txs)
      expect(rebalanceTransactions.length).toBe(22);
    });

    it('should handle 100% threshold (never rebalance)', () => {
      const allocations = [50, 50];
      const threshold = 100; // Never rebalance
      
      const result = calculateSipRollingXirr(
        [fastGrowingFund, slowGrowingFund],
        1,
        allocations,
        true,
        threshold
      );

      const lastEntry = result[result.length - 1];
      const rebalanceTransactions = lastEntry.transactions.filter(tx => tx.type === 'rebalance');
      
      // With 100% threshold, should never rebalance
      expect(rebalanceTransactions.length).toBe(0);
    });
  });

  describe('Multiple Funds', () => {
    it('should handle three funds with rebalancing', () => {
      const allocations = [33.33, 33.33, 33.34]; // Three funds
      const threshold = 5;
      
      const result = calculateSipRollingXirr(
        [fastGrowingFund, slowGrowingFund, moderateGrowthFund],
        1,
        allocations,
        true,
        threshold
      );

      const lastEntry = result[result.length - 1];
      
      // Verify all three funds have buy, rebalance, and sell transactions
      const fund0Buys = lastEntry.transactions.filter(tx => tx.fundIdx === 0 && tx.type === 'buy');
      const fund1Buys = lastEntry.transactions.filter(tx => tx.fundIdx === 1 && tx.type === 'buy');
      const fund2Buys = lastEntry.transactions.filter(tx => tx.fundIdx === 2 && tx.type === 'buy');
      
      expect(fund0Buys.length).toBe(12); // 12 monthly SIPs
      expect(fund1Buys.length).toBe(12);
      expect(fund2Buys.length).toBe(12);
      
      // Should have rebalancing for all funds
      const rebalanceTxs = lastEntry.transactions.filter(tx => tx.type === 'rebalance');
      expect(rebalanceTxs.length).toBe(15); // 5 rebalancing events × 3 funds
    });
  });

  describe('Negative Returns', () => {
    it('should handle negative returns with rebalancing', () => {
      const allocations = [50, 50];
      const threshold = 5;
      
      const result = calculateSipRollingXirr(
        [decliningFund, slowGrowingFund],
        1,
        allocations,
        true,
        threshold
      );

      const lastEntry = result[result.length - 1];
      
      // XIRR should be negative (declining fund causes losses)
      expect(lastEntry.xirr).toBeCloseTo(-0.30606173842328904, 10);
      
      // Rebalancing should still occur
      const rebalanceTransactions = lastEntry.transactions.filter(tx => tx.type === 'rebalance');
      expect(rebalanceTransactions.length).toBe(6); // 3 rebalancing events × 2 funds
    });
  });
});
