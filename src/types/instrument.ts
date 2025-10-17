export type InstrumentType = 'mutual_fund' | 'index_fund' | 'yahoo_finance' | 'fixed_return';

export interface BaseInstrument {
  id: string | number;
  name: string;
  type: InstrumentType;
}

export interface MutualFund extends BaseInstrument {
  type: 'mutual_fund';
  id: number;
  schemeCode: number;
  schemeName: string;
}

export interface IndexFund extends BaseInstrument {
  type: 'index_fund';
  id: string;
  indexName: string;
  displayName: string;
}

export interface YahooFinanceInstrument extends BaseInstrument {
  type: 'yahoo_finance';
  id: string;
  symbol: string;
  displayName: string;
}

export interface FixedReturnInstrument extends BaseInstrument {
  type: 'fixed_return';
  id: string;
  annualReturnPercentage: number;
  displayName: string;
}

export type Instrument = MutualFund | IndexFund | YahooFinanceInstrument | FixedReturnInstrument;

export interface InstrumentNavData {
  date: Date;
  nav: number;
}