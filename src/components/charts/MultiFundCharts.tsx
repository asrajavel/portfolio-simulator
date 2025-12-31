import React, { useState } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { SipStrategy } from '../../types/sipStrategy';
import { LumpsumStrategy } from '../../types/lumpsumStrategy';
import { Block } from 'baseui/block';
import { TransactionModal } from '../modals/TransactionModal';
import { CHART_STYLES } from '../../constants';
import { VolatilityChart } from './VolatilityChart';
import { ReturnDistributionChart } from './ReturnDistributionChart';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR, formatDate, getAllDates } from '../../utils/stockChartConfig';
import { recalculateTransactionsForDate } from '../../utils/calculations/sipRollingXirr';
import { recalculateLumpsumTransactionsForDate } from '../../utils/calculations/lumpSumRollingXirr';
import { HelpButton } from '../help';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MultiFundChartsProps {
  navDatas: Record<number, any[]>;
  lumpsumStrategyXirrData?: Record<string, any[]>;
  sipStrategyXirrData?: Record<string, any[]>;
  funds: mfapiMutualFund[];
  COLORS: string[];
  sipStrategies?: SipStrategy[];
  lumpsumStrategies?: LumpsumStrategy[];
  years: number;
  amount: number; // Can be sipAmount or lumpsumAmount
  chartView: 'xirr' | 'corpus';
  isLumpsum?: boolean;
}

