import React, { useState } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { SipPortfolio } from '../../types/sipPortfolio';
import { LumpsumPortfolio } from '../../types/lumpsumPortfolio';
import { AssetType } from '../../types/asset';
import { Block } from 'baseui/block';
import { HeadingSmall, ParagraphSmall } from 'baseui/typography';
import { useHelp } from '../help';
import { TransactionModal } from '../modals/TransactionModal';
import { CHART_STYLES } from '../../constants';
import { VolatilityChart } from './VolatilityChart';
import { ReturnDistributionChart } from './ReturnDistributionChart';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR, formatDate, getAllDates } from '../../utils/stockChartConfig';
import { recalculateTransactionsForDate } from '../../utils/calculations/sipRollingXirr';
import { recalculateLumpsumTransactionsForDate } from '../../utils/calculations/lumpSumRollingXirr';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MultiAssetChartsProps {
  navDatas: Record<string, any[]>;
  lumpsumPortfolioXirrData?: Record<string, any[]>;
  sipPortfolioXirrData?: Record<string, any[]>;
  funds: mfapiMutualFund[];
  COLORS: string[];
  sipPortfolios?: SipPortfolio[];
  lumpsumPortfolios?: LumpsumPortfolio[];
  years: number;
  amount: number; // Can be sipAmount or lumpsumAmount
  chartView: 'xirr' | 'corpus';
  isLumpsum: boolean;
}

