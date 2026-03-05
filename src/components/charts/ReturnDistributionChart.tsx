import React, { useMemo } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { HeadingSmall, ParagraphSmall } from 'baseui/typography';
import { Table } from 'baseui/table-semantic';
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

  const statsData = useMemo(() => {
    const entries = Object.entries(portfolioXirrData || {});

    return entries.map(([portfolioName, data], idx) => {
      const values = (data || [])
        .map((row: any) => computeValue(row))
        .filter((val: number | null): val is number => val !== null);

      if (!values.length) return null;

      const sorted = [...values].sort((a, b) => a - b);
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      const max = sorted[sorted.length - 1];
      const min = sorted[0];

      const total = values.length;
      const negative = (values.filter(v => v < 0).length / total) * 100;
      const zeroTo5 = (values.filter(v => v >= 0 && v < 5).length / total) * 100;
      const fiveTo10 = (values.filter(v => v >= 5 && v < 10).length / total) * 100;
      const tenTo20 = (values.filter(v => v >= 10 && v < 20).length / total) * 100;
      const moreThan20 = (values.filter(v => v >= 20).length / total) * 100;

      return {
        portfolioName,
        color: COLORS[idx % COLORS.length],
        avg, median, max, min,
        negative, zeroTo5, fiveTo10, tenTo20, moreThan20,
      };
    }).filter(Boolean) as Array<{
      portfolioName: string; color: string;
      avg: number; median: number; max: number; min: number;
      negative: number; zeroTo5: number; fiveTo10: number; tenTo20: number; moreThan20: number;
    }>;
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
      tickColor: CHART_STYLES.colors.tick,
      plotLines: chartView === 'xirr' ? [{
        value: 0,
        color: '#6b7280',
        dashStyle: 'Dash',
        width: 1,
        zIndex: 5
      }] : []
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

  const isXirr = chartView === 'xirr';

  const fmt = (v: number) =>
    isXirr ? `${v.toFixed(2)}%` : formatCurrency(v, 0);

  const pct = (v: number) => `${v.toFixed(2)}%`;

  const portfolioCol = (row: typeof statsData[number]) => (
    <span key="name"><span style={{ color: row.color, marginRight: 6 }}>●</span>{row.portfolioName}</span>
  );

  const ranked = (
    values: number[],
    formatted: string[],
    higherIsBetter: boolean,
  ) => {
    if (values.length < 2) return formatted.map(f => <span>{f}</span>);
    const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
    return values.map((v, i) => (
      <span key={i} style={{
        color: v === best ? '#16a34a' : undefined,
        fontWeight: v === best ? 600 : undefined,
      }}>{formatted[i]}</span>
    ));
  };

  const statsKeys = ['avg', 'median', 'max', 'min'] as const;
  const statsColumns = ['Portfolio', 'Average', 'Median', 'Maximum', 'Minimum'];
  const statsRanked = statsKeys.map(key =>
    ranked(statsData.map(r => r[key]), statsData.map(r => fmt(r[key])), true)
  );
  const statsTableData = statsData.map((row, ri) => [
    portfolioCol(row), ...statsKeys.map((_, ci) => statsRanked[ci][ri]),
  ]);

  const distKeys = ['negative', 'zeroTo5', 'fiveTo10', 'tenTo20', 'moreThan20'] as const;
  const distRankable: Record<string, boolean> = { negative: true };
  const distHigherIsBetter: Record<string, boolean> = { negative: false };
  const distColumns = ['Portfolio', 'Negative', '0 - 5%', '5 - 10%', '10 - 20%', '> 20%'];
  const distCells = distKeys.map(key =>
    distRankable[key]
      ? ranked(statsData.map(r => r[key]), statsData.map(r => pct(r[key])), distHigherIsBetter[key])
      : statsData.map(r => <span>{pct(r[key])}</span>)
  );
  const distTableData = statsData.map((row, ri) => [
    portfolioCol(row), ...distKeys.map((_, ci) => distCells[ci][ri]),
  ]);

  return (
    <Block marginTop="2rem">
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

      {statsData.length > 0 && (
        <Block marginTop="scale800" display="flex" flexDirection={['column', 'column', 'row']}
          justifyContent="center" gridGap="scale600">
          <Block $style={{ overflowX: 'auto' }}>
            <ParagraphSmall marginTop="0" marginBottom="scale300" $style={{ fontWeight: 600, textAlign: 'center' }}>
              {isXirr ? 'Return Statistics (%)' : 'Corpus Statistics'}
            </ParagraphSmall>
            <Table columns={statsColumns} data={statsTableData} divider="grid" size="compact" />
          </Block>
          {isXirr && (
            <Block $style={{ overflowX: 'auto' }}>
              <ParagraphSmall marginTop="0" marginBottom="scale300" $style={{ fontWeight: 600, textAlign: 'center' }}>
                Return Distribution (% of times)
              </ParagraphSmall>
              <Table columns={distColumns} data={distTableData} divider="grid" size="compact" />
            </Block>
          )}
        </Block>
      )}
    </Block>
  );
};

