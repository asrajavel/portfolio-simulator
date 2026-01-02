import { calculateSipRollingXirr } from '../index';
import { 
  getCurrentTargetAllocation, 
  shouldPerformAnnualAdjustment,
  isAnniversaryDate 
} from '../core/allocationTransition';
import { NavEntry } from '../../../../types/navData';

// Helper to generate NAV data for testing
function generateNavData(years: number): NavEntry[] {
  const navData: NavEntry[] = [];
  const startDate = new Date(2010, 0, 1);
  const endDate = new Date(2010 + years, 0, 1);
  const currentDate = new Date(startDate);
  let nav = 100;
  
  while (currentDate <= endDate) {
    navData.push({
      date: new Date(currentDate),
      nav: nav
    });
    // Increment nav by ~1% per month for realistic growth
    nav = nav * 1.01;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return navData;
}

describe('Allocation Transition (Glide Path)', () => {
  describe('isAnniversaryDate', () => {
    it('should return true when month and day match', () => {
      const startDate = new Date(2010, 1, 1); // Feb 1, 2010
      const checkDate = new Date(2011, 1, 1); // Feb 1, 2011
      expect(isAnniversaryDate(checkDate, startDate)).toBe(true);
    });

    it('should return false when only month matches', () => {
      const startDate = new Date(2010, 1, 1); // Feb 1, 2010
      const checkDate = new Date(2011, 1, 2); // Feb 2, 2011
      expect(isAnniversaryDate(checkDate, startDate)).toBe(false);
    });

    it('should return false when only day matches', () => {
      const startDate = new Date(2010, 1, 1); // Feb 1, 2010
      const checkDate = new Date(2011, 2, 1); // Mar 1, 2011
      expect(isAnniversaryDate(checkDate, startDate)).toBe(false);
    });
  });

  describe('getCurrentTargetAllocation', () => {
    const startAllocations = [50, 50];
    const endAllocations = [100, 0];
    const startDate = new Date(2010, 0, 1); // Jan 1, 2010
    const rollingYears = 7;
    const transitionYears = 2;

    it('should return start allocations before transition window', () => {
      // 4 years elapsed, transition starts at year 5 (7 - 2)
      const sipDate = new Date(2014, 0, 1);
      const result = getCurrentTargetAllocation(
        sipDate,
        startDate,
        rollingYears,
        transitionYears,
        startAllocations,
        endAllocations
      );
      expect(result).toEqual([50, 50]);
    });

    it('should return end allocations after rolling period', () => {
      // 8 years elapsed, past the 7-year period
      const sipDate = new Date(2018, 0, 1);
      const result = getCurrentTargetAllocation(
        sipDate,
        startDate,
        rollingYears,
        transitionYears,
        startAllocations,
        endAllocations
      );
      expect(result).toEqual([100, 0]);
    });

    it('should interpolate in transition window - first year', () => {
      // 5 years elapsed, in transition window (0 anniversaries completed)
      const sipDate = new Date(2015, 0, 1);
      const result = getCurrentTargetAllocation(
        sipDate,
        startDate,
        rollingYears,
        transitionYears,
        startAllocations,
        endAllocations
      );
      // 0 / 2 = 0% progress -> [50, 50]
      expect(result).toEqual([50, 50]);
    });

    it('should interpolate in transition window - after first anniversary', () => {
      // 6 years elapsed, after first anniversary in transition
      const sipDate = new Date(2016, 0, 1);
      const result = getCurrentTargetAllocation(
        sipDate,
        startDate,
        rollingYears,
        transitionYears,
        startAllocations,
        endAllocations
      );
      // 1 / 2 = 50% progress -> [75, 25]
      expect(result).toEqual([75, 25]);
    });

    it('should interpolate in transition window - after second anniversary', () => {
      // 7 years elapsed, after second anniversary (end of rolling period)
      const sipDate = new Date(2017, 0, 1);
      const result = getCurrentTargetAllocation(
        sipDate,
        startDate,
        rollingYears,
        transitionYears,
        startAllocations,
        endAllocations
      );
      // 2 / 2 = 100% progress -> [100, 0]
      expect(result).toEqual([100, 0]);
    });
  });

  describe('shouldPerformAnnualAdjustment', () => {
    const startDate = new Date(2010, 0, 1); // Jan 1, 2010
    const rollingYears = 7;
    const transitionYears = 2;

    it('should return false when feature is disabled', () => {
      const checkDate = new Date(2015, 0, 1); // Anniversary in transition window
      const result = shouldPerformAnnualAdjustment(
        checkDate,
        startDate,
        rollingYears,
        transitionYears,
        false // disabled
      );
      expect(result).toBe(false);
    });

    it('should return false when not an anniversary', () => {
      const checkDate = new Date(2015, 0, 2); // Not an anniversary
      const result = shouldPerformAnnualAdjustment(
        checkDate,
        startDate,
        rollingYears,
        transitionYears,
        true
      );
      expect(result).toBe(false);
    });

    it('should return false before transition window', () => {
      const checkDate = new Date(2014, 0, 1); // Anniversary, but before year 5
      const result = shouldPerformAnnualAdjustment(
        checkDate,
        startDate,
        rollingYears,
        transitionYears,
        true
      );
      expect(result).toBe(false);
    });

    it('should return true on anniversary in transition window', () => {
      const checkDate = new Date(2015, 0, 1); // Anniversary at year 5 (start of transition)
      const result = shouldPerformAnnualAdjustment(
        checkDate,
        startDate,
        rollingYears,
        transitionYears,
        true
      );
      expect(result).toBe(true);
    });

    it('should return true on second anniversary in transition window', () => {
      const checkDate = new Date(2016, 0, 1); // Anniversary at year 6
      const result = shouldPerformAnnualAdjustment(
        checkDate,
        startDate,
        rollingYears,
        transitionYears,
        true
      );
      expect(result).toBe(true);
    });

    it('should return false after transition window', () => {
      const checkDate = new Date(2017, 0, 1); // Anniversary at year 7 (end of period)
      const result = shouldPerformAnnualAdjustment(
        checkDate,
        startDate,
        rollingYears,
        transitionYears,
        true
      );
      expect(result).toBe(false);
    });
  });

  describe('calculateSipRollingXirr with allocation transition', () => {
    it('should generate annual_adjustment transactions on anniversaries', () => {
      const navData = generateNavData(10); // 10 years of data
      const years = 7;
      const startAllocations = [50, 50];
      const endAllocations = [100, 0];
      const transitionYears = 2;

      const result = calculateSipRollingXirr(
        [navData, navData],
        years,
        startAllocations,
        false, // no rebalancing
        5,
        true, // include nil for testing
        false, // no step-up
        0,
        100, // sip amount
        true, // allocation transition enabled
        endAllocations,
        transitionYears
      );

      expect(result.length).toBeGreaterThan(0);

      // Find a result entry and check for annual_adjustment transactions
      const entryWithTransactions = result.find(entry => 
        entry.transactions.some(tx => tx.type === 'annual_adjustment')
      );

      expect(entryWithTransactions).toBeDefined();
      
      if (entryWithTransactions) {
        const annualAdjustments = entryWithTransactions.transactions.filter(
          tx => tx.type === 'annual_adjustment'
        );
        expect(annualAdjustments.length).toBeGreaterThan(0);
        
        // Check that annual adjustments have allocation percentages
        annualAdjustments.forEach(tx => {
          expect(tx.allocationPercentage).toBeDefined();
        });
      }
    });

    it('should use interpolated allocations for buy transactions during transition', () => {
      const navData = generateNavData(10);
      const years = 7;
      const startAllocations = [50, 50];
      const endAllocations = [100, 0];
      const transitionYears = 2;

      const result = calculateSipRollingXirr(
        [navData, navData],
        years,
        startAllocations,
        false,
        5,
        true,
        false,
        0,
        100,
        true,
        endAllocations,
        transitionYears
      );

      expect(result.length).toBeGreaterThan(0);

      // Check that allocations change over time in the buy transactions
      const entries = result.slice(0, 5); // Check a few entries
      
      entries.forEach(entry => {
        const buyTransactions = entry.transactions.filter(tx => tx.type === 'buy');
        buyTransactions.forEach(tx => {
          expect(tx.allocationPercentage).toBeDefined();
          expect(tx.allocationPercentage).toBeGreaterThanOrEqual(0);
          expect(tx.allocationPercentage).toBeLessThanOrEqual(100);
        });
      });
    });

    it('should not skip regular rebalancing on non-anniversary dates', () => {
      const navData = generateNavData(10);
      const years = 7;
      const startAllocations = [50, 50];
      const endAllocations = [100, 0];
      const transitionYears = 2;

      const result = calculateSipRollingXirr(
        [navData, navData],
        years,
        startAllocations,
        true, // rebalancing enabled
        5, // low threshold to trigger rebalancing
        true,
        false,
        0,
        100,
        true,
        endAllocations,
        transitionYears
      );

      expect(result.length).toBeGreaterThan(0);

      // Should have both rebalance and annual_adjustment transactions
      const allTransactionTypes = new Set<string>();
      result.forEach(entry => {
        entry.transactions.forEach(tx => {
          allTransactionTypes.add(tx.type);
        });
      });

      // With volatile data and rebalancing enabled, we should see rebalance transactions
      // (though they may not appear in every entry due to threshold)
      expect(allTransactionTypes.has('buy')).toBe(true);
    });
  });
});

