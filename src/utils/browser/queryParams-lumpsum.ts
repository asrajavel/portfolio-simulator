import { LumpsumStrategy } from '../../types/lumpsumStrategy';

// Simple version for lumpsum (no rebalancing, no step-up)
export function setLumpsumQueryParams(lumpsumStrategies: LumpsumStrategy[], years: number, lumpsumAmount: number = 100000) {
  // For now, use same format as SIP but without rebalancing/stepup params
  const strategiesStr = lumpsumStrategies
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
      
      return instrumentsStr;
    })
    .join(';');
  
  const urlParams = `lumpsumStrategies=${strategiesStr}&years=${years}&lumpsumAmount=${lumpsumAmount}`;
  window.history.replaceState({}, '', `?${urlParams}`);
}

