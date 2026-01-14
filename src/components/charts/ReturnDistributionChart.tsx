import React, { useMemo } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { HeadingSmall, ParagraphSmall } from 'baseui/typography';
import { useHelp } from '../help';
import { CHART_STYLES } from '../../constants';
import { formatCurrency } from '../../utils/numberFormat';

interface ReturnDistributionChartProps {
  portfolioXirrData: Record<string, any[]>;
  COLORS: string[];
  years: number;
  chartView: 'xirr' | 'corpus';
}

export const ReturnDistributionChart: React.FC<ReturnDistributionChartProps> = ({
  portfolioXirrData,
  COLORS,
  years,
  chartView
}) => {
  const { openHelp } = useHelp();
  
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
    const BINS = 20;
    const entries = Object.entries(portfolioXirrData || {});

    const preparedValues = entries.map(([portfolioName, data], idx) => {
      const values = (data || [])
        .map((row: any) => computeValue(row))
        .filter((val: number | null): val is number => val !== null);

      return {
        portfolioName,
        color: COLORS[idx % COLORS.length],
        values
      };
    });

    const allValues = preparedValues.flatMap(item => item.values);
    if (!allValues.length) return [];

    let globalMin = Math.min(...allValues);
    let globalMax = Math.max(...allValues);

    if (globalMin === globalMax) {
      globalMin = globalMin - 0.5;
      globalMax = globalMax + 0.5;
    }

    const binWidth = (globalMax - globalMin) / BINS || 1;

    const buildBins = (values: number[]) => {
      if (!values.length) return [];
      const counts = new Array(BINS).fill(0);
      values.forEach(value => {
        let binIndex = Math.floor((value - globalMin) / binWidth);
        binIndex = Math.min(Math.max(binIndex, 0), BINS - 1);
        counts[binIndex] += 1;
      });

      const total = values.length;
      return counts.map((count, idx) => {
        const binStart = globalMin + idx * binWidth;
        const binEnd = idx === BINS - 1 ? globalMax : binStart + binWidth;
        const percentage = total ? (count / total) * 100 : 0;
        return {
          x: binStart + binWidth / 2,
          y: percentage,
          binStart,
          binEnd
        };
      });
    };

    return preparedValues.flatMap(item => {
      if (!item.values.length) return [];
      return [
        {
          name: `${item.portfolioName}`,
          type: 'column' as const,
          data: buildBins(item.values),
          color: item.color,
          opacity: 0.7,
          borderWidth: 0,
          pointPadding: 0,
          groupPadding: 0,
          pointPlacement: 0,
          pointRange: binWidth,
          tooltip: {
            pointFormatter: function (this: any) {
              const startRaw = this.binStart;
              const endRaw = this.binEnd;

              const rangeLabel = chartView === 'xirr'
                ? `${startRaw.toFixed(2)}% to ${endRaw.toFixed(2)}%`
                : `${formatCurrency(startRaw, 0)} to ${formatCurrency(endRaw, 0)}`;

              const colorDot = `<span style="color:${this.series.color}">●</span>`;
              const percent = (this.y ?? 0).toFixed(2);
              return `${colorDot} ${this.series.name}: <strong>${percent}%</strong><br/><span style="color:#9ca3af">${rangeLabel}</span>`;
            }
          }
        }
      ];
    });
  }, [portfolioXirrData, COLORS, chartView]);

  if (!series.length) return null;

  const chartOptions = {
    chart: {
      backgroundColor: CHART_STYLES.colors.background,
      borderRadius: 8,
      spacing: [20, 20, 20, 20],
      height: 450
    },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      title: { text: chartView === 'xirr' ? 'XIRR (%)' : 'Corpus Value (₹)', style: CHART_STYLES.axisTitle },
      labels: { style: CHART_STYLES.axisLabels },
      gridLineColor: CHART_STYLES.colors.gridLine,
      lineColor: CHART_STYLES.colors.line,
      tickColor: CHART_STYLES.colors.tick
    },
    yAxis: {
      opposite: false,
      title: { text: 'Percentage (%)', style: CHART_STYLES.axisTitle },
      labels: {
        formatter: function (this: any) {
          return `${(this.value ?? 0).toFixed(1)}%`;
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
      style: CHART_STYLES.tooltip,
      headerFormat: '' // suppress default x-value header line
    },
    plotOptions: {
      column: {
        accessibility: { enabled: false },
        grouping: false
      },
      series: {
        animation: false,
        states: { hover: { enabled: true } }
      }
    },
    series
  };

  const chartTitle = `${chartView === 'xirr' ? 'Return' : 'Corpus'} Distribution - Rolling ${years}Y`;

  return (
    <Block marginTop="2rem">
      {/* Chart Title and Subtitle */}
      <Block marginBottom="scale400" $style={{ textAlign: 'center' }}>
        <HeadingSmall marginTop="0" marginBottom="scale200">{chartTitle}</HeadingSmall>
        <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="0">
          Shows what percentage of returns fell in each range — per portfolio, all bars add up to 100%.
        </ParagraphSmall>
        <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="0">
          Read{' '}
          <span 
            onClick={() => openHelp('histogram')} 
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
          options={chartOptions}
        />
      </Block>
    </Block>
  );
};

