import { calculateDailySipPortfolioValue } from '../sipPortfolioValue';
import { Transaction } from '../../types';

const createTestTransaction = (when: Date, type: 'buy' | 'nil', currentValue: number, amount: number = 0): Transaction => ({
  fundIdx: 0,
  nav: 100,
  when,
  units: 1,
  amount,
  type,
  cumulativeUnits: 1,
  currentValue,
  allocationPercentage: 100,
});

describe('calculateDailySipPortfolioValue', () => {
  it('should calculate daily values correctly', () => {
    const transactions: Transaction[] = [
      createTestTransaction(new Date('2023-01-01'), 'buy', 100, -100),
      createTestTransaction(new Date('2023-01-02'), 'nil', 110, 0),
    ];

    const result = calculateDailySipPortfolioValue(transactions);

    expect(result).toHaveLength(2);
    expect(result[0].totalValue).toBe(100);
    expect(result[0].cashFlow).toBe(-100);
    expect(result[1].totalValue).toBe(110);
    expect(result[1].cashFlow).toBe(0);
  });

  it('should group multiple transactions on same date', () => {
    const transactions: Transaction[] = [
      createTestTransaction(new Date('2023-01-01'), 'buy', 50, -50),
      { ...createTestTransaction(new Date('2023-01-01'), 'buy', 50, -50), fundIdx: 1 },
    ];

    const result = calculateDailySipPortfolioValue(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].totalValue).toBe(100); // 50 + 50
    expect(result[0].cashFlow).toBe(-100); // -50 + -50
  });

  it('should return empty array if no relevant transactions', () => {
    const transactions: Transaction[] = [];

    const result = calculateDailySipPortfolioValue(transactions);

    expect(result).toEqual([]);
  });
});

