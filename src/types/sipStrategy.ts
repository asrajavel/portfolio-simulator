import { Instrument } from './instrument';

export interface SipStrategy {
  selectedInstruments: (Instrument | null)[];
  allocations: number[];
  rebalancingEnabled: boolean;
  rebalancingThreshold: number;
  stepUpEnabled: boolean;
  stepUpPercentage: number;
}

