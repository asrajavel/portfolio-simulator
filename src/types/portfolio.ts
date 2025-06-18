import { Instrument } from './instrument';

export interface Portfolio {
  selectedInstruments: (Instrument | null)[];
  allocations: number[];
  rebalancingEnabled: boolean;
  rebalancingThreshold: number;
} 