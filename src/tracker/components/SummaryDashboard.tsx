import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { LabelLarge, LabelSmall, HeadingXSmall } from 'baseui/typography';
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
  const totalLocked = goalSummaries.reduce((sum, g) => sum + g.summary!.lockedValue, 0);

  const tableColumns = ['Goal', 'Value', 'XIRR'];
  const tableData = [
    ...goalSummaries.map((g) => {
      const s = g.summary!;
      return [
        <span key="n" style={{ fontWeight: 500 }}>{g.name}</span>,
        <span key="v" style={right}>{formatNumber(Math.round(s.totalValue))}</span>,
        <span key="x" style={{ ...right, color: returnColor(s.xirr), fontWeight: 600 }}>
          {formatXirr(s.xirr)}
        </span>,
      ];
    }),
    [
      <strong key="t">Total</strong>,
      <strong key="tv"><span style={right}>{formatNumber(Math.round(totalValue))}</span></strong>,
      '',
    ],
  ];

  const goalDataUnsorted = goalSummaries.map((g, idx) => ({
    name: g.name,
    data: (g.snapshots || []).map((s) => [s.date.getTime(), s.totalValue]),
    color: COLORS[idx % COLORS.length],
    latestValue: g.summary!.totalValue,
  }));
  const goalData = [...goalDataUnsorted].sort((a, b) => b.latestValue - a.latestValue);

  const chartSeries: Highcharts.SeriesOptionsType[] = goalData.map((g) => ({
    type: 'area' as const,
    name: g.name,
    data: g.data,
    color: g.color,
    lineWidth: 1.5,
    stacking: 'normal' as const,
    fillOpacity: 0.4,
  }));

  const lineSeries: Highcharts.SeriesOptionsType[] = goalData.map((g) => ({
    type: 'line' as const,
    name: g.name,
    data: g.data,
    color: g.color,
    lineWidth: 2,
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
        {totalLocked > 0 && (
          <LabelSmall
            overrides={{
              Block: {
                style: {
                  fontWeight: '600',
                  color: theme.colors.accent,
                },
              },
            }}
          >
            🔒 {formatNumber(Math.round(totalLocked))} locked
          </LabelSmall>
        )}
      </Block>

      <Block overrides={{ Block: { style: { overflowX: 'auto' } } }}>
        <Table
          columns={tableColumns}
          data={tableData}
          divider="grid"
          size="compact"
        />
      </Block>

      <Block marginTop="scale800" display="flex" justifyContent="center">
        <HighchartsReact highcharts={Highcharts} options={{
          chart: {
            type: 'pie',
            height: 280,
            width: 400,
            backgroundColor: 'transparent',
          },
          title: { text: '' },
          credits: { enabled: false },
          tooltip: { enabled: false },
          plotOptions: {
            pie: {
              innerSize: '50%',
              dataLabels: {
                enabled: true,
                formatter: function (this: any) {
                  const v = this.point.y;
                  const label = v >= 1e7
                    ? `${Math.round(v / 1e7)} Cr`
                    : `${Math.round(v / 1e5)} L`;
                  return `${this.point.name}<br/>${label}`;
                },
                style: {
                  fontSize: '12px',
                  fontWeight: '400',
                  textOutline: 'none',
                  fontFamily: CHART_STYLES.axisLabels.fontFamily,
                  color: CHART_STYLES.axisLabels.color,
                },
                distance: 15,
              },
            },
          },
          series: [{
            type: 'pie',
            data: goalData.map((g) => ({
              name: g.name,
              y: g.latestValue,
              color: g.color,
            })),
          }],
        }} />
      </Block>

      <Block marginTop="scale800" overrides={{ Block: { style: cardStyle } }}>
        <HeadingXSmall marginTop="scale300" marginBottom="0" paddingLeft="scale400">Goals</HeadingXSmall>
        <HighchartsReact highcharts={Highcharts} constructorType="stockChart" options={{
          ...chartOptions,
          series: lineSeries,
          tooltip: {
            ...chartOptions.tooltip,
            formatter: function (this: any) {
              let html = `<div style="font-size:12px;color:#fff"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>`;
              const sortedPoints = this.points ? [...this.points].sort((a: any, b: any) => b.y - a.y) : [];
              for (const point of sortedPoints) {
                html += `<span style="color:${point.series.color}">●</span> ${point.series.name}: <strong>${formatNumber(Math.round(point.y))}</strong><br/>`;
              }
              return html + '</div>';
            },
          },
        }} />
      </Block>
    </Block>
  );
};
