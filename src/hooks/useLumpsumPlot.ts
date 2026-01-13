import { useCallback } from 'react';
import { fillMissingNavDates } from '../utils/data/fillMissingNavDates';
import { indexService } from '../services/indexService';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { fixedReturnService } from '../services/fixedReturnService';
import { inflationService } from '../services/inflationService';
import { trackSimulation } from '../utils/analytics';

export function useLumpsumPlot({
  lumpsumPortfolios,
  years,
  loadNavData,
  plotState,
  lumpsumAmount,
  chartView,
}) {
  // Handler for plotting all portfolios
  const handlePlotAllPortfolios = useCallback(async () => {
    trackSimulation('Lumpsum', 'Plot');
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
      
      for (let pIdx = 0; pIdx < lumpsumPortfolios.length; ++pIdx) {
        const navs: any[][] = [];
        
        // Process assets
        if (lumpsumPortfolios[pIdx].selectedAssets && lumpsumPortfolios[pIdx].selectedAssets.length > 0) {
          for (const asset of lumpsumPortfolios[pIdx].selectedAssets.filter(Boolean)) {
            try {
              let nav: any[] = [];
              let identifier: string = '';
              
              if (asset.type === 'mutual_fund') {
                nav = await loadNavData(asset.schemeCode);
                identifier = `${pIdx}_${asset.schemeCode}`;
              } else if (asset.type === 'index_fund') {
                try {
                  const indexData = await indexService.fetchIndexData(asset.indexName);
                  
                  if (!indexData || indexData.length === 0) {
                    continue;
                  }
                  
                  nav = indexData.map(item => ({
                    date: item.date,
                    nav: item.nav
                  }));
                  identifier = `${pIdx}_${asset.indexName}`;
                } catch (indexError) {
                  console.error(`Failed to fetch index data for ${asset.indexName}:`, indexError);
                  continue;
                }
              } else if (asset.type === 'yahoo_finance') {
                const stockData = await yahooFinanceService.fetchStockData(asset.symbol);
                
                if (!stockData || stockData.length === 0) {
                  continue;
                }
                
                nav = stockData.map(item => ({
                  date: item.date,
                  nav: item.nav
                }));
                identifier = `${pIdx}_${asset.symbol}`;
              } else if (asset.type === 'fixed_return') {
                try {
                  const fixedReturnData = fixedReturnService.generateFixedReturnData(
                    asset.annualReturnPercentage,
                    1990
                  );
                  
                  if (!fixedReturnData || fixedReturnData.length === 0) {
                    continue;
                  }
                  
                  nav = fixedReturnData;
                  identifier = `${pIdx}_fixed_${asset.annualReturnPercentage}`;
                } catch (fixedReturnError) {
                  console.error(`Failed to generate fixed return data for ${asset.annualReturnPercentage}%:`, fixedReturnError);
                  continue;
                }
              } else if (asset.type === 'inflation') {
                try {
                  const inflationData = await inflationService.generateInflationNavData(
                    asset.countryCode,
                    1960
                  );
                  
                  if (!inflationData || inflationData.length === 0) {
                    continue;
                  }
                  
                  nav = inflationData;
                  identifier = `${pIdx}_inflation_${asset.countryCode}`;
                } catch (inflationError) {
                  console.error(`Failed to generate inflation data for ${asset.countryCode}:`, inflationError);
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
              console.error(`Error fetching data for asset ${asset.name}:`, error);
              throw error;
            }
          }
        }
        allNavDatas[pIdx] = navs;
      }
      
      plotState.setNavDatas(allNavsFlat);
      
      // Now calculate XIRR for each portfolio using Web Worker (prevents UI freezing)
      plotState.setLoadingXirr(true);
      const allLumpsumXirrDatas: Record<string, any[]> = {};
      
      for (let pIdx = 0; pIdx < lumpsumPortfolios.length; ++pIdx) {
        const navDataList = allNavDatas[pIdx];
        const allocations = lumpsumPortfolios[pIdx].allocations;
        
        if (!navDataList || navDataList.length === 0) {
          allLumpsumXirrDatas[`Portfolio ${pIdx + 1}`] = [];
          continue;
        }
        
        // Check if this portfolio contains inflation asset
        const hasInflation = lumpsumPortfolios[pIdx].selectedAssets.some(
          inst => inst?.type === 'inflation'
        );
        
        const portfolioStartTime = performance.now();
        
        await new Promise<void>((resolve) => {
          const worker = new Worker(new URL('../utils/calculations/lumpSumRollingXirr/worker.ts', import.meta.url));
          // Use actual lumpsumAmount for corpus view, 100 for XIRR view
          const baseAmount = chartView === 'corpus' ? lumpsumAmount : 100;
          worker.postMessage({ navDataList, years, allocations, investmentAmount: baseAmount });
          
          worker.onmessage = (event: MessageEvent) => {
            const portfolioEndTime = performance.now();
            let resultData = event.data;
            
            // Strip volatility for inflation assets (not meaningful for smooth daily compounding)
            if (hasInflation && Array.isArray(resultData)) {
              resultData = resultData.map((entry: any) => {
                const { volatility, ...rest } = entry;
                return rest;
              });
            }
            
            console.log(`[Lumpsum] Portfolio ${pIdx + 1} total: ${((portfolioEndTime - portfolioStartTime) / 1000).toFixed(2)}s (${resultData.length} data points)`);
            
            allLumpsumXirrDatas[`Portfolio ${pIdx + 1}`] = resultData;
            worker.terminate();
            resolve();
          };
          
          worker.onerror = (err: ErrorEvent) => {
            console.error(`Error calculating lumpsum XIRR for portfolio ${pIdx + 1}:`, err);
            allLumpsumXirrDatas[`Portfolio ${pIdx + 1}`] = [];
            worker.terminate();
            resolve();
          };
        });
      }
      
      plotState.setLumpSumXirrDatas(allLumpsumXirrDatas);
      plotState.setHasPlotted(true);
      plotState.setLoadingNav(false);
      plotState.setLoadingXirr(false);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      if (!(e instanceof Error && errorMsg.includes('Yahoo Finance ticker'))) {
        plotState.setXirrError('Error loading or calculating data: ' + errorMsg);
      }
      console.error('Error loading or calculating data:', e);
      plotState.setLoadingNav(false);
      plotState.setLoadingXirr(false);
    }
  }, [lumpsumPortfolios, years, loadNavData, plotState, lumpsumAmount, chartView]);

  return { handlePlotAllPortfolios };
}

