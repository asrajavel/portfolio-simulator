import { calculateDailyPortfolioValue } from '../portfolioValue';
import { Transaction } from '../../types';

/**
 * Tests for daily portfolio value calculation
 * 
 * Verifies:
 * - Total Value = Σ(currentValue) across all funds
 * - Includes 'nil' and 'buy' transactions for daily returns calculation
 * - Excludes 'sell' and 'rebalance' transactions
 * - Tracks cash flows for accurate return calculation
 */

describe('calculateDailyPortfolioValue', () => {
  it('should calculate total value for single fund', () => {
    const transactions: Transaction[] = [
      { fundIdx: 0, when: new Date('2024-01-01'), nav: 100.00, units: 0, amount: 0, type: 'nil', cumulativeUnits: 1.0000, currentValue: 100.00, allocationPercentage: 100 }
    ];

    const result = calculateDailyPortfolioValue(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].totalValue).toBe(100);
    expect(result[0].cashFlow).toBe(0);
  });

  it('should calculate total value for multiple funds', () => {
    const transactions: Transaction[] = [
      { fundIdx: 0, when: new Date('2024-01-01'), nav: 100.00, units: 0, amount: 0, type: 'nil', cumulativeUnits: 0.6000, currentValue: 60.00, allocationPercentage: 60 },
      { fundIdx: 1, when: new Date('2024-01-01'), nav: 200.00, units: 0, amount: 0, type: 'nil', cumulativeUnits: 0.2000, currentValue: 40.00, allocationPercentage: 40 }
    ];

    const result = calculateDailyPortfolioValue(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].totalValue).toBe(100);
    expect(result[0].cashFlow).toBe(0);
  });

  it('should include buy and nil but ignore sell and rebalance transactions', () => {
    const transactions: Transaction[] = [
      { fundIdx: 0, when: new Date('2024-01-01'), nav: 100.00, units: 1.0000, amount: -100.00, type: 'buy', cumulativeUnits: 1.0000, currentValue: 100.00, allocationPercentage: 100 },
      { fundIdx: 0, when: new Date('2024-01-02'), nav: 105.00, units: -1.0000, amount: 105.00, type: 'sell', cumulativeUnits: 0, currentValue: 0, allocationPercentage: 0 },
      { fundIdx: 0, when: new Date('2024-01-03'), nav: 110.00, units: 0.1000, amount: 0, type: 'rebalance', cumulativeUnits: 0.1000, currentValue: 11.00, allocationPercentage: 100 },
      { fundIdx: 0, when: new Date('2024-01-04'), nav: 115.00, units: 0, amount: 0, type: 'nil', cumulativeUnits: 0.1000, currentValue: 11.50, allocationPercentage: 100 }
    ];

    const result = calculateDailyPortfolioValue(transactions);

    expect(result).toHaveLength(2);
    expect(result[0].totalValue).toBe(100);
    expect(result[0].cashFlow).toBe(-100);
    expect(result[1].totalValue).toBe(11.5);
    expect(result[1].cashFlow).toBe(0);
  });
});

