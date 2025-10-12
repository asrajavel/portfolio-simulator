import React, { useState } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { Portfolio } from '../../types/portfolio';
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
  sipXirrDatas: Record<string, any[]>;
  funds: mfapiMutualFund[];
  COLORS: string[];
  portfolios: Portfolio[];
  years: number;
}

interface ModalState {
  visible: boolean;
  transactions: { fundIdx: number; nav: number; when: Date; units: number; amount: number; type: 'buy' | 'sell'; allocationPercentage?: number }[];
  date: string;
  xirr: number;
  portfolioName: string;
  portfolioFunds: Array<{ schemeName: string; type: 'mutual_fund' | 'index_fund' | 'yahoo_finance' }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const initialModalState: ModalState = {
  visible: false,
  transactions: [],
  date: '',
  xirr: 0,
  portfolioName: '',
  portfolioFunds: []
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getFundName = (schemeCode: number, funds: mfapiMutualFund[]): string => {
  const fund = funds.find(f => f.schemeCode === schemeCode);
  return fund ? fund.schemeName : String(schemeCode);
};

const getPortfolioFunds = (
  portfolioName: string, 
  portfolios: Portfolio[], 
  funds: mfapiMutualFund[]
): Array<{ schemeName: string; type: 'mutual_fund' | 'index_fund' | 'yahoo_finance' }> => {
  const idx = parseInt(portfolioName.replace('Portfolio ', '')) - 1;
  const portfolio = portfolios[idx];
  if (!portfolio || !portfolio.selectedInstruments) return [];
  
  return portfolio.selectedInstruments
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

const getStockChartOptions = (title: string) => ({
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
      text: 'XIRR (%)',
      align: 'middle',
      rotation: -90,
      x: -10,
      style: CHART_STYLES.axisTitle
    },
    labels: {
      formatter: function (this: any) { return this.value + ' %'; },
      style: CHART_STYLES.axisLabels
    },
    gridLineColor: CHART_STYLES.colors.gridLine,
    lineColor: CHART_STYLES.colors.line,
    plotLines: [{ value: 0, width: 2, color: '#aaa', zIndex: 1 }]
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
        const formattedValue = (point.y as number).toFixed(2) + " %";
        const color = point.series.color;
        tooltipHTML += `<span style="color:${color}">●</span> ${point.series.name}: <strong>${formattedValue}</strong><br/>`;
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

const getSipSeries = (sipXirrDatas: Record<string, any[]>, COLORS: string[]) => {
  const allDates = getAllDates(sipXirrDatas);
  return Object.entries(sipXirrDatas).map(([portfolioName, data], idx) => {
    const dateToXirr: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      dateToXirr[formatDate(row.date)] = row.xirr * 100;
    });
    
    const seriesData = allDates.map(date => {
      const xirr = dateToXirr[date];
      return xirr !== undefined ? [new Date(date).getTime(), xirr] : null;
    }).filter(point => point !== null);
    
    return {
      name: portfolioName,
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
  sipXirrDatas,
  funds,
  COLORS,
  portfolios,
  years,
}) => {
  const [modal, setModal] = useState<ModalState>(initialModalState);

  const handlePointClick = (portfolioName: string, pointDate: string) => {
    const xirrEntry = (sipXirrDatas[portfolioName] || []).find((row: any) => formatDate(row.date) === pointDate);
    if (xirrEntry) {
      const portfolioFunds = getPortfolioFunds(portfolioName, portfolios, funds);
      setModal({
        visible: true,
        transactions: xirrEntry.transactions || [],
        date: pointDate,
        xirr: xirrEntry.xirr,
        portfolioName,
        portfolioFunds,
      });
    }
  };

  const closeModal = () => setModal(initialModalState);

  const chartOptions = {
    ...getStockChartOptions(`SIP Rolling ${years}Y XIRR`),
    series: getSipSeries(sipXirrDatas, COLORS),
    chart: {
      ...getStockChartOptions(`SIP Rolling ${years}Y XIRR`).chart,
      height: 500,
      zooming: { mouseWheel: false },
      events: { click: closeModal }
    },
    plotOptions: {
      series: {
        ...getStockChartOptions(`SIP Rolling ${years}Y XIRR`).plotOptions.series,
        point: {
          events: {
            click: function (this: Highcharts.Point) {
              const series = this.series;
              const portfolioName = series.name;
              const pointDate = Highcharts.dateFormat('%Y-%m-%d', this.x as number);
              handlePointClick(portfolioName, pointDate);
            }
          }
        }
      }
    }
  };

  return (
    <Block marginTop="2rem">
      <TransactionModal {...modal} onClose={closeModal} funds={modal.portfolioFunds} />
      <Block marginTop="1.5rem">
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={chartOptions}
        />
      </Block>
      
      {/* Volatility Chart */}
      <VolatilityChart sipXirrDatas={sipXirrDatas} COLORS={COLORS} years={years} />
    </Block>
  );
}; 