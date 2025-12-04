import { Instrument } from './instrument';

export interface LumpsumStrategy {
  selectedInstruments: (Instrument | null)[];
  allocations: number[];
  // Note: No rebalancing support for now
  // Note: No step-up (not applicable for lumpsum)
}

