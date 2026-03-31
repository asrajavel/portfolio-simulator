import {
  MutualFund, IndexFund, YahooFinanceAsset,
  FixedReturnAsset, InflationAsset, GovSchemeAsset,
} from './asset';

export interface TransactionData {
  date: string; // YYYY-MM-DD
  amount: number;
}

interface BaseHolding {
  name: string;
  transactions: TransactionData[];
}

export type HoldingData =
  | (Pick<MutualFund, 'type' | 'schemeCode'> & BaseHolding)
  | (Pick<IndexFund, 'type' | 'indexName'> & BaseHolding)
  | (Pick<YahooFinanceAsset, 'type' | 'symbol'> & BaseHolding)
  | (Pick<FixedReturnAsset, 'type' | 'annualReturnPercentage'> & BaseHolding)
  | (Pick<InflationAsset, 'type' | 'countryCode'> & BaseHolding)
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
  allocation: number;
}

export interface GoalSummary {
  name: string;
  totalInvestment: number;
  totalValue: number;
  interest: number;
  xirr: number;
  dailyChange: number;
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