interface ModalState {
  visible: boolean;
  transactions: { fundIdx: number; nav: number; when: Date; units: number; amount: number; type: 'buy' | 'sell' | 'rebalance' | 'nil'; cumulativeUnits: number; currentValue: number; allocationPercentage?: number }[];
  date: string;
  xirr: number;
  strategyName: string;
  strategyInstruments: Array<{ schemeName: string; type: 'mutual_fund' | 'index_fund' | 'yahoo_finance' | 'fixed_return' }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const initialModalState: ModalState = {
  visible: false,
  transactions: [],
  date: '',
  xirr: 0,
  strategyName: '',
  strategyInstruments: []
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getFundName = (schemeCode: number, funds: mfapiMutualFund[]): string => {
  const fund = funds.find(f => f.schemeCode === schemeCode);
  return fund ? fund.schemeName : String(schemeCode);
};

const getStrategyInstruments = (
  strategyName: string, 
  strategies: (SipStrategy | LumpsumStrategy)[], 
  funds: mfapiMutualFund[]
): Array<{ schemeName: string; type: 'mutual_fund' | 'index_fund' | 'yahoo_finance' | 'fixed_return' }> => {
  const idx = parseInt(strategyName.replace('Strategy ', '')) - 1;
  const strategy = strategies[idx];
  if (!strategy || !strategy.selectedInstruments) return [];
  
  return strategy.selectedInstruments
    .filter(inst => inst)
    .map(inst => {
      if (inst!.type === 'mutual_fund') {
        const fund = funds.find(f => f.schemeCode === inst!.schemeCode);
        return {
          schemeName: fund ? fund.schemeName : `Fund ${inst!.schemeCode}`,
          type: 'mutual_fund' as const
        };
      } else if (inst!.type === 'index_fund') {
        return {
          schemeName: inst!.displayName || inst!.name,
          type: 'index_fund' as const
        };
      } else if (inst!.type === 'yahoo_finance') {
        return {
          schemeName: inst!.displayName || inst!.symbol,
          type: 'yahoo_finance' as const
        };
      } else if (inst!.type === 'fixed_return') {
        return {
          schemeName: inst!.displayName || inst!.name,
          type: 'fixed_return' as const
        };
      }
      return {
        schemeName: `Unknown Instrument`,
        type: 'mutual_fund' as const
      };
    });
};

// ============================================================================
// CHART CONFIGURATION FUNCTIONS
// ============================================================================

const getBaseChartOptions = (title: string) => ({
  title: { text: title, style: CHART_STYLES.title },
  subtitle: {
    text: 'Click on any point to view transactions for a specific date',
    style: {
      fontSize: '12px',
      color: '#9ca3af',
      fontStyle: 'italic'
    }
  },
  credits: { enabled: false },
  chart: {
    backgroundColor: CHART_STYLES.colors.background,
    borderRadius: 8,
    spacing: [20, 20, 20, 20],
    events: {
      click: () => {} // Will be overridden in component
    }
  },
  legend: {
    enabled: true,
    itemStyle: CHART_STYLES.legend,
    itemHoverStyle: { color: '#1f2937' }
  }
});

const getStockChartOptions = (title: string, strategyXirrData: Record<string, any[]>, amount: number, chartView: 'xirr' | 'corpus', isLumpsum: boolean = false) => ({
  ...getBaseChartOptions(title),
  xAxis: {
    type: 'datetime',
    title: { text: 'Date', style: CHART_STYLES.axisTitle },
    labels: { style: CHART_STYLES.axisLabels },
    gridLineColor: CHART_STYLES.colors.gridLine,
    lineColor: CHART_STYLES.colors.line,
    tickColor: CHART_STYLES.colors.tick
  },
  yAxis: {
    opposite: false,
    title: {
      text: chartView === 'xirr' ? 'XIRR (%)' : 'Corpus Value (₹)',
      align: 'middle',
      rotation: -90,
      x: -10,
      style: CHART_STYLES.axisTitle
    },
    labels: {
      formatter: function (this: any) { 
        if (chartView === 'xirr') {
          return this.value + ' %';
        } else {
          return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(this.value);
        }
      },
      style: CHART_STYLES.axisLabels
    },
    gridLineColor: CHART_STYLES.colors.gridLine,
    lineColor: CHART_STYLES.colors.line,
    plotLines: chartView === 'xirr' ? [{ value: 0, width: 2, color: '#aaa', zIndex: 1 }] : []
  },
  rangeSelector: { enabled: false },
  navigator: STOCK_CHART_NAVIGATOR,
  scrollbar: STOCK_CHART_SCROLLBAR,
  tooltip: {
    shared: true,
    crosshairs: true,
    useHTML: true,
    backgroundColor: CHART_STYLES.colors.tooltipBackground,
    borderColor: CHART_STYLES.colors.tooltipBackground,
    borderRadius: 6,
    style: CHART_STYLES.tooltip,
    formatter: function (this: any) {
      let tooltipHTML = `<div style="font-size: 12px; color: #ffffff;"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>`;
      
      const sortedPoints = this.points ? 
        [...this.points].sort((a: any, b: any) => (b.y as number) - (a.y as number)) : [];
      
      sortedPoints.forEach((point: any) => {
        // Get the strategy data
        const strategyName = point.series.name;
        const pointDate = Highcharts.dateFormat('%Y-%m-%d', this.x);
        const xirrEntry = strategyXirrData[strategyName]?.find((row: any) => formatDate(row.date) === pointDate);
        
        // Get actual XIRR value from the entry (not from point.y which could be corpus)
        const xirrPercent = xirrEntry ? (xirrEntry.xirr * 100).toFixed(2) : '0.00';
        
        let corpusValue = 0;
        if (xirrEntry && xirrEntry.transactions) {
          if (isLumpsum) {
            // For lumpsum: sum sell transaction amounts to get total corpus
            corpusValue = xirrEntry.transactions
              .filter((tx: any) => tx.type === 'sell')
              .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0);
          } else {
            // For SIP: sum all final values from sell transactions
            corpusValue = xirrEntry.transactions
              .filter((tx: any) => tx.type === 'sell')
              .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0);
          }
        }
        
        const color = point.series.color;
        if (chartView === 'xirr') {
          tooltipHTML += `<span style="color:${color}">●</span> ${point.series.name}: <strong>${xirrPercent}%</strong><br/>`;
        } else {
          const formattedCorpus = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(corpusValue);
          tooltipHTML += `<span style="color:${color}">●</span> ${point.series.name}: <strong>${formattedCorpus}</strong> <span style="color:#aaa">(${xirrPercent}%)</span><br/>`;
        }
      });
      
      tooltipHTML += '<br/><span style="color:#9ca3af; font-size: 11px; font-style: italic;">Click for details</span>';
      
      return tooltipHTML + '</div>';
    }
  },
  plotOptions: {
    series: {
      cursor: 'pointer',
      animation: false,
      marker: { 
        enabled: false,
        states: { hover: { enabled: true, radius: 5 } }
      },
      states: { hover: { lineWidthPlus: 1 } },
      point: {
        events: {
          click: function (this: Highcharts.Point) {
            // Will be overridden in component
          }
        }
      }
    }
  }
});

