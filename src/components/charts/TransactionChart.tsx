import React, { useMemo } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { CHART_STYLES, COLORS } from '../../constants';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR } from '../../utils/stockChartConfig';
import { Transaction } from '../../utils/calculations/sipRollingXirr/types';
import { buildTransactionChartData, FundSeries } from './transactionChartData';

// Base Web-aligned palette for per-fund series (kept distinct from existing COLORS)
const BASEWEB_SERIES_COLORS = [
  '#FFB020', // amber
  '#0B6E4F', // deep green
  '#9B51E0', // violet
  '#D64545', // red
  '#1192E8', // blue-cyan
  '#8D6E63', // brown
  '#6C5B7B', // muted purple
] as const;

interface TransactionChartProps {
  transactions: Transaction[];
  portfolioName?: string;
  funds?: Array<{ schemeName: string }>;
}

export const TransactionChart: React.FC<TransactionChartProps> = ({ 
  transactions,
  portfolioName,
  funds
}) => {
  // Extract portfolio index and get its color
  const portfolioIdx = portfolioName ? parseInt(portfolioName.replace('Portfolio ', '')) - 1 : 0;
  const portfolioColor = COLORS[portfolioIdx % COLORS.length];

  // Process transactions for the chart
  const { totals, perFund, rebalancePlotLines } = useMemo(
    () => buildTransactionChartData(transactions),
    [transactions]
  );

  // Choose colors from Base Web palette (already distinct from totals palette)
  const getFundColor = (fundIdx: number) => {
    const base = BASEWEB_SERIES_COLORS[fundIdx % BASEWEB_SERIES_COLORS.length];
    return base;
  };

  // Build per-fund series (investment + value)
  const fundSeries = useMemo(() => {
    if (perFund.length <= 1) return [];

    const fundMeta = (funds ?? []).map((fund, idx) => ({
      fundIdx: idx,
      name: fund.schemeName || `Fund ${idx + 1}`,
      color: getFundColor(idx)
    }));

    return perFund.flatMap(fundData => {
      const meta = fundMeta.find(m => m.fundIdx === fundData.fundIdx);
      const baseColor = meta?.color ?? getFundColor(fundData.fundIdx);
      // Small brighten to keep hue stable (avoid drifting amber -> yellow)
      const investmentColor = (Highcharts.color(baseColor)?.brighten(0.1).get() as string) ?? baseColor;
      const fundName = meta?.name ?? `Fund ${fundData.fundIdx + 1}`;

      return [
        {
          name: `${fundName} (Investment)`,
          type: 'line' as const,
          step: 'left',
          data: fundData.data.map(d => [d.date.getTime(), d.cumulativeInvestment]),
          color: investmentColor,
          visible: false
        },
        {
          name: `${fundName} (Value)`,
          type: 'line' as const,
          data: fundData.data.map(d => [d.date.getTime(), d.currentValue]),
          color: baseColor, // darker than investment
          visible: false
        }
      ];
    });
  }, [perFund, funds]);

  const combinedSeries = useMemo(() => ([
    {
      name: 'Total (Investment)',
      type: 'line',
      step: 'left',
      data: totals.map(d => [d.date.getTime(), d.cumulativeInvestment]),
      color: '#5A5A5A'  // Gray for invested amount
    },
    {
      name: 'Total (Value)',
      type: 'line',
      data: totals.map(d => [d.date.getTime(), d.currentValue]),
      color: portfolioColor  // Use portfolio's color
    },
    ...fundSeries
  ]), [totals, fundSeries, portfolioColor]);

  // Create chart options
  const chartOptions = useMemo(() => ({
    chart: {
      backgroundColor: CHART_STYLES.colors.background,
      borderRadius: 8,
      spacing: [20, 20, 20, 20],
      height: 600,
    },
    title: {
      text: 'Investment vs Value',
      style: CHART_STYLES.title
    },
    credits: { enabled: false },
    xAxis: {
      type: 'datetime',
      title: { text: 'Date', style: CHART_STYLES.axisTitle },
      labels: { style: CHART_STYLES.axisLabels },
      gridLineColor: CHART_STYLES.colors.gridLine,
      lineColor: CHART_STYLES.colors.line,
      tickColor: CHART_STYLES.colors.tick,
      plotLines: rebalancePlotLines
    },
    yAxis: {
      opposite: false,
      title: {
        text: 'Amount (₹)',
        style: CHART_STYLES.axisTitle
      },
      labels: {
        formatter: function (this: any) {
          return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(this.value);
        },
        style: CHART_STYLES.axisLabels
      },
      gridLineColor: CHART_STYLES.colors.gridLine,
      lineColor: CHART_STYLES.colors.line
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
        let html = `<div style="font-size: 12px; color: #ffffff;"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>`;
        
        // Sort points by value (highest first)
        const sortedPoints = this.points ? 
          [...this.points].sort((a: any, b: any) => (b.y as number) - (a.y as number)) : [];
        
        sortedPoints.forEach((point: any) => {
          const value = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(point.y);
          html += `<span style="color:${point.series.color}">●</span> ${point.series.name}: <strong>${value}</strong><br/>`;
        });
        return html + '</div>';
      }
    },
    legend: {
      enabled: true,
      itemStyle: CHART_STYLES.legend,
      itemHoverStyle: { color: '#1f2937' }
    },
    plotOptions: {
      line: {
        marker: { 
          enabled: false,
          states: { hover: { enabled: true, radius: 5 } }
        },
        animation: false
      },
      series: {
        showInNavigator: true
      }
    },
    series: combinedSeries
  }), [combinedSeries]);

  return (
    <Block width="50%" margin="0 auto">
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'stockChart'}
        options={chartOptions}
      />
    </Block>
  );
};

