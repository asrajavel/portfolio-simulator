import React from 'react';
import { getQueryParams } from '../utils/browser/queryParams';
import { setLumpsumQueryParams } from '../utils/browser/queryParams-lumpsum';
import { getDefaultAllocations } from '../utils/data/getDefaultAllocations';
import { LumpsumPortfolio } from '../types/lumpsumPortfolio';
import { Asset } from '../types/asset';
import { ALLOCATION_TOTAL } from '../constants';

export function useLumpsumPortfolios(DEFAULT_SCHEME_CODE: number, lumpsumAmountState: [number, (v: number) => void], isActive: boolean = true) {
  // Initialize portfolios and years from query params
  const initialParams = React.useMemo(() => getQueryParams(), []);
  const [lumpsumAmount, setLumpsumAmount] = lumpsumAmountState;
  
  // Set lumpsumAmount from query params on first load
  React.useEffect(() => {
    if (initialParams.lumpsumAmount && initialParams.lumpsumAmount !== lumpsumAmount) {
      setLumpsumAmount(initialParams.lumpsumAmount);
    }
  }, []); // Only run once on mount
  
  const [lumpsumPortfolios, setLumpsumPortfolios] = React.useState<LumpsumPortfolio[]>(
    initialParams.lumpsumPortfolios && initialParams.lumpsumPortfolios.length > 0
      ? initialParams.lumpsumPortfolios
      : [
          // Default Portfolio 1: NIFTY 50 Index (100%)
          { 
            selectedAssets: [{
              type: 'index_fund',
              id: 'NIFTY 50',
              name: 'NIFTY 50',
              indexName: 'NIFTY 50',
              displayName: 'NIFTY 50'
            }], 
            allocations: [ALLOCATION_TOTAL]
          },
          // Default Portfolio 2: Mixed (70% scheme 122639, 30% scheme 120197)
          { 
            selectedAssets: [
              {
                type: 'mutual_fund',
                id: 122639,
                name: 'Scheme 122639',
                schemeCode: 122639,
                schemeName: 'Scheme 122639'
              },
              {
                type: 'mutual_fund',
                id: 120197,
                name: 'Scheme 120197',
                schemeCode: 120197,
                schemeName: 'Scheme 120197'
              }
            ], 
            allocations: [70, 30]
          }
        ]
  );
  const [years, setYears] = React.useState<number>(initialParams.years || 5);

  // Handler to add a new portfolio
  const handleAddPortfolio = () => {
    setLumpsumPortfolios(prev => [
      ...prev,
      { 
        selectedAssets: [null], 
        allocations: [ALLOCATION_TOTAL]
      }
    ]);
  };

  // Handlers for asset controls per portfolio
  const handleAssetSelect = (portfolioIdx: number, idx: number, asset: Asset | null) => {
    setLumpsumPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      
      const newAssets = p.selectedAssets.map((existing, j) => j === idx ? asset : existing);

      return { 
        ...p, 
        selectedAssets: newAssets
      };
    }));
  };
  
  const handleAddFund = (portfolioIdx: number) => {
    setLumpsumPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      const newAssets = [...p.selectedAssets, null];
      const n = newAssets.length;
      const newAlloc = getDefaultAllocations(n);
      return { ...p, selectedAssets: newAssets, allocations: newAlloc };
    }));
  };
  
  const handleRemoveFund = (portfolioIdx: number, idx: number) => {
    setLumpsumPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      const newAssets = p.selectedAssets.filter((_, j) => j !== idx);
      const n = newAssets.length;
      const newAlloc = n > 0 ? getDefaultAllocations(n) : [];
      return { ...p, selectedAssets: newAssets, allocations: newAlloc };
    }));
  };
  
  const handleAllocationChange = (portfolioIdx: number, fundIdx: number, value: number) => {
    setLumpsumPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      const newAlloc = p.allocations.map((a, j) => j === fundIdx ? value : a);
      return { ...p, allocations: newAlloc };
    }));
  };

  // Sync portfolios, years, and lumpsumAmount to query params (only when tab is active)
  React.useEffect(() => {
    if (isActive) {
      setLumpsumQueryParams(lumpsumPortfolios, years, lumpsumAmount);
    }
  }, [lumpsumPortfolios, years, lumpsumAmount, isActive]);

  return {
    lumpsumPortfolios,
    setLumpsumPortfolios,
    years,
    setYears,
    handleAddPortfolio,
    handleAssetSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
  };
}