const getStrategySeries = (strategyXirrData: Record<string, any[]>, COLORS: string[], chartView: 'xirr' | 'corpus', isLumpsum: boolean = false) => {
  const allDates = getAllDates(strategyXirrData);
  return Object.entries(strategyXirrData).map(([strategyName, data], idx) => {
    const dateToValue: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      if (chartView === 'xirr') {
        dateToValue[formatDate(row.date)] = row.xirr * 100;
      } else {
        // Calculate corpus
        let corpusValue = 0;
        if (row.transactions) {
          corpusValue = row.transactions
            .filter((tx: any) => tx.type === 'sell')
            .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0);
        }
        dateToValue[formatDate(row.date)] = corpusValue;
      }
    });
    
    const seriesData = allDates.map(date => {
      const value = dateToValue[date];
      return value !== undefined ? [new Date(date).getTime(), value] : null;
    }).filter(point => point !== null);
    
    return {
      name: strategyName,
      data: seriesData,
      type: 'line',
      color: COLORS[idx % COLORS.length],
      marker: { enabled: false },
      showInNavigator: true,
    };
  });
};

export const MultiFundCharts: React.FC<MultiFundChartsProps> = ({
  navDatas,
  lumpsumStrategyXirrData,
  sipStrategyXirrData,
  funds,
  COLORS,
  sipStrategies,
  lumpsumStrategies,
  years,
  amount,
  chartView,
  isLumpsum = false,
}) => {
  const [modal, setModal] = useState<ModalState>(initialModalState);

  // Use the appropriate data source based on mode
  const strategyXirrData = isLumpsum ? lumpsumStrategyXirrData : sipStrategyXirrData;
  const strategies = isLumpsum ? lumpsumStrategies : sipStrategies;

  const handlePointClick = (strategyName: string, pointDate: string) => {
    const xirrEntry = (strategyXirrData?.[strategyName] || []).find((row: any) => formatDate(row.date) === pointDate);
    if (xirrEntry) {
      const strategyInstruments = getStrategyInstruments(strategyName, strategies || [], funds);
      const strategyIdx = parseInt(strategyName.replace('Strategy ', '')) - 1;
      
      let transactionsWithNil = xirrEntry.transactions || [];
      
      if (strategies && strategies[strategyIdx]) {
        // Extract NAV data list for this strategy from navDatas
        const navDataList: any[][] = [];
        const strategy = strategies[strategyIdx];
        
        if (strategy.selectedInstruments) {
          for (const inst of strategy.selectedInstruments) {
            if (!inst) continue;
            
            let identifier: string = '';
            switch (inst.type) {
              case 'mutual_fund':
                identifier = `${strategyIdx}_${inst.schemeCode}`;
                break;
              case 'index_fund':
                identifier = `${strategyIdx}_${inst.indexName}`;
                break;
              case 'yahoo_finance':
                identifier = `${strategyIdx}_${inst.symbol}`;
                break;
              case 'fixed_return':
                identifier = `${strategyIdx}_fixed_${inst.annualReturnPercentage}`;
                break;
              case 'inflation':
                identifier = `${strategyIdx}_inflation_${inst.countryCode}`;
                break;
            }
            
            const navData = (navDatas as any)[identifier];
            if (navData) {
              navDataList.push(navData);
            }
          }
        }
        
        // Recalculate transactions with nil included
        if (navDataList.length > 0) {
          const targetDate = new Date(pointDate);
          
          if (isLumpsum) {
            // Lumpsum recalculation
            const lumpsumStrategy = strategy as LumpsumStrategy;
            const baseAmount = chartView === 'corpus' ? amount : 100;
            const recalculated = recalculateLumpsumTransactionsForDate(
              navDataList,
              targetDate,
              years,
              lumpsumStrategy.allocations,
              baseAmount
            );
            
            if (recalculated) {
              transactionsWithNil = recalculated;
            }
          } else {
            // SIP recalculation
            const sipStrategy = strategy as SipStrategy;
            const baseSipAmount = chartView === 'corpus' ? amount : 100;
            const recalculated = recalculateTransactionsForDate(
              navDataList,
              targetDate,
              years,
              sipStrategy.allocations,
              sipStrategy.rebalancingEnabled,
              sipStrategy.rebalancingThreshold,
              sipStrategy.stepUpEnabled,
              sipStrategy.stepUpPercentage,
              baseSipAmount
            );
            
            if (recalculated) {
              transactionsWithNil = recalculated;
            }
          }
        }
      }
      
      setModal({
        visible: true,
        transactions: transactionsWithNil,
        date: pointDate,
        xirr: xirrEntry.xirr,
        strategyName,
        strategyInstruments,
      });
    }
  };

  const closeModal = () => setModal(initialModalState);

  const chartTitle = chartView === 'xirr' 
    ? `${isLumpsum ? 'Lumpsum' : 'SIP'} XIRR - Rolling ${years}Y` 
    : `${isLumpsum ? 'Lumpsum' : 'SIP'} Corpus Value - Rolling ${years}Y`;
  
  const chartOptions = {
    ...getStockChartOptions(chartTitle, strategyXirrData || {}, amount, chartView, isLumpsum),
    series: getStrategySeries(strategyXirrData || {}, COLORS, chartView, isLumpsum),
    chart: {
      ...getStockChartOptions(chartTitle, strategyXirrData || {}, amount, chartView, isLumpsum).chart,
      height: 500,
      zooming: { mouseWheel: false },
      events: { click: closeModal }
    },
    plotOptions: {
      series: {
        ...getStockChartOptions(chartTitle, strategyXirrData || {}, amount, chartView, isLumpsum).plotOptions.series,
        point: {
          events: {
            click: function (this: Highcharts.Point) {
              const series = this.series;
              const strategyName = series.name;
              const pointDate = Highcharts.dateFormat('%Y-%m-%d', this.x as number);
              handlePointClick(strategyName, pointDate);
            }
          }
        }
      }
    }
  };

  return (
    <Block marginTop="2rem">
      <TransactionModal {...modal} onClose={closeModal} funds={modal.strategyInstruments} />
      <Block marginTop="1.5rem" position="relative">
        <Block position="absolute" top="8px" right="8px" $style={{ zIndex: 10 }}>
          <HelpButton topic="rolling-xirr" />
        </Block>
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={chartOptions}
        />
      </Block>
      
      {/* Return Distribution Histogram */}
      {strategyXirrData && (
        <ReturnDistributionChart 
          strategyXirrData={strategyXirrData} 
          COLORS={COLORS} 
          years={years}
          chartView={chartView}
        />
      )}
      
      {/* Volatility Chart */}
      {strategyXirrData && (
        <VolatilityChart sipStrategyXirrData={strategyXirrData} COLORS={COLORS} years={years} />
      )}
    </Block>
  );
}; 