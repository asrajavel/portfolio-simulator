import { NavEntry } from '../../types/navData';

/**
 * Shared test data fixtures for SIP Rolling XIRR tests
 */

// Fast growing fund: +20% monthly
export const fastGrowingFund: NavEntry[] = [
  { date: new Date('2023-01-01'), nav: 100 },
  { date: new Date('2023-02-01'), nav: 120 },
  { date: new Date('2023-03-01'), nav: 144 },
  { date: new Date('2023-04-01'), nav: 172.8 },
  { date: new Date('2023-05-01'), nav: 207.36 },
  { date: new Date('2023-06-01'), nav: 248.83 },
  { date: new Date('2023-07-01'), nav: 298.60 },
  { date: new Date('2023-08-01'), nav: 358.32 },
  { date: new Date('2023-09-01'), nav: 429.98 },
  { date: new Date('2023-10-01'), nav: 515.98 },
  { date: new Date('2023-11-01'), nav: 619.18 },
  { date: new Date('2023-12-01'), nav: 743.01 },
  { date: new Date('2024-01-01'), nav: 891.61 },
];

// Slow growing fund: +2% monthly
export const slowGrowingFund: NavEntry[] = [
  { date: new Date('2023-01-01'), nav: 100 },
  { date: new Date('2023-02-01'), nav: 102 },
  { date: new Date('2023-03-01'), nav: 104.04 },
  { date: new Date('2023-04-01'), nav: 106.12 },
  { date: new Date('2023-05-01'), nav: 108.24 },
  { date: new Date('2023-06-01'), nav: 110.41 },
  { date: new Date('2023-07-01'), nav: 112.61 },
  { date: new Date('2023-08-01'), nav: 114.87 },
  { date: new Date('2023-09-01'), nav: 117.16 },
  { date: new Date('2023-10-01'), nav: 119.51 },
  { date: new Date('2023-11-01'), nav: 121.90 },
  { date: new Date('2023-12-01'), nav: 124.34 },
  { date: new Date('2024-01-01'), nav: 126.82 },
];

// Stable fund 1: +1% monthly
export const stableFund1: NavEntry[] = [
  { date: new Date('2023-01-01'), nav: 100 },
  { date: new Date('2023-02-01'), nav: 101 },
  { date: new Date('2023-03-01'), nav: 102 },
  { date: new Date('2023-04-01'), nav: 103 },
  { date: new Date('2023-05-01'), nav: 104 },
  { date: new Date('2023-06-01'), nav: 105 },
  { date: new Date('2023-07-01'), nav: 106 },
  { date: new Date('2023-08-01'), nav: 107 },
  { date: new Date('2023-09-01'), nav: 108 },
  { date: new Date('2023-10-01'), nav: 109 },
  { date: new Date('2023-11-01'), nav: 110 },
  { date: new Date('2023-12-01'), nav: 111 },
  { date: new Date('2024-01-01'), nav: 112 },
];

// Stable fund 2: +1.5% monthly
export const stableFund2: NavEntry[] = [
  { date: new Date('2023-01-01'), nav: 100 },
  { date: new Date('2023-02-01'), nav: 101.5 },
  { date: new Date('2023-03-01'), nav: 103 },
  { date: new Date('2023-04-01'), nav: 104.5 },
  { date: new Date('2023-05-01'), nav: 106 },
  { date: new Date('2023-06-01'), nav: 107.5 },
  { date: new Date('2023-07-01'), nav: 109 },
  { date: new Date('2023-08-01'), nav: 110.5 },
  { date: new Date('2023-09-01'), nav: 112 },
  { date: new Date('2023-10-01'), nav: 113.5 },
  { date: new Date('2023-11-01'), nav: 115 },
  { date: new Date('2023-12-01'), nav: 116.5 },
  { date: new Date('2024-01-01'), nav: 118 },
];

// Moderate growth fund: +5% monthly
export const moderateGrowthFund: NavEntry[] = [
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

// Declining fund: -5% monthly
export const decliningFund: NavEntry[] = [
  { date: new Date('2023-01-01'), nav: 100 },
  { date: new Date('2023-02-01'), nav: 95 },
  { date: new Date('2023-03-01'), nav: 90 },
  { date: new Date('2023-04-01'), nav: 85 },
  { date: new Date('2023-05-01'), nav: 80 },
  { date: new Date('2023-06-01'), nav: 75 },
  { date: new Date('2023-07-01'), nav: 70 },
  { date: new Date('2023-08-01'), nav: 65 },
  { date: new Date('2023-09-01'), nav: 60 },
  { date: new Date('2023-10-01'), nav: 55 },
  { date: new Date('2023-11-01'), nav: 50 },
  { date: new Date('2023-12-01'), nav: 45 },
  { date: new Date('2024-01-01'), nav: 40 },
];
