import { FixedReturnService } from './fixedReturnService';

describe('FixedReturnService', () => {
  describe('generateFixedReturnData', () => {
    it('should generate all days including weekends', () => {
      const data = FixedReturnService.generateFixedReturnData(8, 2023);
      
      expect(data[0].date.getUTCFullYear()).toBe(2023);
      expect(data[0].date.getUTCMonth()).toBe(0);
      expect(data[0].date.getUTCDate()).toBe(1);
      
      expect(data[1].date.getUTCDate()).toBe(2);
      expect(data[2].date.getUTCDate()).toBe(3);
    });

    it('should calculate NAV with daily compounding', () => {
      const data = FixedReturnService.generateFixedReturnData(8, 2023);
      
      expect(data[0].nav).toBe(100);
      expect(data[1].nav).toBe(100.02107300475107);
      expect(data[2].nav).toBe(100.04215045021742);
    });

    it('should use UTC dates at midnight', () => {
      const data = FixedReturnService.generateFixedReturnData(8, 2023);
      
      expect(data[0].date.getUTCHours()).toBe(0);
      expect(data[0].date.getUTCMinutes()).toBe(0);
      expect(data[0].date.getUTCSeconds()).toBe(0);
    });

    it('should generate 365 days for non-leap year', () => {
      const data = FixedReturnService.generateFixedReturnData(8, 2023);
      const entries2023 = data.filter(entry => entry.date.getUTCFullYear() === 2023);
      
      expect(entries2023.length).toBe(365);
    });

    it('should handle different return rates', () => {
      const data0 = FixedReturnService.generateFixedReturnData(0, 2023);
      expect(data0[0].nav).toBe(100);
      expect(data0[10].nav).toBe(100);
      
      const data12 = FixedReturnService.generateFixedReturnData(12, 2023);
      expect(data12[0].nav).toBe(100);
      expect(data12[1].nav).toBe(100.03103251711691);
    });

    it('should return exact 8% after one year', () => {
      const data = FixedReturnService.generateFixedReturnData(8, 2023);
      const jan1_2024 = data.find(entry => 
        entry.date.getUTCFullYear() === 2024 && 
        entry.date.getUTCMonth() === 0 && 
        entry.date.getUTCDate() === 1
      );
      
      expect(jan1_2024?.nav).toBe(107.9943110379698);
    });
  });
});