interface ModalState {
  visible: boolean;
  transactions: { fundIdx: number; nav: number; when: Date; units: number; amount: number; type: 'buy' | 'sell' | 'rebalance' | 'nil'; cumulativeUnits: number; currentValue: number; allocationPercentage?: number }[];
  date: string;
  xirr: number;
  portfolioName: string;
  portfolioAssets: Array<{ schemeName: string; type: AssetType }>;
  chartView: 'xirr' | 'corpus';
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
  portfolioAssets: [],
  chartView: 'xirr'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getFundName = (schemeCode: number, funds: mfapiMutualFund[]): string => {
  const fund = funds.find(f => f.schemeCode === schemeCode);
  return fund ? fund.schemeName : String(schemeCode);
};

const getPortfolioAssets = (
  portfolioName: string, 
  portfolios: (SipPortfolio | LumpsumPortfolio)[], 
  funds: mfapiMutualFund[]
): Array<{ schemeName: string; type: AssetType }> => {
  const idx = parseInt(portfolioName.replace('Portfolio ', '')) - 1;
  const portfolio = portfolios[idx];
  if (!portfolio || !portfolio.selectedAssets) return [];
  
  return portfolio.selectedAssets
    .filter(asset => asset)
    .map(asset => {
      if (asset!.type === 'mutual_fund') {
        const fund = funds.find(f => f.schemeCode === asset!.schemeCode);
        return {
          schemeName: fund ? fund.schemeName : `Fund ${asset!.schemeCode}`,
          type: 'mutual_fund' as const
        };
      } else if (asset!.type === 'index_fund') {
        return {
          schemeName: asset!.displayName || asset!.name,
          type: 'index_fund' as const
        };
      } else if (asset!.type === 'yahoo_finance') {
        return {
          schemeName: asset!.displayName || asset!.symbol,
          type: 'yahoo_finance' as const
        };
      } else if (asset!.type === 'fixed_return') {
        return {
          schemeName: asset!.displayName || asset!.name,
          type: 'fixed_return' as const
        };
      } else if (asset!.type === 'inflation') {
        return {
          schemeName: asset!.displayName || asset!.name,
          type: 'inflation' as const
        };
      }
      return {
        schemeName: `Unknown Asset`,
        type: 'mutual_fund' as const
      };
    });
};

// ============================================================================
// CHART CONFIGURATION FUNCTIONS
// ============================================================================

const getBaseChartOptions = () => ({
  title: { text: undefined },
  subtitle: { text: undefined },
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

const getStockChartOptions = (portfolioXirrData: Record<string, any[]>, amount: number, chartView: 'xirr' | 'corpus', isLumpsum: boolean = false) => ({
  ...getBaseChartOptions(),
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
    plotLines: chartView === 'xirr' ? [{ value: 0, color: '#6b7280', dashStyle: 'Dash', width: 1, zIndex: 5 }] : []
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
        // Get the portfolio data
        const portfolioName = point.series.name;
        const pointDate = Highcharts.dateFormat('%Y-%m-%d', this.x);
        const xirrEntry = portfolioXirrData[portfolioName]?.find((row: any) => formatDate(row.date) === pointDate);
        
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

const getPortfolioSeries = (portfolioXirrData: Record<string, any[]>, COLORS: string[], chartView: 'xirr' | 'corpus', isLumpsum: boolean = false) => {
  const allDates = getAllDates(portfolioXirrData);
  return Object.entries(portfolioXirrData).map(([portfolioName, data], idx) => {
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
      name: portfolioName,
      data: seriesData,
      type: 'line',
      color: COLORS[idx % COLORS.length],
      marker: { enabled: false },
      showInNavigator: true,
    };
  });
};

export const MultiAssetCharts: React.FC<MultiAssetChartsProps> = ({
  navDatas,
  lumpsumPortfolioXirrData,
  sipPortfolioXirrData,
  funds,
  COLORS,
  sipPortfolios,
  lumpsumPortfolios,
  years,
  amount,
  chartView,
  isLumpsum,
}) => {
  const [modal, setModal] = useState<ModalState>(initialModalState);
  const { openHelp } = useHelp();

  // Use the appropriate data source based on mode
  const portfolioXirrData = isLumpsum ? lumpsumPortfolioXirrData : sipPortfolioXirrData;
  const portfolios = isLumpsum ? lumpsumPortfolios : sipPortfolios;

  const handlePointClick = (portfolioName: string, pointDate: string) => {
    const xirrEntry = (portfolioXirrData?.[portfolioName] || []).find((row: any) => formatDate(row.date) === pointDate);
    if (xirrEntry) {
      const portfolioAssets = getPortfolioAssets(portfolioName, portfolios || [], funds);
      const portfolioIdx = parseInt(portfolioName.replace('Portfolio ', '')) - 1;
      
      let transactionsWithNil = xirrEntry.transactions || [];
      
      if (portfolios && portfolios[portfolioIdx]) {
        // Extract NAV data list for this portfolio from navDatas
        const navDataList: any[][] = [];
        const portfolio = portfolios[portfolioIdx];
        
        if (portfolio.selectedAssets) {
          for (const asset of portfolio.selectedAssets) {
            if (!asset) continue;
            
            let identifier: string = '';
            switch (asset.type) {
              case 'mutual_fund':
                identifier = `${portfolioIdx}_${asset.schemeCode}`;
                break;
              case 'index_fund':
                identifier = `${portfolioIdx}_${asset.indexName}`;
                break;
              case 'yahoo_finance':
                identifier = `${portfolioIdx}_${asset.symbol}`;
                break;
              case 'fixed_return':
                identifier = `${portfolioIdx}_fixed_${asset.annualReturnPercentage}`;
                break;
              case 'inflation':
                identifier = `${portfolioIdx}_inflation_${asset.countryCode}`;
                break;
            }
            
            const navData = navDatas[identifier];
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
            const lumpsumPortfolio = portfolio as LumpsumPortfolio;
            const baseAmount = chartView === 'corpus' ? amount : 100;
            const recalculated = recalculateLumpsumTransactionsForDate(
              navDataList,
              targetDate,
              years,
              lumpsumPortfolio.allocations,
              baseAmount
            );
            
            if (recalculated) {
              transactionsWithNil = recalculated;
            }
          } else {
            // SIP recalculation
            const sipPortfolio = portfolio as SipPortfolio;
            const baseSipAmount = chartView === 'corpus' ? amount : 100;
            const recalculated = recalculateTransactionsForDate(
              navDataList,
              targetDate,
              years,
              sipPortfolio.allocations,
              sipPortfolio.rebalancingEnabled,
              sipPortfolio.rebalancingThreshold,
              sipPortfolio.stepUpEnabled,
              sipPortfolio.stepUpPercentage,
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
        portfolioName,
        portfolioAssets,
        chartView,
      });
    }
  };

  const closeModal = () => setModal(initialModalState);

  const chartTitle = chartView === 'xirr' 
    ? `${isLumpsum ? 'Lumpsum' : 'SIP'} XIRR - Rolling ${years}Y` 
    : `${isLumpsum ? 'Lumpsum' : 'SIP'} Corpus Value - Rolling ${years}Y`;
  
  const chartOptions = {
    ...getStockChartOptions(portfolioXirrData || {}, amount, chartView, isLumpsum),
    series: getPortfolioSeries(portfolioXirrData || {}, COLORS, chartView, isLumpsum),
    chart: {
      ...getStockChartOptions(portfolioXirrData || {}, amount, chartView, isLumpsum).chart,
      height: 500,
      zooming: { mouseWheel: false },
      events: { click: closeModal }
    },
    plotOptions: {
      series: {
        ...getStockChartOptions(portfolioXirrData || {}, amount, chartView, isLumpsum).plotOptions.series,
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
      <TransactionModal {...modal} onClose={closeModal} funds={modal.portfolioAssets} />
      
      {/* Chart Title and Subtitle */}
      <Block marginBottom="scale400" $style={{ textAlign: 'center' }}>
        <HeadingSmall marginTop="0" marginBottom="scale200">{chartTitle}</HeadingSmall>
        <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="0">
          Each point shows the return if your investment ended on that date. Click any point to see detailed transaction history.
        </ParagraphSmall>
        <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="0">
          Read{' '}
          <span 
            onClick={() => openHelp('rolling-xirr')} 
            style={{ color: '#276EF1', cursor: 'pointer' }}
          >
            help
          </span>{' '}
          to know more.
        </ParagraphSmall>
      </Block>
      
      <Block>
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={chartOptions}
        />
      </Block>
      
      {/* Return Distribution Histogram */}
      {portfolioXirrData && (
        <ReturnDistributionChart 
          portfolioXirrData={portfolioXirrData} 
          COLORS={COLORS} 
          years={years}
          chartView={chartView}
        />
      )}
      
      {/* Volatility Chart */}
      {portfolioXirrData && (
        <VolatilityChart sipPortfolioXirrData={portfolioXirrData} COLORS={COLORS} years={years} />
      )}
    </Block>
  );
}; 