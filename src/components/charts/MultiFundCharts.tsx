import React, { useState } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { Portfolio } from '../../types/portfolio';
import { Block } from 'baseui/block';
import { TransactionModal } from '../modals/TransactionModal';

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

const CHART_STYLES = {
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  axisTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  axisLabels: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  legend: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151'
  },
  tooltip: {
    fontSize: '12px',
    color: '#ffffff'
  },
  colors: {
    gridLine: '#f3f4f6',
    line: '#e5e7eb',
    tick: '#e5e7eb',
    background: '#ffffff',
    tooltipBackground: '#1f2937'
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const getFundName = (schemeCode: number, funds: mfapiMutualFund[]): string => {
  const fund = funds.find(f => f.schemeCode === schemeCode);
  return fund ? fund.schemeName : String(schemeCode);
};

const getAllDates = (sipXirrDatas: Record<string, any[]>): string[] => {
  const allDates = Object.values(sipXirrDatas).flatMap(arr =>
    Array.isArray(arr) ? arr.map(row => formatDate(row.date)) : []
  );
  return Array.from(new Set(allDates)).sort();
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
  navigator: {
    enabled: true,
    height: 40,
    margin: 10,
    maskFill: 'rgba(107, 114, 128, 0.1)',
    outlineColor: CHART_STYLES.colors.line,
    outlineWidth: 1,
    handles: {
      backgroundColor: CHART_STYLES.colors.background,
      borderColor: '#d1d5db'
    },
    xAxis: {
      gridLineColor: CHART_STYLES.colors.gridLine,
      labels: { style: { color: '#6b7280', fontSize: '11px' } }
    },
    series: { lineColor: '#6b7280', fillOpacity: 0.05 }
  },
  scrollbar: {
    enabled: true,
    barBackgroundColor: CHART_STYLES.colors.gridLine,
    barBorderColor: CHART_STYLES.colors.line,
    buttonBackgroundColor: CHART_STYLES.colors.background,
    buttonBorderColor: '#d1d5db',
    rifleColor: '#6b7280',
    trackBackgroundColor: '#f9fafb',
    trackBorderColor: CHART_STYLES.colors.line
  },
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
    </Block>
  );
}; 