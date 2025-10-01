import React from 'react';
import { getQueryParams, setQueryParams } from '../utils/browser/queryParams';
import { getDefaultAllocations } from '../utils/data/getDefaultAllocations';
import { Portfolio } from '../types/portfolio';
import { Instrument } from '../types/instrument';

const DEFAULT_REBALANCING_THRESHOLD = 5;

export function usePortfolios(DEFAULT_SCHEME_CODE: number) {
  // Initialize portfolios and years from query params
  const initialParams = React.useMemo(() => getQueryParams(), []);
  const [portfolios, setPortfolios] = React.useState<Portfolio[]>(
    initialParams.portfolios && initialParams.portfolios.length > 0
      ? initialParams.portfolios.map((p: any) => ({
          selectedInstruments: p.selectedInstruments || [null],
          allocations: p.allocations && p.allocations.length > 0 ? p.allocations : [100],
          rebalancingEnabled: typeof p.rebalancingEnabled === 'boolean' ? p.rebalancingEnabled : false,
          rebalancingThreshold: typeof p.rebalancingThreshold === 'number' ? p.rebalancingThreshold : DEFAULT_REBALANCING_THRESHOLD,
        }))
      : [
          // Default Portfolio 1: NIFTY 50 Index (100%)
          { 
            selectedInstruments: [{
              type: 'index_fund',
              id: 'NIFTY 50',
              name: 'NIFTY 50',
              indexName: 'NIFTY 50',
              displayName: 'NIFTY 50'
            }], 
            allocations: [100], 
            rebalancingEnabled: false, 
            rebalancingThreshold: DEFAULT_REBALANCING_THRESHOLD 
          },
          // Default Portfolio 2: Mixed (70% scheme 122639, 30% scheme 120197, rebalancing enabled)
          { 
            selectedInstruments: [
              {
                type: 'mutual_fund',
                id: 122639,
                name: 'Scheme 122639', // Will be updated by component
                schemeCode: 122639,
                schemeName: 'Scheme 122639'
              },
              {
                type: 'mutual_fund',
                id: 120197,
                name: 'Scheme 120197', // Will be updated by component
                schemeCode: 120197,
                schemeName: 'Scheme 120197'
              }
            ], 
            allocations: [70, 30], 
            rebalancingEnabled: true, 
            rebalancingThreshold: DEFAULT_REBALANCING_THRESHOLD 
          }
        ]
  );
  const [years, setYears] = React.useState<number>(initialParams.years || 5);

  // Handler to add a new portfolio
  const handleAddPortfolio = () => {
    setPortfolios(prev => [
      ...prev,
      { selectedInstruments: [null], allocations: [100], rebalancingEnabled: false, rebalancingThreshold: DEFAULT_REBALANCING_THRESHOLD }
    ]);
  };

  // Handlers for fund controls per portfolio
  const handleInstrumentSelect = (portfolioIdx: number, idx: number, instrument: Instrument | null) => {
    setPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      
      const newInstruments = p.selectedInstruments.map((inst, j) => j === idx ? instrument : inst);

      return { 
        ...p, 
        selectedInstruments: newInstruments
      };
    }));
  };
  const handleAddFund = (portfolioIdx: number) => {
    setPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      const newInstruments = [...p.selectedInstruments, null];
      // Default: split using getDefaultAllocations
      const n = newInstruments.length;
      const newAlloc = getDefaultAllocations(n);
      return { ...p, selectedInstruments: newInstruments, allocations: newAlloc };
    }));
  };
  const handleRemoveFund = (portfolioIdx: number, idx: number) => {
    setPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      const newInstruments = p.selectedInstruments.filter((_, j) => j !== idx);
      // Rebalance allocations for remaining funds
      const n = newInstruments.length;
      const newAlloc = n > 0 ? getDefaultAllocations(n) : [];
      return { ...p, selectedInstruments: newInstruments, allocations: newAlloc };
    }));
  };
  const handleAllocationChange = (portfolioIdx: number, fundIdx: number, value: number) => {
    setPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      const newAlloc = p.allocations.map((a, j) => j === fundIdx ? value : a);
      return { ...p, allocations: newAlloc };
    }));
  };

  const handleToggleRebalancing = (portfolioIdx: number) => {
    setPortfolios(prev => prev.map((p, i) =>
      i === portfolioIdx
        ? { ...p, rebalancingEnabled: !p.rebalancingEnabled }
        : p
    ));
  };

  const handleRebalancingThresholdChange = (portfolioIdx: number, value: number) => {
    setPortfolios(prev => prev.map((p, i) =>
      i === portfolioIdx
        ? { ...p, rebalancingThreshold: Math.max(0, value) } // Ensure threshold is not negative
        : p
    ));
  };

  // Sync portfolios and years to query params (schemes and allocations)
  React.useEffect(() => {
    setQueryParams(portfolios, years);
  }, [portfolios, years]);

  return {
    portfolios,
    setPortfolios,
    years,
    setYears,
    handleAddPortfolio,
    handleInstrumentSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
    handleToggleRebalancing,
    handleRebalancingThresholdChange,
  };
} 