import { calculateSipRollingXirr, Transaction } from './sipRollingXirr';
import { NavEntry } from '../../types/navData';

// Hardcoded NAV data for two funds, 13 months
const nav1: NavEntry[] = [
  { date: new Date('2023-01-01'), nav: 100 },
  { date: new Date('2023-02-01'), nav: 105 },
  { date: new Date('2023-03-01'), nav: 110 },
  { date: new Date('2023-04-01'), nav: 115 },
  { date: new Date('2023-05-01'), nav: 120 },
  { date: new Date('2023-06-01'), nav: 125 },
  { date: new Date('2023-07-01'), nav: 130 },
  { date: new Date('2023-08-01'), nav: 135 },
  { date: new Date('2023-09-01'), nav: 140 },
  { date: new Date('2023-10-01'), nav: 145 },
  { date: new Date('2023-11-01'), nav: 150 },
  { date: new Date('2023-12-01'), nav: 155 },
  { date: new Date('2024-01-01'), nav: 160 },
];
const nav2: NavEntry[] = [
  { date: new Date('2023-01-01'), nav: 200 },
  { date: new Date('2023-02-01'), nav: 205 },
  { date: new Date('2023-03-01'), nav: 210 },
  { date: new Date('2023-04-01'), nav: 215 },
  { date: new Date('2023-05-01'), nav: 220 },
  { date: new Date('2023-06-01'), nav: 225 },
  { date: new Date('2023-07-01'), nav: 230 },
  { date: new Date('2023-08-01'), nav: 235 },
  { date: new Date('2023-09-01'), nav: 240 },
  { date: new Date('2023-10-01'), nav: 245 },
  { date: new Date('2023-11-01'), nav: 250 },
  { date: new Date('2023-12-01'), nav: 255 },
  { date: new Date('2024-01-01'), nav: 260 },
];

