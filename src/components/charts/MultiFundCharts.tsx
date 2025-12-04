import React, { useState } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { SipStrategy } from '../../types/sipStrategy';
import { Block } from 'baseui/block';
import { TransactionModal } from '../modals/TransactionModal';
import { CHART_STYLES } from '../../constants';
import { VolatilityChart } from './VolatilityChart';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR, formatDate, getAllDates } from '../../utils/stockChartConfig';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MultiFundChartsProps {
  navDatas: Record<number, any[]>;
  lumpSumXirrDatas: Record<number, any[]>;
  sipStrategyXirrData: Record<string, any[]>;
  funds: mfapiMutualFund[];
  COLORS: string[];
  sipStrategies: SipStrategy[];
  years: number;
  sipAmount: number;
  chartView: 'xirr' | 'corpus';
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
  sipStrategies: SipStrategy[], 
  funds: mfapiMutualFund[]
): Array<{ schemeName: string; type: 'mutual_fund' | 'index_fund' | 'yahoo_finance' | 'fixed_return' }> => {
  const idx = parseInt(strategyName.replace('Strategy ', '')) - 1;
  const strategy = sipStrategies[idx];
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

const getStockChartOptions = (title: string, sipStrategyXirrData: Record<string, any[]>, sipAmount: number, chartView: 'xirr' | 'corpus') => ({
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
        const xirrEntry = sipStrategyXirrData[strategyName]?.find((row: any) => formatDate(row.date) === pointDate);
        
        // Get actual XIRR value from the entry (not from point.y which could be corpus)
        const xirrPercent = xirrEntry ? (xirrEntry.xirr * 100).toFixed(2) : '0.00';
        
        let corpusValue = 0;
        if (xirrEntry && xirrEntry.transactions) {
          // Sum all final values from sell transactions
          corpusValue = xirrEntry.transactions
            .filter((tx: any) => tx.type === 'sell')
            .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0);
        }
        
        const color = point.series.color;
        if (chartView === 'xirr') {
          tooltipHTML += `<span style="color:${color}">●</span> ${point.series.name}: <strong>${xirrPercent}%</strong><br/>`;
        } else {
          const formattedCorpus = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(corpusValue);
          tooltipHTML += `<span style="color:${color}">●</span> ${point.series.name}: <strong>${formattedCorpus}</strong> <span style="color:#aaa">(${xirrPercent}%)</span><br/>`;
        }
      });
      
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

const getSipSeries = (sipStrategyXirrData: Record<string, any[]>, COLORS: string[], chartView: 'xirr' | 'corpus') => {
  const allDates = getAllDates(sipStrategyXirrData);
  return Object.entries(sipStrategyXirrData).map(([strategyName, data], idx) => {
    const dateToValue: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      if (chartView === 'xirr') {
        dateToValue[formatDate(row.date)] = row.xirr * 100;
      } else {
        // Calculate corpus from sell transactions
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
  lumpSumXirrDatas,
  sipStrategyXirrData,
  funds,
  COLORS,
  sipStrategies,
  years,
  sipAmount,
  chartView,
}) => {
  const [modal, setModal] = useState<ModalState>(initialModalState);

  const handlePointClick = (strategyName: string, pointDate: string) => {
    const xirrEntry = (sipStrategyXirrData[strategyName] || []).find((row: any) => formatDate(row.date) === pointDate);
    if (xirrEntry) {
      const strategyInstruments = getStrategyInstruments(strategyName, sipStrategies, funds);
      setModal({
        visible: true,
        transactions: xirrEntry.transactions || [],
        date: pointDate,
        xirr: xirrEntry.xirr,
        strategyName,
        strategyInstruments,
      });
    }
  };

  const closeModal = () => setModal(initialModalState);

  const chartTitle = chartView === 'xirr' 
    ? `SIP Rolling ${years}Y XIRR` 
    : `SIP Corpus Value - Rolling ${years}Y`;
  
  const chartOptions = {
    ...getStockChartOptions(chartTitle, sipStrategyXirrData, sipAmount, chartView),
    series: getSipSeries(sipStrategyXirrData, COLORS, chartView),
    chart: {
      ...getStockChartOptions(chartTitle, sipStrategyXirrData, sipAmount, chartView).chart,
      height: 500,
      zooming: { mouseWheel: false },
      events: { click: closeModal }
    },
    plotOptions: {
      series: {
        ...getStockChartOptions(chartTitle, sipStrategyXirrData, sipAmount, chartView).plotOptions.series,
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
      <TransactionModal {...modal} onClose={closeModal} funds={modal.strategyInstruments} sipAmount={sipAmount} />
      <Block marginTop="1.5rem">
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={chartOptions}
        />
      </Block>
      
      {/* Volatility Chart */}
      <VolatilityChart sipStrategyXirrData={sipStrategyXirrData} COLORS={COLORS} years={years} />
    </Block>
  );
}; 