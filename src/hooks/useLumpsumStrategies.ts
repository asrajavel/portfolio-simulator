import React from 'react';
import { getQueryParams } from '../utils/browser/queryParams';
import { setLumpsumQueryParams } from '../utils/browser/queryParams-lumpsum';
import { getDefaultAllocations } from '../utils/data/getDefaultAllocations';
import { LumpsumStrategy } from '../types/lumpsumStrategy';
import { Instrument } from '../types/instrument';
import { ALLOCATION_TOTAL } from '../constants';

export function useLumpsumStrategies(DEFAULT_SCHEME_CODE: number, lumpsumAmountState: [number, (v: number) => void], isActive: boolean = true) {
  // Initialize strategies and years from query params
  const initialParams = React.useMemo(() => getQueryParams(), []);
  const [lumpsumAmount, setLumpsumAmount] = lumpsumAmountState;
  
  // Set lumpsumAmount from query params on first load
  React.useEffect(() => {
    if (initialParams.lumpsumAmount && initialParams.lumpsumAmount !== lumpsumAmount) {
      setLumpsumAmount(initialParams.lumpsumAmount);
    }
  }, []); // Only run once on mount
  
  const [lumpsumStrategies, setLumpsumStrategies] = React.useState<LumpsumStrategy[]>(
    initialParams.lumpsumStrategies && initialParams.lumpsumStrategies.length > 0
      ? initialParams.lumpsumStrategies
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
            allocations: [ALLOCATION_TOTAL]
          },
          // Default Strategy 2: Mixed (70% scheme 122639, 30% scheme 120197)
          { 
            selectedInstruments: [
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

  // Handler to add a new strategy
  const handleAddStrategy = () => {
    setLumpsumStrategies(prev => [
      ...prev,
      { 
        selectedInstruments: [null], 
        allocations: [ALLOCATION_TOTAL]
      }
    ]);
  };

  // Handlers for fund controls per strategy
  const handleInstrumentSelect = (strategyIdx: number, idx: number, instrument: Instrument | null) => {
    setLumpsumStrategies(prev => prev.map((p, i) => {
      if (i !== strategyIdx) return p;
      
      const newInstruments = p.selectedInstruments.map((inst, j) => j === idx ? instrument : inst);

      return { 
        ...p, 
        selectedInstruments: newInstruments
      };
    }));
  };
  
  const handleAddFund = (strategyIdx: number) => {
    setLumpsumStrategies(prev => prev.map((p, i) => {
      if (i !== strategyIdx) return p;
      const newInstruments = [...p.selectedInstruments, null];
      const n = newInstruments.length;
      const newAlloc = getDefaultAllocations(n);
      return { ...p, selectedInstruments: newInstruments, allocations: newAlloc };
    }));
  };
  
  const handleRemoveFund = (strategyIdx: number, idx: number) => {
    setLumpsumStrategies(prev => prev.map((p, i) => {
      if (i !== strategyIdx) return p;
      const newInstruments = p.selectedInstruments.filter((_, j) => j !== idx);
      const n = newInstruments.length;
      const newAlloc = n > 0 ? getDefaultAllocations(n) : [];
      return { ...p, selectedInstruments: newInstruments, allocations: newAlloc };
    }));
  };
  
  const handleAllocationChange = (strategyIdx: number, fundIdx: number, value: number) => {
    setLumpsumStrategies(prev => prev.map((p, i) => {
      if (i !== strategyIdx) return p;
      const newAlloc = p.allocations.map((a, j) => j === fundIdx ? value : a);
      return { ...p, allocations: newAlloc };
    }));
  };

  // Sync strategies, years, and lumpsumAmount to query params (only when tab is active)
  React.useEffect(() => {
    if (isActive) {
      setLumpsumQueryParams(lumpsumStrategies, years, lumpsumAmount);
    }
  }, [lumpsumStrategies, years, lumpsumAmount, isActive]);

  return {
    lumpsumStrategies,
    setLumpsumStrategies,
    years,
    setYears,
    handleAddStrategy,
    handleInstrumentSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
  };
}

