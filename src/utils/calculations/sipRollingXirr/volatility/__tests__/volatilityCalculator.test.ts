import { calculateVolatility } from '../volatilityCalculator';
import { DailyPortfolioValue } from '../portfolioValue';

/**
 * Tests for portfolio volatility calculation
 * 
 * Verifies:
 * - Daily returns = (today - yesterday + cashFlow) / yesterday
 * - Skips forward-filled days (weekends/holidays) where value didn't change
 * - Volatility = StdDev(daily returns) × √tradingDaysPerYear
 * - Trading days per year calculated dynamically from actual data
 * - Handles edge cases (insufficient data, zero volatility)
 */

describe('calculateVolatility', () => {
  it('should return zero volatility for insufficient data', () => {
    const dailyValues: DailyPortfolioValue[] = [
      { date: new Date('2024-01-01'), totalValue: 100.00, cashFlow: 0 }
    ];

    expect(calculateVolatility(dailyValues)).toBe(0);
  });

  it('should return zero volatility when all forward-filled days are skipped', () => {
    const dailyValues: DailyPortfolioValue[] = [
      { date: new Date('2024-01-01'), totalValue: 100.00, cashFlow: 0 },
      { date: new Date('2024-01-02'), totalValue: 100.00, cashFlow: 0 }, // Forward-filled (skipped)
      { date: new Date('2024-01-03'), totalValue: 100.00, cashFlow: 0 }  // Forward-filled (skipped)
    ];

    // All days after first are forward-filled (value unchanged, no cash flow)
    // So no actual returns to calculate, should return 0
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
    // 3 returns from 3 day-pairs = 100% trading day ratio
    // Annualized: stdDev × √365 ≈ 3.55%
    expect(result).toBeCloseTo(3.55, 1);
  });

  it('should skip forward-filled weekends/holidays but include trading days', () => {
    const dailyValues: DailyPortfolioValue[] = [
      { date: new Date('2024-01-01'), totalValue: 100.00, cashFlow: 0 },  // Mon
      { date: new Date('2024-01-02'), totalValue: 105.00, cashFlow: 0 },  // Tue: +5%
      { date: new Date('2024-01-03'), totalValue: 105.00, cashFlow: 0 },  // Wed: forward-filled (skipped)
      { date: new Date('2024-01-04'), totalValue: 105.00, cashFlow: 0 },  // Thu: forward-filled (skipped)
      { date: new Date('2024-01-05'), totalValue: 110.00, cashFlow: 0 }   // Fri: +4.76%
    ];

    const result = calculateVolatility(dailyValues);
    
    // Only 2 actual returns: 5% and 4.76%
    // 2 returns from 4 day-pairs = 50% trading day ratio
    // Annualized: stdDev × √182.5 ≈ 1.59%
    expect(result).toBeGreaterThan(0);
    expect(result).toBeCloseTo(1.63, 1);
  });

  it('should include buy days even when value unchanged', () => {
    const dailyValues: DailyPortfolioValue[] = [
      { date: new Date('2024-01-01'), totalValue: 100.00, cashFlow: 0 },
      { date: new Date('2024-01-02'), totalValue: 200.00, cashFlow: -100.00 }, // Buy: invested 100, value went to 200
      { date: new Date('2024-01-03'), totalValue: 200.00, cashFlow: 0 }        // Forward-filled (skipped)
    ];

    const result = calculateVolatility(dailyValues);
    
    // Day 1→2: return = (200 - 100 + (-100)) / 100 = 0% (buy day with no market movement)
    // Day 2→3: skipped (forward-filled)
    // Only 1 return, need at least 2 for volatility
    expect(result).toBe(0);
  });

  it('should calculate correct volatility with mix of trading and forward-filled days', () => {
    const dailyValues: DailyPortfolioValue[] = [
      { date: new Date('2024-01-01'), totalValue: 100.00, cashFlow: 0 },
      { date: new Date('2024-01-02'), totalValue: 110.00, cashFlow: 0 },  // +10%
      { date: new Date('2024-01-03'), totalValue: 110.00, cashFlow: 0 },  // Forward-filled (skipped)
      { date: new Date('2024-01-04'), totalValue: 110.00, cashFlow: 0 },  // Forward-filled (skipped)
      { date: new Date('2024-01-05'), totalValue: 100.00, cashFlow: 0 },  // -9.09%
      { date: new Date('2024-01-06'), totalValue: 100.00, cashFlow: 0 },  // Forward-filled (skipped)
      { date: new Date('2024-01-07'), totalValue: 110.00, cashFlow: 0 }   // +10%
    ];

    const result = calculateVolatility(dailyValues);
    
    // 3 actual returns: +10%, -9.09%, +10%
    // 3 returns from 6 day-pairs = 50% trading day ratio
    // Should have significant volatility due to variation
    expect(result).toBeGreaterThan(0);
    expect(result).toBeGreaterThan(50); // High volatility due to large swings
  });
});