describe('calculateSipRollingXirr', () => {
  describe('multi-fund scenarios', () => {
    it('uses custom fund allocations correctly and produces expected transactions', () => {
      const allocations = [70, 30];
      const result = calculateSipRollingXirr([nav1, nav2], 1, allocations);
      const last = result[result.length - 1];

      // Log all transactions for inspection
      // Debug: All transactions logged for test verification

      // Hardcoded expected transactions in the actual output order
      const expectedTransactions = [
        { fundIdx: 0, nav: 100, when: new Date('2023-01-01'), units: 0.700, amount: -70.000, type: 'buy', cumulativeUnits: 0.700, currentValue: 70.000 },
        { fundIdx: 1, nav: 200, when: new Date('2023-01-01'), units: 0.150, amount: -30.000, type: 'buy', cumulativeUnits: 0.150, currentValue: 30.000 },
        { fundIdx: 0, nav: 105, when: new Date('2023-02-01'), units: 0.667, amount: -70.000, type: 'buy', cumulativeUnits: 1.367, currentValue: 143.535 },
        { fundIdx: 1, nav: 205, when: new Date('2023-02-01'), units: 0.146, amount: -30.000, type: 'buy', cumulativeUnits: 0.296, currentValue: 60.747 },
        { fundIdx: 0, nav: 110, when: new Date('2023-03-01'), units: 0.636, amount: -70.000, type: 'buy', cumulativeUnits: 2.003, currentValue: 220.333 },
        { fundIdx: 1, nav: 210, when: new Date('2023-03-01'), units: 0.143, amount: -30.000, type: 'buy', cumulativeUnits: 0.439, currentValue: 92.232 },
        { fundIdx: 0, nav: 115, when: new Date('2023-04-01'), units: 0.609, amount: -70.000, type: 'buy', cumulativeUnits: 2.612, currentValue: 300.348 },
        { fundIdx: 1, nav: 215, when: new Date('2023-04-01'), units: 0.140, amount: -30.000, type: 'buy', cumulativeUnits: 0.579, currentValue: 124.428 },
        { fundIdx: 0, nav: 120, when: new Date('2023-05-01'), units: 0.583, amount: -70.000, type: 'buy', cumulativeUnits: 3.195, currentValue: 383.407 },
        { fundIdx: 1, nav: 220, when: new Date('2023-05-01'), units: 0.136, amount: -30.000, type: 'buy', cumulativeUnits: 0.715, currentValue: 157.321 },
        { fundIdx: 0, nav: 125, when: new Date('2023-06-01'), units: 0.560, amount: -70.000, type: 'buy', cumulativeUnits: 3.755, currentValue: 469.382 },
        { fundIdx: 1, nav: 225, when: new Date('2023-06-01'), units: 0.133, amount: -30.000, type: 'buy', cumulativeUnits: 0.848, currentValue: 190.897 },
        { fundIdx: 0, nav: 130, when: new Date('2023-07-01'), units: 0.538, amount: -70.000, type: 'buy', cumulativeUnits: 4.294, currentValue: 558.158 },
        { fundIdx: 1, nav: 230, when: new Date('2023-07-01'), units: 0.130, amount: -30.000, type: 'buy', cumulativeUnits: 0.979, currentValue: 225.139 },
        { fundIdx: 0, nav: 135, when: new Date('2023-08-01'), units: 0.519, amount: -70.000, type: 'buy', cumulativeUnits: 4.812, currentValue: 649.625 },
        { fundIdx: 1, nav: 235, when: new Date('2023-08-01'), units: 0.128, amount: -30.000, type: 'buy', cumulativeUnits: 1.107, currentValue: 260.033 },
        { fundIdx: 0, nav: 140, when: new Date('2023-09-01'), units: 0.500, amount: -70.000, type: 'buy', cumulativeUnits: 5.312, currentValue: 743.686 },
        { fundIdx: 1, nav: 240, when: new Date('2023-09-01'), units: 0.125, amount: -30.000, type: 'buy', cumulativeUnits: 1.232, currentValue: 295.566 },
        { fundIdx: 0, nav: 145, when: new Date('2023-10-01'), units: 0.483, amount: -70.000, type: 'buy', cumulativeUnits: 5.795, currentValue: 840.246 },
        { fundIdx: 1, nav: 245, when: new Date('2023-10-01'), units: 0.122, amount: -30.000, type: 'buy', cumulativeUnits: 1.354, currentValue: 331.724 },
        { fundIdx: 0, nav: 150, when: new Date('2023-11-01'), units: 0.467, amount: -70.000, type: 'buy', cumulativeUnits: 6.261, currentValue: 939.220 },
        { fundIdx: 1, nav: 250, when: new Date('2023-11-01'), units: 0.120, amount: -30.000, type: 'buy', cumulativeUnits: 1.474, currentValue: 368.493 },
        { fundIdx: 0, nav: 155, when: new Date('2023-12-01'), units: 0.452, amount: -70.000, type: 'buy', cumulativeUnits: 6.713, currentValue: 1040.527 },
        { fundIdx: 1, nav: 255, when: new Date('2023-12-01'), units: 0.118, amount: -30.000, type: 'buy', cumulativeUnits: 1.592, currentValue: 405.863 },
        { fundIdx: 0, nav: 160, when: new Date('2024-01-01'), units: 6.713, amount: 1074.092, type: 'sell', cumulativeUnits: 6.713, currentValue: 1074.092 },
        { fundIdx: 1, nav: 260, when: new Date('2024-01-01'), units: 1.592, amount: 413.821, type: 'sell', cumulativeUnits: 1.592, currentValue: 413.821 },
      ];

      expect(last.transactions.length).toBe(expectedTransactions.length);
      last.transactions.forEach((tx, i) => {
        expect(tx).toMatchObject({
          fundIdx: expectedTransactions[i].fundIdx,
          nav: expectedTransactions[i].nav,
          type: expectedTransactions[i].type,
        });
        expect(tx.units).toBeCloseTo(expectedTransactions[i].units, 3);
        expect(tx.amount).toBeCloseTo(expectedTransactions[i].amount, 3);
        expect(tx.when.getTime()).toBe(expectedTransactions[i].when.getTime());
        // New fields
        // Calculate expected cumulativeUnits and currentValue
        let expectedCumulativeUnits = 0;
        let expectedCurrentValue = 0;
        if (tx.type === 'buy') {
          // For buy, sum units for this fund up to and including this transaction
          expectedCumulativeUnits = last.transactions
            .slice(0, i + 1)
            .filter(t => t.fundIdx === tx.fundIdx && t.type === 'buy')
            .reduce((sum, t) => sum + t.units, 0);
          expectedCurrentValue = expectedCumulativeUnits * tx.nav;
        } else {
          // For sell, cumulativeUnits is all units bought for this fund
          expectedCumulativeUnits = last.transactions
            .filter(t => t.fundIdx === tx.fundIdx && t.type === 'buy')
            .reduce((sum, t) => sum + t.units, 0);
          expectedCurrentValue = expectedCumulativeUnits * tx.nav;
        }
        expect(tx.cumulativeUnits).toBeCloseTo(expectedCumulativeUnits, 3);
        expect(tx.currentValue).toBeCloseTo(expectedCurrentValue, 3);
      });

      // Log the XIRR value before asserting
      // Debug: XIRR result for test verification
      expect(last.xirr).toBeCloseTo(0.46847172, 8);
    });
  });
});
