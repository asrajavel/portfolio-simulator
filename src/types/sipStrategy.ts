import { Instrument } from './instrument';

export interface SipStrategy {
  selectedInstruments: (Instrument | null)[];
  allocations: number[]; // Starting allocations
  rebalancingEnabled: boolean;
  rebalancingThreshold: number;
  stepUpEnabled: boolean;
  stepUpPercentage: number;
  
  // Allocation Transition (Glide Path) - NEW
  allocationTransitionEnabled: boolean;
  endAllocations: number[]; // Target allocations to reach over time
  transitionYears: number; // Number of years to complete the transition
}

