export interface SipRollingXirrEntry {
  date: Date;
  xirr: number;
  transactions: Transaction[];
  volatility: number; // Annualized volatility percentage
}

export interface Transaction {
  fundIdx: number;
  when: Date;
  nav: number;
  units: number;
  amount: number;
  type: 'buy' | 'sell' | 'rebalance' | 'nil' | 'annual_adjustment';
  cumulativeUnits: number;
  currentValue: number;
  allocationPercentage?: number;
}

