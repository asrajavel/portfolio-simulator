import { useCallback } from 'react';
import { fillMissingNavDates } from '../utils/data/fillMissingNavDates';
import { indexService } from '../services/indexService';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { fixedReturnService } from '../services/fixedReturnService';
import { inflationService } from '../services/inflationService';
import { trackSimulation } from '../utils/analytics';

export function useSipPlot({
  sipStrategies,
  years,
  loadNavData,
  plotState,
  sipAmount,
  chartView,
}) {
  // Handler for plotting all strategies
  const handlePlotAllStrategies = useCallback(async () => {
    trackSimulation('SIP', 'Plot');
    plotState.setLoadingNav(true);
    plotState.setLoadingXirr(false);
    plotState.setHasPlotted(false);
    plotState.setNavDatas({});
    plotState.setLumpSumXirrDatas({});
    plotState.setSipXirrDatas({});
    plotState.setXirrError(null);
    try {
      const allNavDatas: Record<string, any[][]> = {}; // key: strategy index, value: array of nav arrays
      const allNavsFlat: Record<string, any[]> = {}; // for navDatas prop
      for (let pIdx = 0; pIdx < sipStrategies.length; ++pIdx) {
        const navs: any[][] = [];
        
        // Process instruments
        if (sipStrategies[pIdx].selectedInstruments && sipStrategies[pIdx].selectedInstruments.length > 0) {
          for (const instrument of sipStrategies[pIdx].selectedInstruments.filter(Boolean)) {
            try {
              let nav: any[] = [];
              let identifier: string = '';
              
              if (instrument.type === 'mutual_fund') {
                nav = await loadNavData(instrument.schemeCode);
                identifier = `${pIdx}_${instrument.schemeCode}`;
              } else if (instrument.type === 'index_fund') {
                try {
                  const indexData = await indexService.fetchIndexData(instrument.indexName);
                  
                  if (!indexData || indexData.length === 0) {
                    continue;
                  }
                  
                  // Convert index data to NAV format (keep Date objects for fillMissingNavDates)
                  nav = indexData.map(item => ({
                    date: item.date, // Keep as Date object
                    nav: item.nav
                  }));
                  identifier = `${pIdx}_${instrument.indexName}`;
                } catch (indexError) {
                  console.error(`Failed to fetch index data for ${instrument.indexName}:`, indexError);
                  continue;
                }
              } else if (instrument.type === 'yahoo_finance') {
                try {
                  const stockData = await yahooFinanceService.fetchStockData(instrument.symbol);
                  
                  if (!stockData || stockData.length === 0) {
                    continue;
                  }
                  
                  // Convert stock data to NAV format (keep Date objects for fillMissingNavDates)
                  nav = stockData.map(item => ({
                    date: item.date, // Keep as Date object
                    nav: item.nav
                  }));
                  identifier = `${pIdx}_${instrument.symbol}`;
                } catch (stockError) {
                  console.error(`Failed to fetch stock data for ${instrument.symbol}:`, stockError);
                  continue;
                }
              } else if (instrument.type === 'fixed_return') {
                try {
                  const fixedReturnData = fixedReturnService.generateFixedReturnData(
                    instrument.annualReturnPercentage,
                    1990
                  );
                  
                  if (!fixedReturnData || fixedReturnData.length === 0) {
                    continue;
                  }
                  
                  // Data is already in the correct format
                  nav = fixedReturnData;
                  identifier = `${pIdx}_fixed_${instrument.annualReturnPercentage}`;
                } catch (fixedReturnError) {
                  console.error(`Failed to generate fixed return data for ${instrument.annualReturnPercentage}%:`, fixedReturnError);
                  continue;
                }
              } else if (instrument.type === 'inflation') {
                try {
                  const inflationData = await inflationService.generateInflationNavData(
                    instrument.countryCode,
                    1960
                  );
                  
                  if (!inflationData || inflationData.length === 0) {
                    continue;
                  }
                  
                  // Data is already in the correct format
                  nav = inflationData;
                  identifier = `${pIdx}_inflation_${instrument.countryCode}`;
                } catch (inflationError) {
                  console.error(`Failed to generate inflation data for ${instrument.countryCode}:`, inflationError);
                  continue;
                }
              }
              
              if (!Array.isArray(nav) || nav.length === 0) {
                continue;
              }
              
              const filled = fillMissingNavDates(nav);
              navs.push(filled);
              allNavsFlat[identifier] = filled;
            } catch (error) {
              console.error(`Error fetching data for instrument ${instrument.name}:`, error);
            }
          }
        }
        allNavDatas[pIdx] = navs;
      }
      plotState.setNavDatas(allNavsFlat);
      // Now calculate XIRR for each strategy using the worker
      plotState.setLoadingXirr(true);
      const allSipXirrDatas: Record<string, any[]> = {};
      let completed = 0;
      
      for (let pIdx = 0; pIdx < sipStrategies.length; ++pIdx) {
        const navDataList = allNavDatas[pIdx];
        const allocations = sipStrategies[pIdx].allocations;
        const rebalancingEnabled = sipStrategies[pIdx].rebalancingEnabled;
        const rebalancingThreshold = sipStrategies[pIdx].rebalancingThreshold;
        const stepUpEnabled = sipStrategies[pIdx].stepUpEnabled;
        const stepUpPercentage = sipStrategies[pIdx].stepUpPercentage;
        
        if (!navDataList || navDataList.length === 0) {
          allSipXirrDatas[`Strategy ${pIdx + 1}`] = [];
          completed++;
          continue;
        }
        
        // Check if this strategy contains inflation instrument
        const hasInflation = sipStrategies[pIdx].selectedInstruments.some(
          inst => inst?.type === 'inflation'
        );
        
        const strategyStartTime = performance.now();
        
        await new Promise<void>((resolve) => {
          const worker = new Worker(new URL('../utils/calculations/sipRollingXirr/worker.ts', import.meta.url));
          // Use 100 as base for XIRR view, actual sipAmount for corpus view
          const baseSipAmount = chartView === 'corpus' ? sipAmount : 100;
          worker.postMessage({ navDataList, years, allocations, rebalancingEnabled, rebalancingThreshold, includeNilTransactions: false, stepUpEnabled, stepUpPercentage, sipAmount: baseSipAmount });
          worker.onmessage = (event: MessageEvent) => {
            const strategyEndTime = performance.now();
            let resultData = event.data;
            
            // Strip volatility for inflation instruments (not meaningful for smooth daily compounding)
            if (hasInflation && Array.isArray(resultData)) {
              resultData = resultData.map((entry: any) => {
                const { volatility, ...rest } = entry;
                return rest;
              });
            }
            
            console.log(`[SIP] Strategy ${pIdx + 1} total: ${((strategyEndTime - strategyStartTime) / 1000).toFixed(2)}s (${resultData.length} data points)`);
            
            allSipXirrDatas[`Strategy ${pIdx + 1}`] = resultData;
            worker.terminate();
            completed++;
            resolve();
          };
          worker.onerror = (err: ErrorEvent) => {
            allSipXirrDatas[`Strategy ${pIdx + 1}`] = [];
            worker.terminate();
            completed++;
            resolve();
          };
        });
      }
      plotState.setSipXirrDatas(allSipXirrDatas);
      plotState.setHasPlotted(true);
      plotState.setLoadingNav(false);
      plotState.setLoadingXirr(false);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      plotState.setXirrError('Error loading or calculating data: ' + errorMsg);
      console.error('Error loading or calculating data:', e);
      plotState.setLoadingNav(false);
      plotState.setLoadingXirr(false);
    }
  }, [sipStrategies, years, loadNavData, plotState, sipAmount, chartView]);

  return { handlePlotAllStrategies };
}

