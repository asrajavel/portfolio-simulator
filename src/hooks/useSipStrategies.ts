import React from 'react';
import { getQueryParams, setQueryParams } from '../utils/browser/queryParams';
import { getDefaultAllocations } from '../utils/data/getDefaultAllocations';
import { SipStrategy } from '../types/sipStrategy';
import { Instrument } from '../types/instrument';
import { DEFAULT_REBALANCING_THRESHOLD, ALLOCATION_TOTAL } from '../constants';

export function useSipStrategies(DEFAULT_SCHEME_CODE: number, sipAmountState: [number, (v: number) => void], isActive: boolean = true) {
  // Initialize strategies and years from query params
  const initialParams = React.useMemo(() => getQueryParams(), []);
  const [sipAmount, setSipAmount] = sipAmountState;
  
  // Set sipAmount from query params on first load
  React.useEffect(() => {
    if (initialParams.sipAmount && initialParams.sipAmount !== sipAmount) {
      setSipAmount(initialParams.sipAmount);
    }
  }, []); // Only run once on mount
  
  const [sipStrategies, setSipStrategies] = React.useState<SipStrategy[]>(
    initialParams.portfolios && initialParams.portfolios.length > 0
      ? initialParams.portfolios.map((p: any) => ({
          selectedInstruments: p.selectedInstruments || [null],
          allocations: p.allocations && p.allocations.length > 0 ? p.allocations : [ALLOCATION_TOTAL],
          rebalancingEnabled: typeof p.rebalancingEnabled === 'boolean' ? p.rebalancingEnabled : false,
          rebalancingThreshold: typeof p.rebalancingThreshold === 'number' ? p.rebalancingThreshold : DEFAULT_REBALANCING_THRESHOLD,
          stepUpEnabled: typeof p.stepUpEnabled === 'boolean' ? p.stepUpEnabled : false,
          stepUpPercentage: typeof p.stepUpPercentage === 'number' ? p.stepUpPercentage : 5,
        }))
      : [
          // Default Strategy 1: NIFTY 50 Index (100%)
          { 
            selectedInstruments: [{
              type: 'index_fund',
              id: 'NIFTY 50',
              name: 'NIFTY 50',
              indexName: 'NIFTY 50',
              displayName: 'NIFTY 50'
            }], 
            allocations: [ALLOCATION_TOTAL], 
            rebalancingEnabled: false, 
            rebalancingThreshold: DEFAULT_REBALANCING_THRESHOLD,
            stepUpEnabled: false,
            stepUpPercentage: 5
          },
          // Default Strategy 2: Mixed (70% scheme 122639, 30% scheme 120197, rebalancing enabled)
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
            rebalancingThreshold: DEFAULT_REBALANCING_THRESHOLD,
            stepUpEnabled: false,
            stepUpPercentage: 5
          }
        ]
  );
  const [years, setYears] = React.useState<number>(initialParams.years || 5);

  // Handler to add a new strategy
  const handleAddStrategy = () => {
    setSipStrategies(prev => [
      ...prev,
      { 
        selectedInstruments: [null], 
        allocations: [ALLOCATION_TOTAL], 
        rebalancingEnabled: false, 
        rebalancingThreshold: DEFAULT_REBALANCING_THRESHOLD,
        stepUpEnabled: false,
        stepUpPercentage: 5
      }
    ]);
  };

  // Handlers for fund controls per strategy
  const handleInstrumentSelect = (strategyIdx: number, idx: number, instrument: Instrument | null) => {
    setSipStrategies(prev => prev.map((p, i) => {
      if (i !== strategyIdx) return p;
      
      const newInstruments = p.selectedInstruments.map((inst, j) => j === idx ? instrument : inst);

      return { 
        ...p, 
        selectedInstruments: newInstruments
      };
    }));
  };
  const handleAddFund = (strategyIdx: number) => {
    setSipStrategies(prev => prev.map((p, i) => {
      if (i !== strategyIdx) return p;
      const newInstruments = [...p.selectedInstruments, null];
      // Default: split using getDefaultAllocations
      const n = newInstruments.length;
      const newAlloc = getDefaultAllocations(n);
      return { ...p, selectedInstruments: newInstruments, allocations: newAlloc };
    }));
  };
  const handleRemoveFund = (strategyIdx: number, idx: number) => {
    setSipStrategies(prev => prev.map((p, i) => {
      if (i !== strategyIdx) return p;
      const newInstruments = p.selectedInstruments.filter((_, j) => j !== idx);
      // Rebalance allocations for remaining funds
      const n = newInstruments.length;
      const newAlloc = n > 0 ? getDefaultAllocations(n) : [];
      return { ...p, selectedInstruments: newInstruments, allocations: newAlloc };
    }));
  };
  const handleAllocationChange = (strategyIdx: number, fundIdx: number, value: number) => {
    setSipStrategies(prev => prev.map((p, i) => {
      if (i !== strategyIdx) return p;
      const newAlloc = p.allocations.map((a, j) => j === fundIdx ? value : a);
      return { ...p, allocations: newAlloc };
    }));
  };

  const handleToggleRebalancing = (strategyIdx: number) => {
    setSipStrategies(prev => prev.map((p, i) =>
      i === strategyIdx
        ? { ...p, rebalancingEnabled: !p.rebalancingEnabled }
        : p
    ));
  };

  const handleRebalancingThresholdChange = (strategyIdx: number, value: number) => {
    setSipStrategies(prev => prev.map((p, i) =>
      i === strategyIdx
        ? { ...p, rebalancingThreshold: Math.max(0, value) } // Ensure threshold is not negative
        : p
    ));
  };

  const handleToggleStepUp = (strategyIdx: number) => {
    setSipStrategies(prev => prev.map((p, i) =>
      i === strategyIdx
        ? { ...p, stepUpEnabled: !p.stepUpEnabled }
        : p
    ));
  };

  const handleStepUpPercentageChange = (strategyIdx: number, value: number) => {
    setSipStrategies(prev => prev.map((p, i) =>
      i === strategyIdx
        ? { ...p, stepUpPercentage: Math.max(0, value) } // Ensure percentage is not negative
        : p
    ));
  };

  // Sync strategies, years, and sipAmount to query params (only when tab is active)
  React.useEffect(() => {
    if (isActive) {
      setQueryParams(sipStrategies, years, sipAmount);
    }
  }, [sipStrategies, years, sipAmount, isActive]);

  return {
    sipStrategies,
    setSipStrategies,
    years,
    setYears,
    handleAddStrategy,
    handleInstrumentSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
    handleToggleRebalancing,
    handleRebalancingThresholdChange,
    handleToggleStepUp,
    handleStepUpPercentageChange,
  };
}

