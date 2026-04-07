import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { LabelLarge, HeadingXSmall } from 'baseui/typography';
import { Table } from 'baseui/table-semantic';
import { ComputedGoalData, GoalData } from '../../types/tracker';
import { formatNumber } from '../../utils/numberFormat';
import { CHART_STYLES, COLORS } from '../../constants';

interface SummaryDashboardProps {
  goals: GoalData[];
  cache: Record<number, ComputedGoalData>;
}

const cardStyle = ({ $theme }: { $theme: any }) => ({
  borderRadius: $theme.borders.radius300,
  backgroundColor: $theme.colors.backgroundPrimary,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  border: `1px solid ${$theme.colors.borderOpaque}`,
  overflow: 'hidden' as const,
});

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({ goals, cache }) => {
  const [, theme] = useStyletron();
  const positiveColor = theme.colors.positive;
  const negativeColor = theme.colors.negative;
  const right = { textAlign: 'right' as const, display: 'block' };
  const returnColor = (v: number) => (v >= 0 ? positiveColor : negativeColor);
  const formatXirr = (v: number) => isNaN(v) ? 'N/A' : `${(v * 100).toFixed(2)}%`;

  const goalSummaries = goals.map((g, idx) => ({
    name: g.name,
    summary: cache[idx]?.summary,
    snapshots: cache[idx]?.dailySnapshots,
  })).filter((g) => g.summary);

  const totalInvestment = goalSummaries.reduce((sum, g) => sum + g.summary!.totalInvestment, 0);
  const totalValue = goalSummaries.reduce((sum, g) => sum + g.summary!.totalValue, 0);

  const tableColumns = ['Goal', 'Investment', 'Value', 'XIRR', 'Allocation'];
  const tableData = [
    ...goalSummaries.map((g) => {
      const s = g.summary!;
      const allocation = totalValue > 0 ? (s.totalValue / totalValue) * 100 : 0;
      return [
        <span key="n" style={{ fontWeight: 500 }}>{g.name}</span>,
        <span key="i" style={right}>{formatNumber(Math.round(s.totalInvestment))}</span>,
        <span key="v" style={right}>{formatNumber(Math.round(s.totalValue))}</span>,
        <span key="x" style={{ ...right, color: returnColor(s.xirr), fontWeight: 600 }}>
          {formatXirr(s.xirr)}
        </span>,
        <span key="a" style={right}>{allocation.toFixed(1)}%</span>,
      ];
    }),
    [
      <strong key="t">Total</strong>,
      <strong key="ti"><span style={right}>{formatNumber(Math.round(totalInvestment))}</span></strong>,
      <strong key="tv"><span style={right}>{formatNumber(Math.round(totalValue))}</span></strong>,
      '',
      '',
    ],
  ];

  const chartSeries: Highcharts.SeriesOptionsType[] = goalSummaries.map((g, idx) => ({
    type: 'area' as const,
    name: g.name,
    data: (g.snapshots || []).map((s) => [s.date.getTime(), s.totalValue]),
    color: COLORS[idx % COLORS.length],
    lineWidth: 1.5,
    stacking: 'normal' as const,
    fillOpacity: 0.4,
  }));

  const chartOptions: Highcharts.Options = {
    title: { text: undefined },
    credits: { enabled: false },
    chart: {
      backgroundColor: CHART_STYLES.colors.background,
      borderRadius: 8,
      spacing: [10, 20, 20, 20],
      height: 400,
      zooming: { mouseWheel: false },
    },
    xAxis: {
      type: 'datetime',
      labels: { style: CHART_STYLES.axisLabels },
      gridLineColor: CHART_STYLES.colors.gridLine,
      lineColor: CHART_STYLES.colors.line,
      tickColor: CHART_STYLES.colors.tick,
    },
    yAxis: {
      title: { text: '' },
      labels: {
        style: CHART_STYLES.axisLabels,
        formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
          return formatNumber(this.value as number);
        },
      },
      gridLineColor: CHART_STYLES.colors.gridLine,
      opposite: false,
    },
    rangeSelector: { enabled: false },
    navigator: { enabled: false },
    scrollbar: { enabled: false },
    tooltip: {
      shared: true,
      crosshairs: true,
      useHTML: true,
      backgroundColor: CHART_STYLES.colors.tooltipBackground,
      borderColor: CHART_STYLES.colors.tooltipBackground,
      borderRadius: 6,
      style: CHART_STYLES.tooltip,
      formatter: function (this: any) {
        let html = `<div style="font-size:12px;color:#fff"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>`;
        const sortedPoints = this.points ? [...this.points].sort((a: any, b: any) => b.y - a.y) : [];
        for (const point of sortedPoints) {
          html += `<span style="color:${point.series.color}">●</span> ${point.series.name}: <strong>${formatNumber(Math.round(point.y))}</strong><br/>`;
        }
        const total = this.points?.[0]?.total ?? 0;
        html += `<span style="margin-top:4px;display:inline-block">Total: <strong>${formatNumber(Math.round(total))}</strong></span><br/>`;
        return html + '</div>';
      },
    },
    plotOptions: {
      series: {
        animation: false,
        marker: { enabled: false, states: { hover: { enabled: true, radius: 4 } } },
      },
    },
    series: chartSeries,
    legend: { enabled: true, itemStyle: CHART_STYLES.legend },
  };

  return (
    <Block>
      <Block display="flex" flexDirection="column" alignItems="center" marginBottom="scale600">
        <LabelLarge
          overrides={{
            Block: {
              style: {
                fontSize: '36px',
                fontWeight: '700',
                color: CHART_STYLES.title.color,
                lineHeight: '1.1',
                marginTop: '0',
                marginBottom: '8px',
              },
            },
          }}
        >
          {formatNumber(Math.round(totalValue))}
        </LabelLarge>
      </Block>

      <Block overrides={{ Block: { style: { overflowX: 'auto' } } }}>
        <Table
          columns={tableColumns}
          data={tableData}
          divider="grid"
          size="compact"
        />
      </Block>

      <Block marginTop="scale800" overrides={{ Block: { style: cardStyle } }}>
        <HeadingXSmall marginTop="scale300" marginBottom="0" paddingLeft="scale400">Goals</HeadingXSmall>
        <HighchartsReact highcharts={Highcharts} constructorType="stockChart" options={chartOptions} />
      </Block>
    </Block>
  );
};
