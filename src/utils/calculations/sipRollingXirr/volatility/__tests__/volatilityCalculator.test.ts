import { calculateVolatility } from '../volatilityCalculator';
import { DailyPortfolioValue } from '../portfolioValue';

/**
 * Tests for portfolio volatility calculation
 * 
 * Verifies:
 * - Daily returns = (today - yesterday + cashFlow) / yesterday
 * - Volatility = StdDev(daily returns) × √252
 * - Handles edge cases (insufficient data, zero volatility)
 */

describe('calculateVolatility', () => {
  it('should return zero volatility for insufficient data', () => {
    const dailyValues: DailyPortfolioValue[] = [
      { date: new Date('2024-01-01'), totalValue: 100.00, cashFlow: 0 }
    ];

    expect(calculateVolatility(dailyValues)).toBe(0);
  });

  it('should calculate zero volatility for constant value', () => {
    const dailyValues: DailyPortfolioValue[] = [
      { date: new Date('2024-01-01'), totalValue: 100.00, cashFlow: 0 },
      { date: new Date('2024-01-02'), totalValue: 100.00, cashFlow: 0 },
      { date: new Date('2024-01-03'), totalValue: 100.00, cashFlow: 0 }
    ];

    expect(calculateVolatility(dailyValues)).toBe(0);
  });

  it('should calculate annualized volatility correctly', () => {
    const dailyValues: DailyPortfolioValue[] = [
      { date: new Date('2024-01-01'), totalValue: 100.00, cashFlow: 0 },
      { date: new Date('2024-01-02'), totalValue: 105.00, cashFlow: 0 },
      { date: new Date('2024-01-03'), totalValue: 110.00, cashFlow: 0 },
      { date: new Date('2024-01-04'), totalValue: 115.00, cashFlow: 0 }
    ];

    const result = calculateVolatility(dailyValues);
    
    // Daily returns: 5%, 4.76%, 4.54%
    // Annualized volatility: 2.95%
    expect(result).toBeCloseTo(2.95, 2);
  });
});

