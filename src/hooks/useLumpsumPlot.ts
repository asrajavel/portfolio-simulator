import { useCallback } from 'react';
import { fillMissingNavDates } from '../utils/data/fillMissingNavDates';
import { indexService } from '../services/indexService';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { fixedReturnService } from '../services/fixedReturnService';
import { calculateLumpSumRollingXirr } from '../utils/calculations/lumpSumRollingXirr';

export function useLumpsumPlot({
  lumpsumStrategies,
  years,
  loadNavData,
  plotState,
  lumpsumAmount,
  chartView,
}) {
  // Handler for plotting all strategies
  const handlePlotAllStrategies = useCallback(async () => {
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
      
      for (let pIdx = 0; pIdx < lumpsumStrategies.length; ++pIdx) {
        const navs: any[][] = [];
        
        // Process instruments
        if (lumpsumStrategies[pIdx].selectedInstruments && lumpsumStrategies[pIdx].selectedInstruments.length > 0) {
          for (const instrument of lumpsumStrategies[pIdx].selectedInstruments.filter(Boolean)) {
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
                  
                  nav = indexData.map(item => ({
                    date: item.date,
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
                  
                  nav = stockData.map(item => ({
                    date: item.date,
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
      
      // Now calculate XIRR for each strategy (lumpsum calculation is synchronous, no worker needed)
      plotState.setLoadingXirr(true);
      const allLumpsumXirrDatas: Record<string, any[]> = {};
      
      for (let pIdx = 0; pIdx < lumpsumStrategies.length; ++pIdx) {
        const navDataList = allNavDatas[pIdx];
        
        if (!navDataList || navDataList.length === 0) {
          allLumpsumXirrDatas[`Strategy ${pIdx + 1}`] = [];
          continue;
        }
        
        try {
          // Use actual lumpsumAmount for corpus view, 100 for XIRR view
          const baseAmount = chartView === 'corpus' ? lumpsumAmount : 100;
          const xirrData = calculateLumpSumRollingXirr(navDataList, years, baseAmount);
          allLumpsumXirrDatas[`Strategy ${pIdx + 1}`] = xirrData;
        } catch (error) {
          console.error(`Error calculating lumpsum XIRR for strategy ${pIdx + 1}:`, error);
          allLumpsumXirrDatas[`Strategy ${pIdx + 1}`] = [];
        }
      }
      
      plotState.setLumpSumXirrDatas(allLumpsumXirrDatas);
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
  }, [lumpsumStrategies, years, loadNavData, plotState, lumpsumAmount, chartView]);

  return { handlePlotAllStrategies };
}

