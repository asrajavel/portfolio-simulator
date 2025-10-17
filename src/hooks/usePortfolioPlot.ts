import { useCallback } from 'react';
import { fillMissingNavDates } from '../utils/data/fillMissingNavDates';
import { indexService } from '../services/indexService';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { fixedReturnService } from '../services/fixedReturnService';

export function usePortfolioPlot({
  portfolios,
  years,
  loadNavData,
  plotState,
}) {
  // Handler for plotting all portfolios
  const handlePlotAllPortfolios = useCallback(async () => {
    plotState.setLoadingNav(true);
    plotState.setLoadingXirr(false);
    plotState.setHasPlotted(false);
    plotState.setNavDatas({});
    plotState.setLumpSumXirrDatas({});
    plotState.setSipXirrDatas({});
    plotState.setXirrError(null);
    try {
      const allNavDatas: Record<string, any[][]> = {}; // key: portfolio index, value: array of nav arrays
      const allNavsFlat: Record<string, any[]> = {}; // for navDatas prop
      for (let pIdx = 0; pIdx < portfolios.length; ++pIdx) {
        const navs: any[][] = [];
        
        // Process instruments
        if (portfolios[pIdx].selectedInstruments && portfolios[pIdx].selectedInstruments.length > 0) {
          for (const instrument of portfolios[pIdx].selectedInstruments.filter(Boolean)) {
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
      // Now calculate XIRR for each portfolio using the worker
      plotState.setLoadingXirr(true);
      const allSipXirrDatas: Record<string, any[]> = {};
      let completed = 0;
      for (let pIdx = 0; pIdx < portfolios.length; ++pIdx) {
        const navDataList = allNavDatas[pIdx];
        const allocations = portfolios[pIdx].allocations;
        const rebalancingEnabled = portfolios[pIdx].rebalancingEnabled;
        const rebalancingThreshold = portfolios[pIdx].rebalancingThreshold;
        if (!navDataList || navDataList.length === 0) {
          allSipXirrDatas[`Portfolio ${pIdx + 1}`] = [];
          completed++;
          continue;
        }
        await new Promise<void>((resolve) => {
          const worker = new Worker(new URL('../utils/calculations/sipRollingXirr/worker.ts', import.meta.url));
          worker.postMessage({ navDataList, years, allocations, rebalancingEnabled, rebalancingThreshold, includeNilTransactions: false });
          worker.onmessage = (event: MessageEvent) => {
            allSipXirrDatas[`Portfolio ${pIdx + 1}`] = event.data;
            worker.terminate();
            completed++;
            resolve();
          };
          worker.onerror = (err: ErrorEvent) => {
            allSipXirrDatas[`Portfolio ${pIdx + 1}`] = [];
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
  }, [portfolios, years, loadNavData, plotState]);

  return { handlePlotAllPortfolios };
} 