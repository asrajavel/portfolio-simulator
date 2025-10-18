import { Portfolio } from '../../types/portfolio';

// Utility functions for reading and writing portfolios and years to the query string
export function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const portfoliosParam = params.get('portfolios');
  const years = params.get('years');
  const sipAmount = params.get('sipAmount');
  const defaultThreshold = 5; // Default threshold if not in query params

  return {
    portfolios: portfoliosParam
      ? portfoliosParam.split(';').map(p_str => {
          // Format: instrument1:alloc1,instrument2:alloc2,...|rebalFlag|rebalThreshold|stepUpFlag|stepUpPercentage
          // instrument format: type:id:allocation (e.g., mf:120716:50 or idx:NIFTY50:50 or fixed:8:50)
          const parts = p_str.split('|');
          const instrumentsStr = parts[0];
          const rebalFlagStr = parts[1]; 
          const rebalThresholdStr = parts[2];
          const stepUpFlagStr = parts[3];
          const stepUpPercentageStr = parts[4];

          const selectedInstruments: (any | null)[] = [];
          const allocations: number[] = [];

          if (instrumentsStr) {
            instrumentsStr.split(',').forEach(instrumentData => {
              const instrumentParts = instrumentData.split(':');
              
              if (instrumentParts.length >= 2) {
                const type = instrumentParts[0];
                const alloc = Number(instrumentParts[instrumentParts.length - 1]);
                allocations.push(isNaN(alloc) ? 0 : alloc);
                
                if (type === 'null') {
                  selectedInstruments.push(null);
                } else if (type === 'mf' && instrumentParts.length >= 3) {
                  const schemeCode = Number(instrumentParts[1]);
                  selectedInstruments.push({
                    type: 'mutual_fund',
                    id: schemeCode,
                    name: `Scheme ${schemeCode}`, // Will be updated by component
                    schemeCode: schemeCode,
                    schemeName: `Scheme ${schemeCode}` // Will be updated by component
                  });
                } else if (type === 'idx' && instrumentParts.length >= 3) {
                  // Convert underscores back to spaces
                  const indexName = instrumentParts[1].replace(/_/g, ' ');
                  selectedInstruments.push({
                    type: 'index_fund',
                    id: indexName,
                    name: indexName,
                    indexName: indexName,
                    displayName: indexName
                  });
                } else if (type === 'yahoo' && instrumentParts.length >= 3) {
                  const symbol = instrumentParts[1];
                  selectedInstruments.push({
                    type: 'yahoo_finance',
                    id: symbol,
                    name: symbol,
                    symbol: symbol,
                    displayName: symbol
                  });
                } else if (type === 'fixed' && instrumentParts.length >= 3) {
                  const returnPercentage = parseFloat(instrumentParts[1]);
                  selectedInstruments.push({
                    type: 'fixed_return',
                    id: `fixed_${returnPercentage}`,
                    name: `Fixed ${returnPercentage}% Return`,
                    annualReturnPercentage: returnPercentage,
                    displayName: `Fixed ${returnPercentage}% Return`
                  });
                } else {
                  selectedInstruments.push(null);
                }
              }
            });
          }
          
          // Default rebalancingEnabled to false if not present or not '1'
          const rebalancingEnabled = rebalFlagStr === '1';
          const rebalancingThreshold = rebalThresholdStr ? parseInt(rebalThresholdStr, 10) : defaultThreshold;
          
          // Default stepUpEnabled to false if not present or not '1'
          const stepUpEnabled = stepUpFlagStr === '1';
          const stepUpPercentage = stepUpPercentageStr ? parseInt(stepUpPercentageStr, 10) : 5;
          
          return {
            selectedInstruments,
            allocations,
            rebalancingEnabled,
            rebalancingThreshold: isNaN(rebalancingThreshold) ? defaultThreshold : rebalancingThreshold,
            stepUpEnabled,
            stepUpPercentage: isNaN(stepUpPercentage) ? 5 : stepUpPercentage
          };
        }).filter(p => p.allocations.length > 0) // Filter out empty portfolios
      : [],
    years: years ? Number(years) : null,
    sipAmount: sipAmount ? Number(sipAmount) : 10000,
  };
}

export function setQueryParams(portfolios: Portfolio[], years: number, sipAmount: number = 10000) {
  // Format: instrument1:alloc1,instrument2:alloc2,...|rebalFlag|rebalThreshold|stepUpFlag|stepUpPercentage
  // instrument format: type:id (e.g., mf:120716 or idx:NIFTY50 or fixed:8)
  const portfoliosStr = portfolios
    .map(p => {
      const instrumentsStr = p.selectedInstruments
        .map((inst: any, idx: number) => {
          const allocation = p.allocations[idx] || 0;
          if (!inst) {
            return `null:${allocation}`;
          }
          if (inst.type === 'mutual_fund') {
            return `mf:${inst.schemeCode}:${allocation}`;
          } else if (inst.type === 'index_fund') {
            // Replace spaces with underscores for cleaner URLs
            const cleanIndexName = inst.indexName.replace(/\s+/g, '_');
            return `idx:${cleanIndexName}:${allocation}`;
          } else if (inst.type === 'yahoo_finance') {
            return `yahoo:${inst.symbol}:${allocation}`;
          } else if (inst.type === 'fixed_return') {
            return `fixed:${inst.annualReturnPercentage}:${allocation}`;
          }
          return `null:${allocation}`;
        })
        .join(',');
      
      return `${instrumentsStr}|${p.rebalancingEnabled ? '1' : '0'}|${p.rebalancingThreshold}|${p.stepUpEnabled ? '1' : '0'}|${p.stepUpPercentage}`;
    })
    .join(';');
  
  // Construct URL manually since we're using safe characters now
  const urlParams = `portfolios=${portfoliosStr}&years=${years}&sipAmount=${sipAmount}`;
  window.history.replaceState({}, '', `?${urlParams}`);
}