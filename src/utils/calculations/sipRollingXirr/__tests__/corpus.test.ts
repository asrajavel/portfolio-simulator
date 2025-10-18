import { calculateSipRollingXirr } from '../index';
import { NavEntry } from '../../../../types/navData';

/**
 * Tests for Corpus Calculation
 * 
 * Verifies:
 * 1. Basic corpus value calculation with real sipAmount
 * 2. Linear scaling property of corpus with different sipAmount
 * 3. Integration with step-up SIP feature
 */

const createTestNavData = (startNav: number, growthRate: number, years: number): NavEntry[] => {
  const data: NavEntry[] = [];
  const startDate = new Date('2020-01-01');
  const totalDays = years * 365 + 60;
  for (let i = 0; i <= totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const nav = startNav * Math.pow(1 + growthRate, i / 365);
    data.push({ date, nav });
  }
  return data;
};

describe('Corpus Calculation', () => {
  it('should calculate correct corpus value with sipAmount', () => {
    const navData = createTestNavData(100, 0.12, 2);
    const sipAmount = 10000;
    const result = calculateSipRollingXirr([navData], 2, [100], false, 5, false, false, 0, sipAmount);

    const lastEntry = result[result.length - 1];
    const corpusValue = lastEntry.transactions
      .filter(tx => tx.type === 'sell')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    // 10000/month for 24 months at 12% = ~2.7 lakhs
    expect(corpusValue).toBeCloseTo(270563.98, 2);
  });

  it('should scale corpus linearly with sipAmount', () => {
    const navData = createTestNavData(100, 0.10, 2);
    
    const result5k = calculateSipRollingXirr([navData], 2, [100], false, 5, false, false, 0, 5000);
    const corpus5k = result5k[result5k.length - 1].transactions
      .filter(tx => tx.type === 'sell')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const result20k = calculateSipRollingXirr([navData], 2, [100], false, 5, false, false, 0, 20000);
    const corpus20k = result20k[result20k.length - 1].transactions
      .filter(tx => tx.type === 'sell')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    // Corpus scales linearly: 20k should be 4x of 5k
    expect(corpus20k / corpus5k).toBeCloseTo(4, 1);
  });

  it('should calculate corpus with step-up SIP', () => {
    const navData = createTestNavData(100, 0.12, 2);
    const sipAmount = 10000;
    
    const result = calculateSipRollingXirr([navData], 2, [100], false, 5, false, true, 10, sipAmount);
    
    const lastEntry = result[result.length - 1];
    const corpusValue = lastEntry.transactions
      .filter(tx => tx.type === 'sell')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    // Step-up increases corpus
    expect(corpusValue).toBeCloseTo(283326.44, 2);
  });
});

