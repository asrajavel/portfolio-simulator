import {
  MutualFund, YahooFinanceAsset,
  FixedReturnAsset, GovSchemeAsset,
} from './asset';

export interface TransactionData {
  date: string; // YYYY-MM-DD
  amount: number;
}

interface BaseHolding {
  name: string;
  transactions: TransactionData[];
  locked?: boolean;
}

export type HoldingData =
  | (Pick<MutualFund, 'type' | 'schemeCode'> & BaseHolding)
  | (Pick<YahooFinanceAsset, 'type' | 'symbol'> & BaseHolding)
  | (Pick<FixedReturnAsset, 'type' | 'annualReturnPercentage'> & BaseHolding)
  | (Pick<GovSchemeAsset, 'type' | 'scheme'> & BaseHolding);

export interface GoalData {
  name: string;
  holdings: HoldingData[];
}

export interface DailyHoldingSnapshot {
  date: Date;
  nav: number;
  todayInv: number;
  cumInv: number;
  todayUnits: number;
  cumUnits: number;
  totalValue: number;
  xirr: number;
}

export interface DailyGoalSnapshot {
  date: Date;
  totalInv: number;
  totalValue: number;
  xirr: number;
  absReturn: number;
  holdingValues: Record<string, number>;
  holdingInvestments: Record<string, number>;
}

export interface HoldingSummary {
  name: string;
  investment: number;
  value: number;
  xirr: number;
  allocation: number;
  locked: boolean;
}

export interface GoalSummary {
  name: string;
  totalInvestment: number;
  totalValue: number;
  interest: number;
  xirr: number;
  dailyChange: number;
  lockedValue: number;
  holdings: HoldingSummary[];
}

export interface ComputedGoalData {
  summary: GoalSummary;
  dailySnapshots: DailyGoalSnapshot[];
  holdingTimeSeries: Record<string, DailyHoldingSnapshot[]>;
}

export interface TrackerData {
  goals: GoalData[];
}
