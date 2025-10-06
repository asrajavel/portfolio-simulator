import { calculateSipRollingXirr, Transaction } from './sipRollingXirr';
import { fastGrowingFund, slowGrowingFund } from './sipRollingXirr.fixtures';

/**
 * Transaction integrity tests for SIP Rolling XIRR with Rebalancing
 * 
 * Verifies:
 * - Transaction ordering (SIP before rebalance)
 * - Cumulative units tracking
 * - Cashflow neutrality during rebalancing
 */

describe('calculateSipRollingXirr - Transaction Integrity', () => {
  describe('Transaction Ordering', () => {
    it('should have correct transaction order (SIP then rebalance)', () => {
      const allocations = [50, 50];
      const threshold = 5;
      
      const result = calculateSipRollingXirr(
        [fastGrowingFund, slowGrowingFund],
        1,
        allocations,
        true,
        threshold
      );

      result.forEach(entry => {
        const transactions = entry.transactions;
        
        // Group by date
        const txByDate = new Map<string, Transaction[]>();
        transactions.forEach(tx => {
          const dateKey = tx.when.toISOString().split('T')[0];
          if (!txByDate.has(dateKey)) {
            txByDate.set(dateKey, []);
          }
          txByDate.get(dateKey)!.push(tx);
        });

        // For each date, buy transactions should come before rebalance transactions
        txByDate.forEach((txs, date) => {
          const buyIndices = txs
            .map((tx, idx) => ({ tx, idx }))
            .filter(({ tx }) => tx.type === 'buy')
            .map(({ idx }) => idx);
          
          const rebalanceIndices = txs
            .map((tx, idx) => ({ tx, idx }))
            .filter(({ tx }) => tx.type === 'rebalance')
            .map(({ idx }) => idx);

          if (buyIndices.length > 0 && rebalanceIndices.length > 0) {
            const maxBuyIdx = Math.max(...buyIndices);
            const minRebalanceIdx = Math.min(...rebalanceIndices);
            
            // Buy transactions should come before rebalance transactions
            expect(maxBuyIdx).toBeLessThan(minRebalanceIdx);
          }
        });
      });
    });
  });

  describe('Cumulative Units', () => {
    it('should have correct cumulative units after each transaction', () => {
      const allocations = [50, 50];
      const threshold = 5;
      
      const result = calculateSipRollingXirr(
        [fastGrowingFund, slowGrowingFund],
        1,
        allocations,
        true,
        threshold
      );

      const lastEntry = result[result.length - 1];
      
      // Track cumulative units manually and verify
      const manualCumulativeUnits = [0, 0];
      
      lastEntry.transactions.forEach(tx => {
        if (tx.type !== 'sell') {
          manualCumulativeUnits[tx.fundIdx] += tx.units;
          expect(tx.cumulativeUnits).toBeCloseTo(manualCumulativeUnits[tx.fundIdx], 5);
        }
      });
    });
  });

  describe('Cashflow Neutrality', () => {
    it('should maintain zero net cashflow during rebalancing events', () => {
      const allocations = [50, 50];
      const threshold = 5;
      
      const result = calculateSipRollingXirr(
        [fastGrowingFund, slowGrowingFund],
        1,
        allocations,
        true,
        threshold
      );

      // Check each date's rebalancing transactions
      result.forEach(entry => {
        const rebalanceTransactions = entry.transactions.filter(tx => tx.type === 'rebalance');
        
        if (rebalanceTransactions.length > 0) {
          // Sum of all rebalancing amounts should be ~0 (within floating point error)
          const totalRebalanceAmount = rebalanceTransactions.reduce(
            (sum, tx) => sum + tx.amount,
            0
          );
          
          // Should be exactly 0 or very close due to floating point
          expect(totalRebalanceAmount).toBeCloseTo(0, 10);
        }
      });
    });
  });
});
