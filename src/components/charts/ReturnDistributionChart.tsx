import React, { useMemo } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import histogramModule from 'highcharts/modules/histogram-bellcurve';
import { Block } from 'baseui/block';
import { CHART_STYLES } from '../../constants';
import { formatNumber, formatCurrency } from '../../utils/numberFormat';

// Initialize histogram module once (ESM/CommonJS safe)
if (typeof Highcharts === 'object') {
  const initHistogram =
    (histogramModule as unknown as { default?: (H: typeof Highcharts) => void }).default ||
    (histogramModule as unknown as (H: typeof Highcharts) => void);
  if (typeof initHistogram === 'function') {
    initHistogram(Highcharts);
  }
}

interface ReturnDistributionChartProps {
  strategyXirrData: Record<string, any[]>;
  COLORS: string[];
  years: number;
  chartView: 'xirr' | 'corpus';
}

export const ReturnDistributionChart: React.FC<ReturnDistributionChartProps> = ({
  strategyXirrData,
  COLORS,
  years,
  chartView
}) => {
  const computeValue = (row: any): number | null => {
    if (chartView === 'xirr') {
      return typeof row.xirr === 'number' ? row.xirr * 100 : null;
    }

    if (!row || !row.transactions) return null;

    // Corpus view: sum sell transaction amounts
    const sells = row.transactions.filter((tx: any) => tx?.type === 'sell');
    if (!sells.length) return null;
    const total = sells.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);
    return total || null;
  };

  const series = useMemo(() => {
    return Object.entries(strategyXirrData || {}).flatMap(([strategyName, data], idx) => {
      const values = (data || [])
        .map((row: any) => computeValue(row))
        .filter((val: number | null): val is number => val !== null);

      if (!values.length) return [];

      const baseId = `${strategyName.replace(/\s+/g, '-')}-data-${idx}`;
      const color = COLORS[idx % COLORS.length];

      return [
        {
          id: baseId,
          type: 'scatter' as const,
          data: values,
          showInLegend: false,
          visible: false
        },
        {
          name: `${strategyName}`,
          type: 'histogram' as const,
          baseSeries: baseId,
          color,
          opacity: 0.7,
          borderWidth: 0,
          binsNumber: 20,
          tooltip: {
            pointFormatter: function (this: any) {
              const startRaw = this.x;
              const endRaw = this.x2 || this.x;

              const rangeLabel = chartView === 'xirr'
                ? `${startRaw.toFixed(2)}% to ${endRaw.toFixed(2)}%`
                : `${formatCurrency(startRaw, 0)} to ${formatCurrency(endRaw, 0)}`;

              const colorDot = `<span style="color:${this.series.color}">●</span>`;
              const freq = formatNumber(this.y);
              return `${colorDot} ${this.series.name}: <strong>${freq}</strong><br/><span style="color:#9ca3af">${rangeLabel}</span>`;
            }
          }
        }
      ];
    });
  }, [strategyXirrData, COLORS]);

  if (!series.length) return null;

  const chartOptions = {
    chart: {
      backgroundColor: CHART_STYLES.colors.background,
      borderRadius: 8,
      spacing: [20, 20, 20, 20],
      height: 450
    },
    title: {
      text: `${chartView === 'xirr' ? 'Return' : 'Corpus'} Distribution - Rolling ${years}Y`,
      style: CHART_STYLES.title
    },
    credits: { enabled: false },
    legend: {
      enabled: true,
      itemStyle: CHART_STYLES.legend,
      itemHoverStyle: { color: '#1f2937' }
    },
    xAxis: {
      title: { text: chartView === 'xirr' ? 'XIRR (%)' : 'Corpus Value (₹)', style: CHART_STYLES.axisTitle },
      labels: { style: CHART_STYLES.axisLabels },
      gridLineColor: CHART_STYLES.colors.gridLine,
      lineColor: CHART_STYLES.colors.line,
      tickColor: CHART_STYLES.colors.tick
    },
    yAxis: {
      opposite: false,
      title: { text: 'Frequency', style: CHART_STYLES.axisTitle },
      labels: {
        formatter: function (this: any) {
          return formatNumber(this.value);
        },
        style: CHART_STYLES.axisLabels
      },
      gridLineColor: CHART_STYLES.colors.gridLine,
      lineColor: CHART_STYLES.colors.line
    },
    tooltip: {
      backgroundColor: CHART_STYLES.colors.tooltipBackground,
      borderColor: CHART_STYLES.colors.tooltipBackground,
      borderRadius: 6,
      useHTML: true,
      style: CHART_STYLES.tooltip
    },
    plotOptions: {
      histogram: {
        accessibility: { enabled: false }
      },
      series: {
        animation: false,
        states: { hover: { enabled: true } }
      }
    },
    series
  };

  return (
    <Block marginTop="2rem">
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
      />
    </Block>
  );
};

