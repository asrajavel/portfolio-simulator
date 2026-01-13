import { Asset } from './asset';

export interface LumpsumPortfolio {
  selectedAssets: (Asset | null)[];
  allocations: number[];
  // Note: No rebalancing support for now
  // Note: No step-up (not applicable for lumpsum)
}

