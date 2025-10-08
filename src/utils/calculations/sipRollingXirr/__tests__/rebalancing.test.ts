import { calculateSipRollingXirr } from '../index';
import { fastGrowingFund, slowGrowingFund, stableFund1, stableFund2 } from '../testFixtures';

/**
 * Core rebalancing tests for SIP Rolling XIRR
 * 
 * Tests the fundamental rebalancing behavior:
 * - Rebalancing triggers when threshold is exceeded
 * - Rebalancing does NOT trigger when within threshold
 * - XIRR differences with/without rebalancing
 */

describe('calculateSipRollingXirr - Core Rebalancing', () => {
  describe('Rebalancing Trigger Logic', () => {
    it('should trigger rebalancing when allocation drift exceeds threshold with exact transaction verification', () => {
      const allocations = [50, 50]; // Target 50/50
      const threshold = 5; // 5% threshold
      
      const result = calculateSipRollingXirr(
        [fastGrowingFund, slowGrowingFund],
        1, // 1 year
        allocations,
        true, // rebalancing enabled
        threshold
      );

      const lastEntry = result[result.length - 1];
      
      // Expected: 24 buys (12 months × 2 funds) + 10 rebalances (5 events × 2 funds) + 2 sells = 36 non-nil transactions
      const expectedTransactions = [
        // Month 1: Jan 2023 - Initial SIP (perfect 50/50 split)
        { fundIdx: 0, nav: 100, when: new Date('2023-01-01'), units: 0.5, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 100, when: new Date('2023-01-01'), units: 0.5, amount: -50, type: 'buy' },
        
        // Month 2: Feb 2023 - SIP only
        { fundIdx: 0, nav: 120, when: new Date('2023-02-01'), units: 0.4167, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 102, when: new Date('2023-02-01'), units: 0.4902, amount: -50, type: 'buy' },
        
        // Month 3: Mar 2023 - SIP only
        { fundIdx: 0, nav: 144, when: new Date('2023-03-01'), units: 0.3472, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 104.04, when: new Date('2023-03-01'), units: 0.4806, amount: -50, type: 'buy' },
        
        // Month 4: Apr 2023 - SIP + REBALANCE #1 (drift exceeded 5%)
        { fundIdx: 0, nav: 172.8, when: new Date('2023-04-01'), units: 0.2894, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 106.12, when: new Date('2023-04-01'), units: 0.4712, amount: -50, type: 'buy' },
        { fundIdx: 0, nav: 172.8, when: new Date('2023-04-01'), units: -0.1803, amount: 31.16, type: 'rebalance' },
        { fundIdx: 1, nav: 106.12, when: new Date('2023-04-01'), units: 0.2936, amount: -31.16, type: 'rebalance' },
        
        // Month 5: May 2023 - SIP only
        { fundIdx: 0, nav: 207.36, when: new Date('2023-05-01'), units: 0.2411, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 108.24, when: new Date('2023-05-01'), units: 0.4619, amount: -50, type: 'buy' },
        
        // Month 6: Jun 2023 - SIP + REBALANCE #2
        { fundIdx: 0, nav: 248.83, when: new Date('2023-06-01'), units: 0.2009, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 110.41, when: new Date('2023-06-01'), units: 0.4529, amount: -50, type: 'buy' },
        { fundIdx: 0, nav: 248.83, when: new Date('2023-06-01'), units: -0.2086, amount: 51.89, type: 'rebalance' },
        { fundIdx: 1, nav: 110.41, when: new Date('2023-06-01'), units: 0.4700, amount: -51.89, type: 'rebalance' },
        
        // Month 7: Jul 2023 - SIP only
        { fundIdx: 0, nav: 298.6, when: new Date('2023-07-01'), units: 0.1674, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 112.61, when: new Date('2023-07-01'), units: 0.4440, amount: -50, type: 'buy' },
        
        // Month 8: Aug 2023 - SIP + REBALANCE #3
        { fundIdx: 0, nav: 358.32, when: new Date('2023-08-01'), units: 0.1395, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 114.87, when: new Date('2023-08-01'), units: 0.4353, amount: -50, type: 'buy' },
        { fundIdx: 0, nav: 358.32, when: new Date('2023-08-01'), units: -0.2355, amount: 84.37, type: 'rebalance' },
        { fundIdx: 1, nav: 114.87, when: new Date('2023-08-01'), units: 0.7345, amount: -84.37, type: 'rebalance' },
        
        // Month 9: Sep 2023 - SIP only
        { fundIdx: 0, nav: 429.98, when: new Date('2023-09-01'), units: 0.1163, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 117.16, when: new Date('2023-09-01'), units: 0.4268, amount: -50, type: 'buy' },
        
        // Month 10: Oct 2023 - SIP + REBALANCE #4
        { fundIdx: 0, nav: 515.98, when: new Date('2023-10-01'), units: 0.0969, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 119.51, when: new Date('2023-10-01'), units: 0.4184, amount: -50, type: 'buy' },
        { fundIdx: 0, nav: 515.98, when: new Date('2023-10-01'), units: -0.2415, amount: 124.63, type: 'rebalance' },
        { fundIdx: 1, nav: 119.51, when: new Date('2023-10-01'), units: 1.0428, amount: -124.63, type: 'rebalance' },
        
        // Month 11: Nov 2023 - SIP only
        { fundIdx: 0, nav: 619.18, when: new Date('2023-11-01'), units: 0.0808, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 121.9, when: new Date('2023-11-01'), units: 0.4102, amount: -50, type: 'buy' },
        
        // Month 12: Dec 2023 - SIP + REBALANCE #5
        { fundIdx: 0, nav: 743.01, when: new Date('2023-12-01'), units: 0.0673, amount: -50, type: 'buy' },
        { fundIdx: 1, nav: 124.34, when: new Date('2023-12-01'), units: 0.4021, amount: -50, type: 'buy' },
        { fundIdx: 0, nav: 743.01, when: new Date('2023-12-01'), units: -0.2349, amount: 174.55, type: 'rebalance' },
        { fundIdx: 1, nav: 124.34, when: new Date('2023-12-01'), units: 1.4038, amount: -174.55, type: 'rebalance' },
        
        // Final: Jan 2024 - Sell all units
        { fundIdx: 0, nav: 891.61, when: new Date('2024-01-01'), units: 1.5627, amount: 1393.34, type: 'sell' },
        { fundIdx: 1, nav: 126.82, when: new Date('2024-01-01'), units: 9.3383, amount: 1184.28, type: 'sell' },
      ];
      
      // Verify transaction count (nil transactions not included by default)
      expect(lastEntry.transactions.length).toBe(expectedTransactions.length);
      
      // Verify each transaction matches (with reasonable precision)
      lastEntry.transactions.forEach((tx, i) => {
        const expected = expectedTransactions[i];
        expect(tx.fundIdx).toBe(expected.fundIdx);
        expect(tx.nav).toBeCloseTo(expected.nav, 2);
        expect(tx.when.toISOString().split('T')[0]).toBe(expected.when.toISOString().split('T')[0]);
        expect(tx.units).toBeCloseTo(expected.units, 4);
        expect(tx.amount).toBeCloseTo(expected.amount, 2);
        expect(tx.type).toBe(expected.type);
      });
      
      // Verify exact XIRR value
      expect(lastEntry.xirr).toBeCloseTo(2.605716656746517, 10);
    });

    it('should NOT trigger rebalancing when allocation drift is within threshold', () => {
      const allocations = [50, 50];
      const threshold = 10; // High threshold (10%)
      
      const result = calculateSipRollingXirr(
        [stableFund1, stableFund2],
        1,
        allocations,
        true,
        threshold
      );

      const lastEntry = result[result.length - 1];
      const rebalanceTransactions = lastEntry.transactions.filter(tx => tx.type === 'rebalance');
      
      // With high threshold and stable funds, should have no rebalancing events
      expect(rebalanceTransactions.length).toBe(0);
    });
  });

  describe('XIRR Impact', () => {
    it('should produce different XIRR with vs without rebalancing', () => {
      const allocations = [50, 50];
      const threshold = 5;
      
      // Calculate with rebalancing
      const withRebalancing = calculateSipRollingXirr(
        [fastGrowingFund, slowGrowingFund],
        1,
        allocations,
        true,
        threshold
      );

      // Calculate without rebalancing
      const withoutRebalancing = calculateSipRollingXirr(
        [fastGrowingFund, slowGrowingFund],
        1,
        allocations,
        false,
        threshold
      );

      expect(withRebalancing.length).toBe(withoutRebalancing.length);
      
      // XIRRs should be different (rebalancing affects returns)
      const lastWithRebalancing = withRebalancing[withRebalancing.length - 1];
      const lastWithoutRebalancing = withoutRebalancing[withoutRebalancing.length - 1];
      
      // Exact XIRR values
      expect(lastWithRebalancing.xirr).toBeCloseTo(2.605716656746517, 10);
      expect(lastWithoutRebalancing.xirr).toBeCloseTo(3.6792974731956845, 10);
      
      // In this scenario, rebalancing reduces returns (selling winners to buy losers)
      expect(lastWithoutRebalancing.xirr).toBeGreaterThan(lastWithRebalancing.xirr);
    });
  });
});
