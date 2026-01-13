import { Asset } from './asset';

export interface SipPortfolio {
  selectedAssets: (Asset | null)[];
  allocations: number[];
  rebalancingEnabled: boolean;
  rebalancingThreshold: number;
  stepUpEnabled: boolean;
  stepUpPercentage: number;
}

